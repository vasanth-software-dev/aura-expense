import { Request, Response } from 'express';
import { prisma } from '../../database/client';
import { ApiResponse } from '../../utils/api-response';
import { GmailService } from './gmail.service';
import { OutlookService } from './outlook.service';
import { QueueService } from '../../queues/queue.service';
import { logger } from '../../utils/logger';

export class EmailAccountController {
  public static async getAccounts(req: Request, res: Response) {
    const userId = req.user!.id;

    const accounts = await prisma.emailAccount.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        email: true,
        status: true,
        lastSyncAt: true,
        createdAt: true,
        syncRuns: {
          take: 3,
          orderBy: { startedAt: 'desc' },
          select: {
            id: true,
            status: true,
            emailsChecked: true,
            transactionsFound: true,
            duplicatesSkipped: true,
            needsReview: true,
            startedAt: true,
            completedAt: true,
          },
        },
      },
    });

    return ApiResponse.success(res, accounts);
  }

  public static async connectGmail(req: Request, res: Response) {
    const userId = req.user!.id;
    const state = Buffer.from(JSON.stringify({ userId, provider: 'GMAIL', nonce: Date.now() })).toString('base64');
    const authUrl = GmailService.getAuthUrl(state);

    return ApiResponse.success(res, { authUrl });
  }

  public static async handleGmailCallback(req: Request, res: Response) {
    const { code, state } = req.query;
    if (!code || !state) {
      return ApiResponse.error(res, 'INVALID_CALLBACK', 'Missing authorization code or state', 400);
    }

    try {
      const stateData = JSON.parse(Buffer.from(String(state), 'base64').toString('utf8'));
      const userId = stateData.userId;

      const { email, accessTokenEncrypted, refreshTokenEncrypted, expiresAt } =
        await GmailService.exchangeCodeForTokens(String(code));

      const account = await prisma.emailAccount.upsert({
        where: {
          userId_provider_email: {
            userId,
            provider: 'GMAIL',
            email,
          },
        },
        create: {
          userId,
          provider: 'GMAIL',
          email,
          accessTokenEncrypted,
          refreshTokenEncrypted,
          tokenExpiresAt: expiresAt,
          status: 'CONNECTED',
        },
        update: {
          accessTokenEncrypted,
          refreshTokenEncrypted,
          tokenExpiresAt: expiresAt,
          status: 'CONNECTED',
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CONNECT_EMAIL',
          detailsMasked: { provider: 'GMAIL', email },
        },
      });

      // Trigger initial background sync
      await QueueService.dispatchSync({
        userId,
        emailAccountId: account.id,
        provider: 'GMAIL',
      });

      return ApiResponse.success(res, { connected: true, email: account.email });
    } catch (err: any) {
      logger.error('Failed to process Gmail OAuth callback', err);
      return ApiResponse.error(res, 'OAUTH_FAILED', 'Could not connect your Google account', 400);
    }
  }

  public static async connectOutlook(req: Request, res: Response) {
    const userId = req.user!.id;
    const state = Buffer.from(JSON.stringify({ userId, provider: 'OUTLOOK', nonce: Date.now() })).toString('base64');
    const authUrl = OutlookService.getAuthUrl(state);

    return ApiResponse.success(res, { authUrl });
  }

  public static async handleOutlookCallback(req: Request, res: Response) {
    const { code, state } = req.query;
    if (!code || !state) {
      return ApiResponse.error(res, 'INVALID_CALLBACK', 'Missing authorization code or state', 400);
    }

    try {
      const stateData = JSON.parse(Buffer.from(String(state), 'base64').toString('utf8'));
      const userId = stateData.userId;

      const { email, accessTokenEncrypted, refreshTokenEncrypted, expiresAt } =
        await OutlookService.exchangeCodeForTokens(String(code));

      const account = await prisma.emailAccount.upsert({
        where: {
          userId_provider_email: {
            userId,
            provider: 'OUTLOOK',
            email,
          },
        },
        create: {
          userId,
          provider: 'OUTLOOK',
          email,
          accessTokenEncrypted,
          refreshTokenEncrypted,
          tokenExpiresAt: expiresAt,
          status: 'CONNECTED',
        },
        update: {
          accessTokenEncrypted,
          refreshTokenEncrypted,
          tokenExpiresAt: expiresAt,
          status: 'CONNECTED',
        },
      });

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CONNECT_EMAIL',
          detailsMasked: { provider: 'OUTLOOK', email },
        },
      });

      await QueueService.dispatchSync({
        userId,
        emailAccountId: account.id,
        provider: 'OUTLOOK',
      });

      return ApiResponse.success(res, { connected: true, email: account.email });
    } catch (err: any) {
      logger.error('Failed to process Outlook OAuth callback', err);
      return ApiResponse.error(res, 'OAUTH_FAILED', 'Could not connect your Microsoft account', 400);
    }
  }

  public static async triggerSync(req: Request, res: Response) {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const account = await prisma.emailAccount.findFirst({
      where: { id, userId },
    });
    if (!account) {
      return ApiResponse.error(res, 'ACCOUNT_NOT_FOUND', 'Email account not found', 404);
    }

    await QueueService.dispatchSync({
      userId,
      emailAccountId: account.id,
      provider: account.provider,
    });

    return ApiResponse.success(res, { message: 'Sync queued successfully' });
  }

  public static async disconnectAccount(req: Request, res: Response) {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const account = await prisma.emailAccount.findFirst({
      where: { id, userId },
    });
    if (!account) {
      return ApiResponse.error(res, 'ACCOUNT_NOT_FOUND', 'Email account not found', 404);
    }

    await prisma.emailAccount.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DISCONNECT_EMAIL',
        detailsMasked: { provider: account.provider, email: account.email },
      },
    });

    return ApiResponse.success(res, { disconnected: true });
  }
}

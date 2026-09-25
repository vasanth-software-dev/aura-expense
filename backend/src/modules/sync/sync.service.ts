import { prisma } from '../../database/client';
import { logger } from '../../utils/logger';
import { GmailService } from '../email/gmail.service';
import { OutlookService } from '../email/outlook.service';
import { Deduplicator, ExistingTransactionRecord } from '../engine/deduplicator';
import { TransferDetector } from '../engine/transfer-detector';
import { Categorizer } from '../engine/categorizer';
import { SyncJobData } from '../../queues/queue.service';

export class SyncService {
  public static async executeSync(data: SyncJobData): Promise<void> {
    const { userId, emailAccountId, provider } = data;

    const emailAccount = await prisma.emailAccount.findUnique({
      where: { id: emailAccountId },
    });
    if (!emailAccount || emailAccount.userId !== userId) {
      logger.warn(`Email account ${emailAccountId} not found for sync`);
      return;
    }

    // Update status to SYNCING
    await prisma.emailAccount.update({
      where: { id: emailAccountId },
      data: { status: 'SYNCING' },
    });

    const syncRun = await prisma.syncRun.create({
      data: {
        userId,
        emailAccountId,
        provider,
        status: 'SUCCESS',
        startedAt: new Date(),
      },
    });

    try {
      let syncResult;
      if (provider === 'GMAIL') {
        syncResult = await GmailService.syncTransactions({
          accessTokenEncrypted: emailAccount.accessTokenEncrypted || '',
          refreshTokenEncrypted: emailAccount.refreshTokenEncrypted || undefined,
          tokenExpiresAt: emailAccount.tokenExpiresAt || undefined,
          syncCursor: emailAccount.syncCursor || undefined,
        });
      } else {
        syncResult = await OutlookService.syncTransactions({
          accessTokenEncrypted: emailAccount.accessTokenEncrypted || '',
          refreshTokenEncrypted: emailAccount.refreshTokenEncrypted || undefined,
          tokenExpiresAt: emailAccount.tokenExpiresAt || undefined,
          syncCursor: emailAccount.syncCursor || undefined,
        });
      }

      // Preload categories and user rules
      const categories = await prisma.category.findMany({
        where: { OR: [{ userId: null }, { userId }] },
      });
      const userRules = await prisma.userCategoryRule.findMany({
        where: { userId },
        include: { category: true },
      });
      const userAccounts = await prisma.account.findMany({
        where: { userId },
      });

      // Preload recent transactions for deduplication & transfer detection (last 7 days)
      const recentTransactions = await prisma.transaction.findMany({
        where: {
          userId,
          transactionTime: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        select: {
          id: true,
          amount: true,
          type: true,
          transactionTime: true,
          upiReference: true,
          bankReference: true,
          merchant: true,
          source: true,
          accountId: true,
          isTransfer: true,
        },
      });

      const existingRecords: ExistingTransactionRecord[] = recentTransactions.map((tx) => ({
        id: tx.id,
        amount: Number(tx.amount),
        type: tx.type,
        transactionTime: tx.transactionTime,
        upiReference: tx.upiReference,
        bankReference: tx.bankReference,
        merchant: tx.merchant,
        source: tx.source,
      }));

      let duplicatesCount = 0;
      let reviewCount = 0;

      for (const normalized of syncResult.transactions) {
        // 1. Deduplication check
        const dedupResult = Deduplicator.checkDuplicate(normalized, existingRecords);

        if (dedupResult.isDuplicate && dedupResult.matchedTransactionId) {
          duplicatesCount++;
          // Save additional source pointing to existing transaction
          await prisma.transactionSource.create({
            data: {
              transactionId: dedupResult.matchedTransactionId,
              sourceType: normalized.source,
              externalId: normalized.sourceMessageId,
              messageSnippetMasked: normalized.description,
            },
          });
          continue;
        }

        // 2. Transfer detection
        const transferResult = TransferDetector.detectTransfer(
          normalized,
          userAccounts.map((a) => ({ id: a.id, maskLastFour: a.maskLastFour, institutionName: a.institutionName })),
          recentTransactions.map((t) => ({
            id: t.id,
            accountId: t.accountId,
            amount: Number(t.amount),
            type: t.type,
            transactionTime: t.transactionTime,
            isTransfer: t.isTransfer,
          }))
        );

        // 3. Categorization
        const catResult = Categorizer.categorize(
          normalized,
          categories.map((c) => ({ id: c.id, name: c.name, type: c.type })),
          userRules.map((r) => ({
            categoryId: r.categoryId,
            categoryName: r.category.name,
            matchField: r.matchField,
            matchPattern: r.matchPattern,
          }))
        );

        const status = catResult.confidence < 0.8 ? 'PENDING_REVIEW' : 'CONFIRMED';
        if (status === 'PENDING_REVIEW') reviewCount++;

        // Find matching user bank account if last 4 digits match
        const matchedAccount = normalized.accountLastFour
          ? userAccounts.find((a) => a.maskLastFour === normalized.accountLastFour)
          : undefined;

        // Create canonical transaction
        const createdTx = await prisma.transaction.create({
          data: {
            userId,
            accountId: matchedAccount?.id,
            categoryId: catResult.categoryId,
            amount: normalized.amount,
            currency: normalized.currency,
            type: normalized.type,
            merchant: normalized.merchant ?? null,
            description: normalized.description ?? null,
            paymentMethod: normalized.paymentMethod,
            transactionTime: normalized.transactionTime,
            upiReference: normalized.upiReference ?? null,
            source: normalized.source,
            sourceMessageId: normalized.sourceMessageId ?? null,
            confidence: catResult.confidence,
            isTransfer: transferResult.isTransfer,
            transferPairId: transferResult.pairedTransactionId ?? null,
            status,
            sources: {
              create: {
                sourceType: normalized.source,
                externalId: normalized.sourceMessageId ?? null,
                messageSnippetMasked: normalized.description ?? null,
              },
            },
          },
        });

        // If paired with another transfer transaction, update the pair as well
        if (transferResult.pairedTransactionId) {
          await prisma.transaction.update({
            where: { id: transferResult.pairedTransactionId },
            data: { isTransfer: true, transferPairId: createdTx.id },
          });
        }

        // Add to in-memory list for intra-batch deduplication
        existingRecords.push({
          id: createdTx.id,
          amount: normalized.amount,
          type: normalized.type,
          transactionTime: normalized.transactionTime,
          upiReference: normalized.upiReference ?? null,
          bankReference: normalized.bankReference ?? null,
          merchant: normalized.merchant ?? null,
          source: normalized.source,
        });
      }

      // Update sync run
      await prisma.syncRun.update({
        where: { id: syncRun.id },
        data: {
          status: 'SUCCESS',
          emailsChecked: syncResult.emailsChecked,
          transactionsFound: syncResult.transactions.length,
          duplicatesSkipped: duplicatesCount,
          needsReview: reviewCount,
          completedAt: new Date(),
        },
      });

      // Update email account status
      await prisma.emailAccount.update({
        where: { id: emailAccountId },
        data: {
          status: 'CONNECTED',
          lastSyncAt: new Date(),
          syncCursor: syncResult.newCursor || emailAccount.syncCursor,
          accessTokenEncrypted: syncResult.updatedAccessTokenEncrypted || emailAccount.accessTokenEncrypted,
        },
      });

      logger.info(`Sync completed for ${provider} account ${emailAccount.email}: ${syncResult.transactions.length} found, ${duplicatesCount} duplicates, ${reviewCount} needs review`);
    } catch (err: any) {
      logger.error(`Sync failed for email account ${emailAccountId}`, err);

      await prisma.syncRun.update({
        where: { id: syncRun.id },
        data: {
          status: 'FAILED',
          errorMessage: err.message || 'Sync failed',
          completedAt: new Date(),
        },
      });

      await prisma.emailAccount.update({
        where: { id: emailAccountId },
        data: { status: 'ERROR' },
      });
    }
  }
}

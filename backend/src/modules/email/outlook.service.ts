import { Client } from '@microsoft/microsoft-graph-client';
import { env } from '../../config/env';
import { decrypt, encrypt } from '../../utils/encryption';
import { logger } from '../../utils/logger';
import { EmailBankParser } from '../parsers/email/email-bank.parser';
import { NormalizedTransaction } from '../engine/normalizer';

export interface OutlookSyncOptions {
  accessTokenEncrypted: string;
  refreshTokenEncrypted?: string;
  tokenExpiresAt?: Date;
  syncCursor?: string;
  lookbackDays?: number;
}

export interface OutlookSyncResult {
  transactions: NormalizedTransaction[];
  newCursor?: string;
  emailsChecked: number;
  updatedAccessTokenEncrypted?: string;
}

export class OutlookService {
  /**
   * Generates Microsoft OAuth 2.0 authorization URL
   */
  public static getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: env.MICROSOFT_CLIENT_ID,
      response_type: 'code',
      redirect_uri: env.MICROSOFT_REDIRECT_URI,
      response_mode: 'query',
      scope: 'offline_access Mail.Read User.Read',
      state,
    });

    return `https://login.microsoftonline.com/${env.MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Exchanges Microsoft authorization code for tokens
   */
  public static async exchangeCodeForTokens(code: string): Promise<{
    email: string;
    accessTokenEncrypted: string;
    refreshTokenEncrypted?: string;
    expiresAt: Date;
  }> {
    const tokenEndpoint = `https://login.microsoftonline.com/${env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      client_id: env.MICROSOFT_CLIENT_ID,
      client_secret: env.MICROSOFT_CLIENT_SECRET,
      code,
      redirect_uri: env.MICROSOFT_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const err = await response.text();
      logger.error('Microsoft token exchange failed', err);
      throw new Error('OUTLOOK_TOKEN_EXCHANGE_FAILED');
    }

    const data = (await response.json()) as any;
    const accessToken = data.access_token;

    // Get user profile email
    const client = Client.init({
      authProvider: (done) => done(null, accessToken),
    });
    const user = await client.api('/me').get();
    const email = user.mail || user.userPrincipalName || 'unknown@outlook.com';

    return {
      email,
      accessTokenEncrypted: encrypt(accessToken),
      refreshTokenEncrypted: data.refresh_token ? encrypt(data.refresh_token) : undefined,
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
    };
  }

  /**
   * Synchronizes transaction emails from Microsoft Graph API
   */
  public static async syncTransactions(options: OutlookSyncOptions): Promise<OutlookSyncResult> {
    let accessToken = decrypt(options.accessTokenEncrypted);
    let updatedAccessTokenEncrypted: string | undefined;

    // Token refresh if expired
    if (options.refreshTokenEncrypted && options.tokenExpiresAt && new Date() >= options.tokenExpiresAt) {
      try {
        const tokenEndpoint = `https://login.microsoftonline.com/${env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`;
        const params = new URLSearchParams({
          client_id: env.MICROSOFT_CLIENT_ID,
          client_secret: env.MICROSOFT_CLIENT_SECRET,
          refresh_token: decrypt(options.refreshTokenEncrypted),
          grant_type: 'refresh_token',
        });

        const resp = await fetch(tokenEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });

        if (resp.ok) {
          const refreshed = (await resp.json()) as any;
          accessToken = refreshed.access_token;
          updatedAccessTokenEncrypted = encrypt(accessToken);
        }
      } catch (err) {
        logger.error('Failed to refresh Outlook access token', err);
        throw new Error('OUTLOOK_TOKEN_REFRESH_FAILED');
      }
    }

    const client = Client.init({
      authProvider: (done) => done(null, accessToken),
    });

    const days = options.lookbackDays || 30;
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let messagesResponse;
    try {
      messagesResponse = await client
        .api('/me/messages')
        .filter(`receivedDateTime ge ${sinceDate}`)
        .select('id,subject,bodyPreview,from,receivedDateTime')
        .top(50)
        .get();
    } catch (err) {
      logger.error('Failed to query Microsoft Graph messages', err);
      throw new Error('OUTLOOK_API_QUERY_FAILED');
    }

    const messages = messagesResponse.value || [];
    const transactions: NormalizedTransaction[] = [];
    let emailsChecked = 0;

    for (const msg of messages) {
      if (!msg.id) continue;
      emailsChecked++;

      try {
        const parsed = EmailBankParser.parse({
          messageId: msg.id,
          sender: msg.from?.emailAddress?.address || '',
          subject: msg.subject || '',
          bodySnippet: msg.bodyPreview || '',
          receivedAt: new Date(msg.receivedDateTime || Date.now()),
        });

        if (parsed) {
          transactions.push(parsed);
        }
      } catch (perMessageError) {
        logger.warn(`Failed to parse single Outlook email ${msg.id}, skipping safely`, perMessageError);
      }
    }

    return {
      transactions,
      newCursor: messagesResponse['@odata.nextLink'] || undefined,
      emailsChecked,
      updatedAccessTokenEncrypted,
    };
  }
}

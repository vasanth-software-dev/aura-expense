import { google } from 'googleapis';
import { env } from '../../config/env';
import { decrypt, encrypt } from '../../utils/encryption';
import { logger } from '../../utils/logger';
import { EmailBankParser } from '../parsers/email/email-bank.parser';
import { NormalizedTransaction } from '../engine/normalizer';

export interface GmailSyncOptions {
  accessTokenEncrypted: string;
  refreshTokenEncrypted?: string;
  tokenExpiresAt?: Date;
  syncCursor?: string; // historyId or query offset
  lookbackDays?: number;
}

export interface GmailSyncResult {
  transactions: NormalizedTransaction[];
  newCursor?: string;
  emailsChecked: number;
  updatedAccessTokenEncrypted?: string;
}

export class GmailService {
  private static getOAuth2Client() {
    return new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Generates real Google OAuth authorization URL with minimal read-only scope
   */
  public static getAuthUrl(state: string): string {
    const oauth2Client = this.getOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/userinfo.email'],
      state,
    });
  }

  /**
   * Exchanges authorization code for encrypted tokens
   */
  public static async exchangeCodeForTokens(code: string): Promise<{
    email: string;
    accessTokenEncrypted: string;
    refreshTokenEncrypted?: string;
    expiresAt: Date;
  }> {
    const oauth2Client = this.getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user profile email
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email || 'unknown@gmail.com';

    return {
      email,
      accessTokenEncrypted: encrypt(tokens.access_token || ''),
      refreshTokenEncrypted: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
      expiresAt: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
    };
  }

  /**
   * Synchronizes transaction emails from Gmail with isolated per-message error handling
   */
  public static async syncTransactions(options: GmailSyncOptions): Promise<GmailSyncResult> {
    const oauth2Client = this.getOAuth2Client();

    let accessToken = decrypt(options.accessTokenEncrypted);
    let updatedAccessTokenEncrypted: string | undefined;

    // Check if token expired and refresh if possible
    if (options.refreshTokenEncrypted && options.tokenExpiresAt && new Date() >= options.tokenExpiresAt) {
      try {
        oauth2Client.setCredentials({ refresh_token: decrypt(options.refreshTokenEncrypted) });
        const { credentials } = await oauth2Client.refreshAccessToken();
        accessToken = credentials.access_token || accessToken;
        updatedAccessTokenEncrypted = encrypt(accessToken);
      } catch (err) {
        logger.error('Failed to refresh Gmail access token', err);
        throw new Error('GMAIL_TOKEN_REFRESH_FAILED');
      }
    }

    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Targeted financial transaction search query
    const days = options.lookbackDays || 30;
    const query = `(debited OR credited OR UPI OR INR OR "Rs." OR transaction) newer_than:${days}d`;

    let messagesResponse;
    try {
      messagesResponse = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 50,
        pageToken: options.syncCursor,
      });
    } catch (err) {
      logger.error('Failed to query Gmail messages', err);
      throw new Error('GMAIL_API_QUERY_FAILED');
    }

    const messages = messagesResponse.data.messages || [];
    const transactions: NormalizedTransaction[] = [];
    let emailsChecked = 0;

    // Process each message with strict isolation
    for (const msg of messages) {
      if (!msg.id) continue;
      emailsChecked++;

      try {
        const msgDetail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full',
        });

        const headers = msgDetail.data.payload?.headers || [];
        const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value || '';
        const sender = headers.find((h) => h.name?.toLowerCase() === 'from')?.value || '';
        const dateHeader = headers.find((h) => h.name?.toLowerCase() === 'date')?.value;
        const receivedAt = dateHeader ? new Date(dateHeader) : new Date();

        const snippet = msgDetail.data.snippet || '';

        const parsed = EmailBankParser.parse({
          messageId: msg.id,
          sender,
          subject,
          bodySnippet: snippet,
          receivedAt,
        });

        if (parsed) {
          transactions.push(parsed);
        }
      } catch (perMessageError) {
        // Log sanitized error and continue with the remaining messages!
        logger.warn(`Failed to parse single email message ${msg.id}, skipping safely`, perMessageError);
      }
    }

    return {
      transactions,
      newCursor: messagesResponse.data.nextPageToken || undefined,
      emailsChecked,
      updatedAccessTokenEncrypted,
    };
  }
}

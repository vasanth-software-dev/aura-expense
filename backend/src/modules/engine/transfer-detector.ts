import { NormalizedTransaction } from './normalizer';

export interface UserAccountInfo {
  id: string;
  accountName?: string | null;
  maskLastFour?: string | null;
  institutionName?: string | null;
}

export interface RecentTransactionCandidate {
  id: string;
  accountId?: string | null;
  accountLastFour?: string | null;
  amount: number;
  type: string;
  transactionTime: Date;
  isTransfer: boolean;
}

export interface TransferDetectionResult {
  isTransfer: boolean;
  pairedTransactionId?: string;
  reason?: 'SELF_ACCOUNT_PAIR' | 'SELF_KEYWORD_MATCH';
}

export class TransferDetector {
  private static PAIRING_WINDOW_MS = 20 * 60 * 1000; // 20 minutes

  /**
   * Evaluates if incoming transaction is a transfer between user's own accounts
   */
  public static detectTransfer(
    incoming: NormalizedTransaction,
    userAccounts: UserAccountInfo[],
    recentTransactions: RecentTransactionCandidate[]
  ): TransferDetectionResult {
    const rawText = (incoming.rawText || '').toLowerCase();
    const description = (incoming.description || '').toLowerCase();
    const merchant = (incoming.merchant || '').toLowerCase();

    // 1. Check self-transfer keywords
    const selfKeywords = [
      'self transfer',
      'transfer to self',
      'own account',
      'to own a/c',
      'self a/c',
      'self-transfer',
    ];
    if (selfKeywords.some((kw) => rawText.includes(kw) || description.includes(kw) || merchant.includes(kw))) {
      return {
        isTransfer: true,
        reason: 'SELF_KEYWORD_MATCH',
      };
    }

    // 2. Cross-account pairing check
    // If incoming is DEBIT, search for recent CREDIT of equal amount from a different user account (or vice versa)
    const oppositeType = incoming.type === 'DEBIT' ? 'CREDIT' : 'DEBIT';

    for (const recent of recentTransactions) {
      if (recent.type !== oppositeType || recent.isTransfer) continue;

      const amountDiff = Math.abs(incoming.amount - recent.amount);
      if (amountDiff < 0.01) {
        const timeDiff = Math.abs(
          new Date(incoming.transactionTime).getTime() -
          new Date(recent.transactionTime).getTime()
        );

        if (timeDiff <= this.PAIRING_WINDOW_MS) {
          // Verify that they are from two distinct accounts belonging to this user
          const isDifferentAccount =
            !incoming.accountLastFour ||
            !recent.accountLastFour ||
            incoming.accountLastFour !== recent.accountLastFour;

          if (isDifferentAccount) {
            return {
              isTransfer: true,
              pairedTransactionId: recent.id,
              reason: 'SELF_ACCOUNT_PAIR',
            };
          }
        }
      }
    }

    return { isTransfer: false };
  }
}

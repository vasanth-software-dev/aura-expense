import { NormalizedTransaction } from './normalizer';

export interface ExistingTransactionRecord {
  id: string;
  amount: number;
  type: string;
  transactionTime: Date;
  upiReference?: string | null | undefined;
  bankReference?: string | null | undefined;
  accountLastFour?: string | null | undefined;
  merchant?: string | null | undefined;
  source: string;
}

export interface DeduplicationResult {
  isDuplicate: boolean;
  matchedTransactionId?: string;
  matchReason?: 'UPI_REF_EXACT' | 'BANK_REF_EXACT' | 'PROXIMITY_FUZZY';
  confidenceBoost?: number;
}

export class Deduplicator {
  private static PROXIMITY_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  /**
   * Checks whether incoming normalized transaction matches an existing transaction
   */
  public static checkDuplicate(
    incoming: NormalizedTransaction,
    existingList: ExistingTransactionRecord[]
  ): DeduplicationResult {
    for (const existing of existingList) {
      // 1. Strong match: UPI Reference
      if (
        incoming.upiReference &&
        existing.upiReference &&
        incoming.upiReference.trim() === existing.upiReference.trim()
      ) {
        return {
          isDuplicate: true,
          matchedTransactionId: existing.id,
          matchReason: 'UPI_REF_EXACT',
          confidenceBoost: 0.15,
        };
      }

      // 2. Strong match: Bank Reference
      if (
        incoming.bankReference &&
        existing.bankReference &&
        incoming.bankReference.trim() === existing.bankReference.trim()
      ) {
        return {
          isDuplicate: true,
          matchedTransactionId: existing.id,
          matchReason: 'BANK_REF_EXACT',
          confidenceBoost: 0.15,
        };
      }

      // 3. Proximity Fuzzy Match
      // Same amount, same type (DEBIT/CREDIT)
      const amountDiff = Math.abs(incoming.amount - existing.amount);
      if (amountDiff < 0.01 && incoming.type === existing.type) {
        const timeDiff = Math.abs(
          new Date(incoming.transactionTime).getTime() -
          new Date(existing.transactionTime).getTime()
        );

        if (timeDiff <= this.PROXIMITY_WINDOW_MS) {
          // Check account match if available
          const accountMatches =
            !incoming.accountLastFour ||
            !existing.accountLastFour ||
            incoming.accountLastFour === existing.accountLastFour;

          // Check merchant similarity if available
          const merchantMatches =
            !incoming.merchant ||
            !existing.merchant ||
            incoming.merchant.toLowerCase().includes(existing.merchant.toLowerCase()) ||
            existing.merchant.toLowerCase().includes(incoming.merchant.toLowerCase());

          if (accountMatches && merchantMatches) {
            return {
              isDuplicate: true,
              matchedTransactionId: existing.id,
              matchReason: 'PROXIMITY_FUZZY',
              confidenceBoost: 0.10,
            };
          }
        }
      }
    }

    return { isDuplicate: false };
  }
}

export type TransactionType = 'DEBIT' | 'CREDIT';

export type PaymentMethod =
  | 'UPI'
  | 'CASH'
  | 'DEBIT_CARD'
  | 'CREDIT_CARD'
  | 'BANK_TRANSFER'
  | 'ATM'
  | 'OTHER';

export type TransactionSourceType =
  | 'MANUAL'
  | 'SMS'
  | 'EMAIL'
  | 'CSV'
  | 'ACCOUNT_AGGREGATOR';

export interface NormalizedTransaction {
  amount: number;
  currency: string;
  type: TransactionType;
  merchant?: string;
  description?: string;
  paymentMethod: PaymentMethod;
  transactionTime: Date;
  accountLastFour?: string;
  institutionName?: string;
  upiReference?: string;
  bankReference?: string;
  source: TransactionSourceType;
  sourceMessageId?: string;
  rawText?: string;
  confidence: number; // 0.0 - 1.0
  isTransfer?: boolean;
}

export function cleanIndianAmount(rawAmount: string): number {
  if (!rawAmount) return 0;
  // Remove commas, currency symbols like ₹, Rs, Rs., INR
  const cleaned = rawAmount.replace(/[₹,\s]|(?:INR|Rs\.?)/gi, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

import { describe, it, expect } from 'vitest';
import { TransferDetector, RecentTransactionCandidate } from '../src/modules/engine/transfer-detector';
import { NormalizedTransaction } from '../src/modules/engine/normalizer';

describe('Transfer Detection Engine', () => {
  const baseTime = new Date('2026-09-25T11:00:00.000Z');

  const userAccounts = [
    { id: 'acc-hdfc', maskLastFour: '1234', institutionName: 'HDFC Bank' },
    { id: 'acc-sbi', maskLastFour: '9876', institutionName: 'State Bank of India' },
  ];

  it('should detect own-account transfer when DEBIT from Account A matches CREDIT to Account B', () => {
    const recentDebit: RecentTransactionCandidate = {
      id: 'tx-debit-hdfc',
      accountId: 'acc-hdfc',
      accountLastFour: '1234',
      amount: 10000.0,
      type: 'DEBIT',
      transactionTime: baseTime,
      isTransfer: false,
    };

    const incomingCredit: NormalizedTransaction = {
      amount: 10000.0,
      currency: 'INR',
      type: 'CREDIT',
      merchant: 'Transfer',
      paymentMethod: 'BANK_TRANSFER',
      transactionTime: new Date('2026-09-25T11:03:00.000Z'), // 3 min later
      accountLastFour: '9876', // SBI account
      source: 'SMS',
      confidence: 0.95,
    };

    const result = TransferDetector.detectTransfer(incomingCredit, userAccounts, [recentDebit]);
    expect(result.isTransfer).toBe(true);
    expect(result.pairedTransactionId).toBe('tx-debit-hdfc');
    expect(result.reason).toBe('SELF_ACCOUNT_PAIR');
  });

  it('should detect transfer based on self-transfer keywords', () => {
    const incomingSelf: NormalizedTransaction = {
      amount: 5000.0,
      currency: 'INR',
      type: 'DEBIT',
      merchant: 'Self Transfer',
      rawText: 'Debited INR 5000 from A/C 1234 towards self transfer to SBI',
      paymentMethod: 'UPI',
      transactionTime: baseTime,
      accountLastFour: '1234',
      source: 'SMS',
      confidence: 0.95,
    };

    const result = TransferDetector.detectTransfer(incomingSelf, userAccounts, []);
    expect(result.isTransfer).toBe(true);
    expect(result.reason).toBe('SELF_KEYWORD_MATCH');
  });

  it('should NOT mark regular merchant expense as transfer', () => {
    const merchantExpense: NormalizedTransaction = {
      amount: 438.0,
      currency: 'INR',
      type: 'DEBIT',
      merchant: 'Swiggy',
      paymentMethod: 'UPI',
      transactionTime: baseTime,
      accountLastFour: '1234',
      source: 'SMS',
      confidence: 0.95,
    };

    const result = TransferDetector.detectTransfer(merchantExpense, userAccounts, []);
    expect(result.isTransfer).toBe(false);
  });
});

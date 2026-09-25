import { describe, it, expect } from 'vitest';
import { Deduplicator, ExistingTransactionRecord } from '../src/modules/engine/deduplicator';
import { NormalizedTransaction } from '../src/modules/engine/normalizer';

describe('Deduplication Engine', () => {
  const baseTime = new Date('2026-09-25T10:00:00.000Z');

  const existingTx: ExistingTransactionRecord = {
    id: 'tx-existing-1',
    amount: 850.0,
    type: 'DEBIT',
    transactionTime: baseTime,
    upiReference: '123456789012',
    accountLastFour: '1234',
    merchant: 'Swiggy',
    source: 'SMS',
  };

  it('should detect duplicate when UPI reference matches exactly (SMS + Email)', () => {
    const incomingFromEmail: NormalizedTransaction = {
      amount: 850.0,
      currency: 'INR',
      type: 'DEBIT',
      merchant: 'Swiggy Order',
      paymentMethod: 'UPI',
      transactionTime: new Date('2026-09-25T10:01:00.000Z'), // 1 min later
      accountLastFour: '1234',
      upiReference: '123456789012', // same UPI reference
      source: 'EMAIL',
      confidence: 0.95,
    };

    const result = Deduplicator.checkDuplicate(incomingFromEmail, [existingTx]);
    expect(result.isDuplicate).toBe(true);
    expect(result.matchedTransactionId).toBe('tx-existing-1');
    expect(result.matchReason).toBe('UPI_REF_EXACT');
  });

  it('should detect duplicate by proximity when UPI ref is absent but amount, time, and merchant match', () => {
    const existingWithoutRef: ExistingTransactionRecord = {
      id: 'tx-card-1',
      amount: 799.0,
      type: 'DEBIT',
      transactionTime: baseTime,
      accountLastFour: '4444',
      merchant: 'Amazon India',
      source: 'SMS',
    };

    const incomingCard: NormalizedTransaction = {
      amount: 799.0,
      currency: 'INR',
      type: 'DEBIT',
      merchant: 'Amazon',
      paymentMethod: 'CREDIT_CARD',
      transactionTime: new Date('2026-09-25T10:04:00.000Z'), // 4 min later
      accountLastFour: '4444',
      source: 'EMAIL',
      confidence: 0.90,
    };

    const result = Deduplicator.checkDuplicate(incomingCard, [existingWithoutRef]);
    expect(result.isDuplicate).toBe(true);
    expect(result.matchedTransactionId).toBe('tx-card-1');
    expect(result.matchReason).toBe('PROXIMITY_FUZZY');
  });

  it('should NOT flag as duplicate when amount differs', () => {
    const incomingDifferentAmount: NormalizedTransaction = {
      amount: 950.0, // different amount
      currency: 'INR',
      type: 'DEBIT',
      merchant: 'Swiggy',
      paymentMethod: 'UPI',
      transactionTime: baseTime,
      accountLastFour: '1234',
      upiReference: '999999999999',
      source: 'EMAIL',
      confidence: 0.9,
    };

    const result = Deduplicator.checkDuplicate(incomingDifferentAmount, [existingTx]);
    expect(result.isDuplicate).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { Categorizer, CategoryLookupItem, CategoryRule } from '../src/modules/engine/categorizer';
import { NormalizedTransaction } from '../src/modules/engine/normalizer';

describe('Categorization Engine', () => {
  const categories: CategoryLookupItem[] = [
    { id: 'cat-food', name: 'Food & Dining', type: 'EXPENSE' },
    { id: 'cat-shop', name: 'Shopping', type: 'EXPENSE' },
    { id: 'cat-trans', name: 'Transportation', type: 'EXPENSE' },
    { id: 'cat-bills', name: 'Bills & Utilities', type: 'EXPENSE' },
    { id: 'cat-other', name: 'Other', type: 'EXPENSE' },
  ];

  it('should categorize based on user rule first (priority over directory)', () => {
    const userRules: CategoryRule[] = [
      {
        categoryId: 'cat-bills',
        categoryName: 'Bills & Utilities',
        matchField: 'MERCHANT',
        matchPattern: 'amazon', // User customized Amazon to Bills (e.g. AWS or Prime recharge)
      },
    ];

    const tx: NormalizedTransaction = {
      amount: 499.0,
      currency: 'INR',
      type: 'DEBIT',
      merchant: 'Amazon Pay',
      paymentMethod: 'UPI',
      transactionTime: new Date(),
      source: 'SMS',
      confidence: 0.9,
    };

    const result = Categorizer.categorize(tx, categories, userRules);
    expect(result.matchedBy).toBe('USER_RULE');
    expect(result.categoryName).toBe('Bills & Utilities');
    expect(result.confidence).toBe(1.0);
  });

  it('should categorize known merchants using merchant directory', () => {
    const tx: NormalizedTransaction = {
      amount: 438.0,
      currency: 'INR',
      type: 'DEBIT',
      merchant: 'Swiggy',
      paymentMethod: 'UPI',
      transactionTime: new Date(),
      source: 'SMS',
      confidence: 0.9,
    };

    const result = Categorizer.categorize(tx, categories, []);
    expect(result.matchedBy).toBe('MERCHANT_DIRECTORY');
    expect(result.categoryName).toBe('Food & Dining');
    expect(result.confidence).toBe(0.95);
  });

  it('should fallback to Other with low confidence for unknown merchant', () => {
    const tx: NormalizedTransaction = {
      amount: 1500.0,
      currency: 'INR',
      type: 'DEBIT',
      merchant: 'ABC Enterprise 123',
      paymentMethod: 'UPI',
      transactionTime: new Date(),
      source: 'SMS',
      confidence: 0.8,
    };

    const result = Categorizer.categorize(tx, categories, []);
    expect(result.matchedBy).toBe('FALLBACK');
    expect(result.categoryName).toBe('Other');
    expect(result.confidence).toBe(0.5);
  });
});

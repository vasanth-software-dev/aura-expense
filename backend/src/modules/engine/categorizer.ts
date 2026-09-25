import { KNOWN_MERCHANT_DIRECTORY } from '../../config/constants';
import { NormalizedTransaction } from './normalizer';

export interface CategoryRule {
  categoryId: string;
  categoryName: string;
  matchField: 'MERCHANT' | 'DESCRIPTION' | 'SENDER';
  matchPattern: string;
}

export interface CategoryLookupItem {
  id: string;
  name: string;
  type: string;
}

export interface CategorizationResult {
  categoryId?: string;
  categoryName: string;
  confidence: number;
  matchedBy: 'USER_RULE' | 'MERCHANT_DIRECTORY' | 'KEYWORD_HEURISTIC' | 'FALLBACK';
}

export class Categorizer {
  /**
   * Evaluates best category for incoming transaction across multi-tier pipeline
   */
  public static categorize(
    tx: NormalizedTransaction,
    categories: CategoryLookupItem[],
    userRules: CategoryRule[]
  ): CategorizationResult {
    const merchant = (tx.merchant || '').toLowerCase().trim();
    const description = (tx.description || '').toLowerCase();
    const raw = (tx.rawText || '').toLowerCase();

    const findCatByName = (name: string) => categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
    const otherCat = findCatByName('Other') || categories[0];

    // Stage 1: User's custom learned rules (highest priority)
    for (const rule of userRules) {
      const pattern = rule.matchPattern.toLowerCase();
      if (rule.matchField === 'MERCHANT' && merchant && merchant.includes(pattern)) {
        return {
          categoryId: rule.categoryId,
          categoryName: rule.categoryName,
          confidence: 1.0,
          matchedBy: 'USER_RULE',
        };
      }
      if (rule.matchField === 'DESCRIPTION' && (description.includes(pattern) || raw.includes(pattern))) {
        return {
          categoryId: rule.categoryId,
          categoryName: rule.categoryName,
          confidence: 1.0,
          matchedBy: 'USER_RULE',
        };
      }
    }

    // Stage 2: Known Merchant Directory lookup
    if (merchant) {
      for (const [knownKey, catName] of Object.entries(KNOWN_MERCHANT_DIRECTORY)) {
        if (merchant.includes(knownKey)) {
          const cat = findCatByName(catName);
          return {
            categoryId: cat?.id,
            categoryName: catName,
            confidence: 0.95,
            matchedBy: 'MERCHANT_DIRECTORY',
          };
        }
      }
    }

    // Stage 3: Keyword heuristics on description and raw message
    const combined = `${merchant} ${description} ${raw}`;

    if (/\b(food|restaurant|dine|cafe|kitchen|bakery|burger|pizza|tea|coffee|mess)\b/i.test(combined)) {
      const cat = findCatByName('Food & Dining');
      return { categoryId: cat?.id, categoryName: 'Food & Dining', confidence: 0.85, matchedBy: 'KEYWORD_HEURISTIC' };
    }

    if (/\b(groceries|supermarket|mart|vegetable|fruits|dairy|milk)\b/i.test(combined)) {
      const cat = findCatByName('Groceries');
      return { categoryId: cat?.id, categoryName: 'Groceries', confidence: 0.85, matchedBy: 'KEYWORD_HEURISTIC' };
    }

    if (/\b(cab|taxi|fuel|petrol|diesel|toll|parking|metro|railway|irctc|bus)\b/i.test(combined)) {
      const cat = findCatByName('Transportation');
      return { categoryId: cat?.id, categoryName: 'Transportation', confidence: 0.85, matchedBy: 'KEYWORD_HEURISTIC' };
    }

    if (/\b(electricity|water|broadband|recharge|dth|gas|utility|bescom|tneb)\b/i.test(combined)) {
      const cat = findCatByName('Bills & Utilities');
      return { categoryId: cat?.id, categoryName: 'Bills & Utilities', confidence: 0.85, matchedBy: 'KEYWORD_HEURISTIC' };
    }

    if (/\b(salary|payroll|stipend|bonus)\b/i.test(combined) && tx.type === 'CREDIT') {
      const cat = findCatByName('Salary & Earnings');
      return { categoryId: cat?.id, categoryName: 'Salary & Earnings', confidence: 0.95, matchedBy: 'KEYWORD_HEURISTIC' };
    }

    if (/\b(hospital|clinic|pharmacy|medicine|doctor|diagnostic|lab)\b/i.test(combined)) {
      const cat = findCatByName('Health & Medical');
      return { categoryId: cat?.id, categoryName: 'Health & Medical', confidence: 0.85, matchedBy: 'KEYWORD_HEURISTIC' };
    }

    // Fallback: Low confidence category -> flagged for review queue
    return {
      categoryId: otherCat?.id,
      categoryName: otherCat?.name || 'Other',
      confidence: 0.50,
      matchedBy: 'FALLBACK',
    };
  }
}

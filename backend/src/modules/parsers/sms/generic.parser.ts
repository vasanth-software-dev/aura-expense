import { SmsParser, SmsParserInput } from './sms-parser.interface';
import { NormalizedTransaction, cleanIndianAmount, PaymentMethod, TransactionType } from '../../engine/normalizer';

export class GenericParser implements SmsParser {
  readonly bankName = 'Generic Bank';

  canHandle(_input: SmsParserInput): boolean {
    return true; // Universal fallback
  }

  parse(input: SmsParserInput): NormalizedTransaction | null {
    const text = input.body;

    // Must have financial debit or credit intent
    const isDebit = /\b(debited|spent|withdrawn|paid|transfer(?:red)? to|sent)\b/i.test(text);
    const isCredit = /\b(credited|received|deposited|transfer(?:red)? from|added)\b/i.test(text);
    if (!isDebit && !isCredit) return null;
    const type: TransactionType = isDebit ? 'DEBIT' : 'CREDIT';

    // Must match INR currency format
    const amountMatch = text.match(/(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (!amountMatch) return null;
    const amount = cleanIndianAmount(amountMatch[1]);
    if (amount <= 0) return null;

    // Detect Account/Card ending digits
    let accountLastFour: string | undefined;
    const acctMatch = text.match(/(?:A\/c|account|card|acct)(?:\s*(?:ending|no\.?|ending with)?\s*[*xX]*\s*(\d{4}))/i);
    if (acctMatch) {
      accountLastFour = acctMatch[1];
    }

    // Detect Payment method & UPI reference
    let paymentMethod: PaymentMethod = 'OTHER';
    let upiReference: string | undefined;

    const upiRefMatch = text.match(/(?:UPI(?:\s*Ref(?:\s*No\.?)?)?|Ref(?:\s*No\.?)?|UTR|URN|Txn\s*ID)\s*:?\s*(\d{10,14})/i);
    if (upiRefMatch) {
      upiReference = upiRefMatch[1];
      paymentMethod = 'UPI';
    } else if (/\bUPI\b|\bVPA\b/i.test(text)) {
      paymentMethod = 'UPI';
    } else if (/\bATM\b/i.test(text)) {
      paymentMethod = 'ATM';
    } else if (/\bcredit card\b/i.test(text)) {
      paymentMethod = 'CREDIT_CARD';
    } else if (/\bcard\b|\bdebit card\b/i.test(text)) {
      paymentMethod = 'DEBIT_CARD';
    } else if (/\bNEFT\b|\bIMPS\b|\bRTGS\b/i.test(text)) {
      paymentMethod = 'BANK_TRANSFER';
    }

    // Detect Merchant / Payee
    let merchant: string | undefined;
    const atMatch = text.match(/(?:at|to|info:)\s+([^.]+?)(?:\s+on|\.|\s+Avl|\s+Bal|\s+Ref)/i);
    if (atMatch) {
      const candidate = atMatch[1].trim();
      if (candidate.length > 1 && candidate.length < 50) {
        merchant = candidate;
      }
    }

    return {
      amount,
      currency: 'INR',
      type,
      merchant,
      description: text.substring(0, 120),
      paymentMethod,
      transactionTime: input.timestamp || new Date(),
      accountLastFour,
      institutionName: input.sender || 'Bank Account',
      upiReference,
      source: 'SMS',
      sourceMessageId: input.messageId,
      rawText: text,
      confidence: 0.80, // Lower confidence for generic fallback
    };
  }
}

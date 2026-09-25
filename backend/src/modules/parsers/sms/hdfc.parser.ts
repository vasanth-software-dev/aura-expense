import { SmsParser, SmsParserInput } from './sms-parser.interface';
import { NormalizedTransaction, cleanIndianAmount, PaymentMethod, TransactionType } from '../../engine/normalizer';

export class HdfcParser implements SmsParser {
  readonly bankName = 'HDFC Bank';

  canHandle(input: SmsParserInput): boolean {
    const sender = input.sender.toUpperCase();
    const body = input.body.toUpperCase();
    return (
      sender.includes('HDFC') ||
      sender.includes('HDFCBK') ||
      body.includes('HDFC BANK')
    );
  }

  parse(input: SmsParserInput): NormalizedTransaction | null {
    const text = input.body;

    // Detect type
    const isDebit = /\b(debited|spent|withdrawn|paid|sent)\b/i.test(text);
    const isCredit = /\b(credited|received|deposited)\b/i.test(text);
    if (!isDebit && !isCredit) return null;
    const type: TransactionType = isDebit ? 'DEBIT' : 'CREDIT';

    // Amount match: INR 438.00 or Rs. 438 or ₹438
    const amountMatch = text.match(/(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (!amountMatch) return null;
    const amount = cleanIndianAmount(amountMatch[1]);
    if (amount <= 0) return null;

    // Account last 4
    let accountLastFour: string | undefined;
    const acctMatch = text.match(/(?:A\/C|card|account)(?:\s*(?:ending|no\.?|ending with)?\s*[*xX]*\s*(\d{4}))/i);
    if (acctMatch) {
      accountLastFour = acctMatch[1];
    }

    // Payment method & UPI reference
    let paymentMethod: PaymentMethod = 'OTHER';
    let upiReference: string | undefined;

    const upiRefMatch = text.match(/(?:UPI Ref(?:\s*No\.?)?|Ref No|UTR)\s*:?\s*(\d{10,14})/i);
    if (upiRefMatch) {
      upiReference = upiRefMatch[1];
      paymentMethod = 'UPI';
    } else if (/UPI|VPA/i.test(text)) {
      paymentMethod = 'UPI';
    } else if (/ATM|withdrawn at ATM/i.test(text)) {
      paymentMethod = 'ATM';
    } else if (/card/i.test(text)) {
      paymentMethod = /credit card/i.test(text) ? 'CREDIT_CARD' : 'DEBIT_CARD';
    } else if (/NEFT|IMPS|RTGS/i.test(text)) {
      paymentMethod = 'BANK_TRANSFER';
    }

    // Merchant / Payee
    let merchant: string | undefined;
    const vpaMatch = text.match(/(?:to\s+VPA|VPA)\s+([a-zA-Z0-9.\-_@]+)/i);
    const atMatch = text.match(/(?:at|info:)\s+([^.]+?)(?:\s+on|\.|\s+Avl|\s+Bal)/i);
    const toMatch = text.match(/(?:to|transferred to)\s+([^.]+?)(?:\s+on|\.|\s+Avl|\s+via|\(UPI)/i);

    if (vpaMatch) {
      // e.g. swiggy@icici -> Swiggy
      const vpaPrefix = vpaMatch[1].split('@')[0];
      merchant = vpaPrefix.charAt(0).toUpperCase() + vpaPrefix.slice(1);
    } else if (atMatch) {
      merchant = atMatch[1].trim();
    } else if (toMatch) {
      merchant = toMatch[1].trim();
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
      institutionName: this.bankName,
      upiReference,
      source: 'SMS',
      sourceMessageId: input.messageId,
      rawText: text,
      confidence: 0.95,
    };
  }
}

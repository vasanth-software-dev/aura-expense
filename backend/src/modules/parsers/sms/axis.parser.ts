import { SmsParser, SmsParserInput } from './sms-parser.interface';
import { NormalizedTransaction, cleanIndianAmount, PaymentMethod, TransactionType } from '../../engine/normalizer';

export class AxisParser implements SmsParser {
  readonly bankName = 'Axis Bank';

  canHandle(input: SmsParserInput): boolean {
    const sender = input.sender.toUpperCase();
    const body = input.body.toUpperCase();
    return (
      sender.includes('AXIS') ||
      sender.includes('AXISBK') ||
      body.includes('AXIS BANK')
    );
  }

  parse(input: SmsParserInput): NormalizedTransaction | null {
    const text = input.body;

    const isDebit = /\b(debited|spent|withdrawn|paid)\b/i.test(text);
    const isCredit = /\b(credited|received)\b/i.test(text);
    if (!isDebit && !isCredit) return null;
    const type: TransactionType = isDebit ? 'DEBIT' : 'CREDIT';

    const amountMatch = text.match(/(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (!amountMatch) return null;
    const amount = cleanIndianAmount(amountMatch[1]);
    if (amount <= 0) return null;

    let accountLastFour: string | undefined;
    const acctMatch = text.match(/(?:A\/c(?:\s*no\.?)?|card)(?:\s*(?:ending)?\s*[*xX]*\s*(\d{4}))/i);
    if (acctMatch) {
      accountLastFour = acctMatch[1];
    }

    let paymentMethod: PaymentMethod = 'OTHER';
    let upiReference: string | undefined;
    let merchant: string | undefined;

    // Pattern: towards UPI/426912345678/ZOMATO
    const upiDetails = text.match(/towards\s+UPI\/(\d{10,14})\/([a-zA-Z0-9_\s]+)/i);
    if (upiDetails) {
      upiReference = upiDetails[1];
      merchant = upiDetails[2].trim();
      paymentMethod = 'UPI';
    } else {
      const upiMatch = text.match(/(?:UPI Ref|Ref(?:\s*No\.?)?|UTR)\s*:?\s*(\d{10,14})/i);
      if (upiMatch) {
        upiReference = upiMatch[1];
        paymentMethod = 'UPI';
      }
    }

    if (!merchant) {
      const atMatch = text.match(/(?:at|to)\s+([^.]+?)(?:\s+on|\.|\s+Avail|\s+Limit)/i);
      if (atMatch) {
        merchant = atMatch[1].trim();
      }
    }

    if (paymentMethod === 'OTHER') {
      if (/credit card/i.test(text)) paymentMethod = 'CREDIT_CARD';
      else if (/card/i.test(text)) paymentMethod = 'DEBIT_CARD';
      else if (/ATM/i.test(text)) paymentMethod = 'ATM';
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

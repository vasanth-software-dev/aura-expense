import { SmsParser, SmsParserInput } from './sms-parser.interface';
import { NormalizedTransaction, cleanIndianAmount, PaymentMethod, TransactionType } from '../../engine/normalizer';

export class IciciParser implements SmsParser {
  readonly bankName = 'ICICI Bank';

  canHandle(input: SmsParserInput): boolean {
    const sender = input.sender.toUpperCase();
    const body = input.body.toUpperCase();
    return (
      sender.includes('ICICI') ||
      sender.includes('ICICIB') ||
      body.includes('ICICI BANK')
    );
  }

  parse(input: SmsParserInput): NormalizedTransaction | null {
    const text = input.body;

    const isDebit = /\b(debited|spent|withdrawn|paid|debited for)\b/i.test(text);
    const isCredit = /\b(credited|received|deposited)\b/i.test(text);
    if (!isDebit && !isCredit) return null;
    const type: TransactionType = isDebit ? 'DEBIT' : 'CREDIT';

    const amountMatch = text.match(/(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (!amountMatch) return null;
    const amount = cleanIndianAmount(amountMatch[1]);
    if (amount <= 0) return null;

    let accountLastFour: string | undefined;
    const acctMatch = text.match(/(?:Acct|Card|A\/C)(?:\s*(?:ending|ending with|no\.?)?\s*[*xX]*\s*(\d{4}))/i);
    if (acctMatch) {
      accountLastFour = acctMatch[1];
    }

    let paymentMethod: PaymentMethod = 'OTHER';
    let upiReference: string | undefined;
    let merchant: string | undefined;

    // Check Info tag: Info: UPI*UBER*123456789012 or Info: INF*INFT*...
    const infoMatch = text.match(/Info:\s*([^\.]+)/i);
    if (infoMatch) {
      const info = infoMatch[1];
      if (/UPI/i.test(info)) {
        paymentMethod = 'UPI';
        const parts = info.split('*');
        if (parts.length >= 2) {
          merchant = parts[1].trim();
        }
        if (parts.length >= 3 && /^\d{10,14}$/.test(parts[2].trim())) {
          upiReference = parts[2].trim();
        }
      } else if (/IMPS|NEFT/i.test(info)) {
        paymentMethod = 'BANK_TRANSFER';
      }
    }

    if (!upiReference) {
      const refMatch = text.match(/(?:UPI Ref|Ref(?:\s*No\.?)?|URN)\s*:?\s*(\d{10,14})/i);
      if (refMatch) {
        upiReference = refMatch[1];
        paymentMethod = 'UPI';
      }
    }

    if (!merchant) {
      const atMatch = text.match(/(?:at|to)\s+([^.]+?)(?:\s+on|\.|\s+Avbl|\s+Bal)/i);
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

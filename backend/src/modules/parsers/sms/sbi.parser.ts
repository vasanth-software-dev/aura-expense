import { SmsParser, SmsParserInput } from './sms-parser.interface';
import { NormalizedTransaction, cleanIndianAmount, PaymentMethod, TransactionType } from '../../engine/normalizer';

export class SbiParser implements SmsParser {
  readonly bankName = 'State Bank of India';

  canHandle(input: SmsParserInput): boolean {
    const sender = input.sender.toUpperCase();
    const body = input.body.toUpperCase();
    return (
      sender.includes('SBI') ||
      sender.includes('SBMS') ||
      body.includes('SBI') ||
      body.includes('STATE BANK')
    );
  }

  parse(input: SmsParserInput): NormalizedTransaction | null {
    const text = input.body;

    const isDebit = /\b(debited|spent|withdrawn|paid|transfer to)\b/i.test(text);
    const isCredit = /\b(credited|received|deposit|transfer from)\b/i.test(text);
    if (!isDebit && !isCredit) return null;
    const type: TransactionType = isDebit ? 'DEBIT' : 'CREDIT';

    const amountMatch = text.match(/(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (!amountMatch) return null;
    const amount = cleanIndianAmount(amountMatch[1]);
    if (amount <= 0) return null;

    let accountLastFour: string | undefined;
    const acctMatch = text.match(/(?:A\/c|card)(?:\s*(?:ending|no\.?|ending with)?\s*[*xX]*\s*(\d{4}))/i);
    if (acctMatch) {
      accountLastFour = acctMatch[1];
    }

    let paymentMethod: PaymentMethod = 'OTHER';
    let upiReference: string | undefined;

    const upiMatch = text.match(/(?:UPI Ref(?:\s*No\.?)?|Ref(?:\s*No\.?)?|UTR)\s*:?\s*(\d{10,14})/i);
    if (upiMatch) {
      upiReference = upiMatch[1];
      paymentMethod = 'UPI';
    } else if (/UPI/i.test(text)) {
      paymentMethod = 'UPI';
    } else if (/ATM/i.test(text)) {
      paymentMethod = 'ATM';
    } else if (/card/i.test(text)) {
      paymentMethod = /credit card/i.test(text) ? 'CREDIT_CARD' : 'DEBIT_CARD';
    } else if (/IMPS|NEFT|transfer/i.test(text)) {
      paymentMethod = 'BANK_TRANSFER';
    }

    let merchant: string | undefined;
    const atMatch = text.match(/(?:at|to|transfer to)\s+([^.]+?)(?:\s+on|\.|\s+Ref|\s+Bal)/i);
    if (atMatch) {
      merchant = atMatch[1].trim();
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

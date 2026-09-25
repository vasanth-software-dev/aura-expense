import { NormalizedTransaction, cleanIndianAmount, PaymentMethod, TransactionType } from '../../engine/normalizer';

export interface EmailParserInput {
  messageId: string;
  sender: string;
  subject: string;
  bodySnippet: string;
  bodyText?: string;
  receivedAt: Date;
}

export class EmailBankParser {
  public static parse(input: EmailParserInput): NormalizedTransaction | null {
    const combinedText = `${input.subject} \n ${input.bodyText || input.bodySnippet}`;

    // Financial intent check
    const isDebit = /\b(debited|spent|paid|withdrawn|purchase of|sent)\b/i.test(combinedText);
    const isCredit = /\b(credited|received|deposit|refund of|added)\b/i.test(combinedText);
    if (!isDebit && !isCredit) return null;
    const type: TransactionType = isDebit ? 'DEBIT' : 'CREDIT';

    // Amount match
    const amountMatch = combinedText.match(/(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (!amountMatch) return null;
    const amount = cleanIndianAmount(amountMatch[1]);
    if (amount <= 0) return null;

    // Account ending
    let accountLastFour: string | undefined;
    const acctMatch = combinedText.match(/(?:A\/c|account|card|acct)(?:\s*(?:ending|no\.?|ending with)?\s*[*xX]*\s*(\d{4}))/i);
    if (acctMatch) {
      accountLastFour = acctMatch[1];
    }

    // UPI / Bank Reference
    let upiReference: string | undefined;
    let paymentMethod: PaymentMethod = 'OTHER';

    const upiMatch = combinedText.match(/(?:UPI(?:\s*Ref(?:\s*No\.?)?)?|Ref(?:\s*No\.?)?|UTR|URN|Txn\s*ID)\s*:?\s*(\d{10,14})/i);
    if (upiMatch) {
      upiReference = upiMatch[1];
      paymentMethod = 'UPI';
    } else if (/UPI|VPA/i.test(combinedText)) {
      paymentMethod = 'UPI';
    } else if (/credit card/i.test(combinedText)) {
      paymentMethod = 'CREDIT_CARD';
    } else if (/debit card|card/i.test(combinedText)) {
      paymentMethod = 'DEBIT_CARD';
    } else if (/NEFT|IMPS|RTGS|transfer/i.test(combinedText)) {
      paymentMethod = 'BANK_TRANSFER';
    }

    // Merchant / Payee
    let merchant: string | undefined;
    // Check known services from sender or text
    if (/swiggy/i.test(input.sender) || /swiggy/i.test(combinedText)) merchant = 'Swiggy';
    else if (/zomato/i.test(input.sender) || /zomato/i.test(combinedText)) merchant = 'Zomato';
    else if (/uber/i.test(input.sender) || /uber/i.test(combinedText)) merchant = 'Uber';
    else if (/amazon/i.test(input.sender) || /amazon/i.test(combinedText)) merchant = 'Amazon';
    else if (/flipkart/i.test(input.sender) || /flipkart/i.test(combinedText)) merchant = 'Flipkart';
    else if (/blinkit/i.test(input.sender) || /blinkit/i.test(combinedText)) merchant = 'Blinkit';
    else if (/zepto/i.test(input.sender) || /zepto/i.test(combinedText)) merchant = 'Zepto';
    else if (/netflix/i.test(input.sender) || /netflix/i.test(combinedText)) merchant = 'Netflix';
    else if (/spotify/i.test(input.sender) || /spotify/i.test(combinedText)) merchant = 'Spotify';
    else {
      const atMatch = combinedText.match(/(?:at|to|info:)\s+([^.\n]+?)(?:\s+on|\.|\s+Avl|\s+Bal|\s+Ref|\s+via)/i);
      if (atMatch && atMatch[1].trim().length < 40) {
        merchant = atMatch[1].trim();
      }
    }

    // Institution Name
    let institutionName: string | undefined;
    if (/HDFC/i.test(combinedText) || /HDFC/i.test(input.sender)) institutionName = 'HDFC Bank';
    else if (/SBI|State Bank/i.test(combinedText) || /SBI/i.test(input.sender)) institutionName = 'State Bank of India';
    else if (/ICICI/i.test(combinedText) || /ICICI/i.test(input.sender)) institutionName = 'ICICI Bank';
    else if (/Axis/i.test(combinedText) || /Axis/i.test(input.sender)) institutionName = 'Axis Bank';
    else if (/Kotak/i.test(combinedText) || /Kotak/i.test(input.sender)) institutionName = 'Kotak Mahindra Bank';

    return {
      amount,
      currency: 'INR',
      type,
      merchant,
      description: input.subject || combinedText.substring(0, 100),
      paymentMethod,
      transactionTime: input.receivedAt,
      accountLastFour,
      institutionName,
      upiReference,
      source: 'EMAIL',
      sourceMessageId: input.messageId,
      rawText: combinedText.substring(0, 300),
      confidence: 0.90,
    };
  }
}

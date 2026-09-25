import { NormalizedTransaction } from '../../engine/normalizer';

export interface SmsParserInput {
  sender: string;
  body: string;
  timestamp?: Date;
  messageId?: string;
}

export interface SmsParser {
  readonly bankName: string;
  canHandle(input: SmsParserInput): boolean;
  parse(input: SmsParserInput): NormalizedTransaction | null;
}

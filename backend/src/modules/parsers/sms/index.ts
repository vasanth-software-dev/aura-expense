import { SmsParser, SmsParserInput } from './sms-parser.interface';
import { HdfcParser } from './hdfc.parser';
import { SbiParser } from './sbi.parser';
import { IciciParser } from './icici.parser';
import { AxisParser } from './axis.parser';
import { GenericParser } from './generic.parser';
import { NormalizedTransaction } from '../../engine/normalizer';

export class SmsParserRegistry {
  private static parsers: SmsParser[] = [
    new HdfcParser(),
    new SbiParser(),
    new IciciParser(),
    new AxisParser(),
    new GenericParser(), // Always last as fallback
  ];

  public static parse(input: SmsParserInput): NormalizedTransaction | null {
    for (const parser of this.parsers) {
      if (parser.canHandle(input)) {
        const result = parser.parse(input);
        if (result) {
          return result;
        }
      }
    }
    return null;
  }
}

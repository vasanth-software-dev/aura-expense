import { describe, it, expect } from 'vitest';
import { SmsParserRegistry } from '../src/modules/parsers/sms';
import { HdfcParser } from '../src/modules/parsers/sms/hdfc.parser';
import { SbiParser } from '../src/modules/parsers/sms/sbi.parser';
import { IciciParser } from '../src/modules/parsers/sms/icici.parser';
import { AxisParser } from '../src/modules/parsers/sms/axis.parser';
import { GenericParser } from '../src/modules/parsers/sms/generic.parser';

describe('Indian SMS Parsers', () => {
  describe('HDFC Bank Parser', () => {
    const parser = new HdfcParser();

    it('should parse UPI debit transaction correctly', () => {
      const input = {
        sender: 'HDFCBK',
        body: 'UPDATE: INR 438.00 debited from HDFC Bank A/C **1234 on 25-SEP-26 to VPA swiggy@icici (UPI Ref No 426912345678). Avl bal: INR 45,210.50',
      };
      expect(parser.canHandle(input)).toBe(true);
      const parsed = parser.parse(input);
      expect(parsed).not.toBeNull();
      expect(parsed?.amount).toBe(438.0);
      expect(parsed?.type).toBe('DEBIT');
      expect(parsed?.accountLastFour).toBe('1234');
      expect(parsed?.paymentMethod).toBe('UPI');
      expect(parsed?.upiReference).toBe('426912345678');
      expect(parsed?.merchant?.toLowerCase()).toContain('swiggy');
    });

    it('should parse Credit Card spend correctly', () => {
      const input = {
        sender: 'HDFCBK',
        body: 'INR 799.00 was spent on your HDFC Bank Card ending 4444 on 24-SEP-26 at AMAZON INDIA. Bal: INR 12,300.00',
      };
      const parsed = parser.parse(input);
      expect(parsed).not.toBeNull();
      expect(parsed?.amount).toBe(799.0);
      expect(parsed?.type).toBe('DEBIT');
      expect(parsed?.accountLastFour).toBe('4444');
      expect(parsed?.merchant).toBe('AMAZON INDIA');
    });
  });

  describe('SBI Parser', () => {
    const parser = new SbiParser();

    it('should parse SBI UPI debit', () => {
      const input = {
        sender: 'SBMS-SBI',
        body: 'Dear SBI User, your A/c ending 9876 debited by INR 60.00 on 25Sep26 by UPI Ref 123456789012. Bal: INR 8,420.00',
      };
      expect(parser.canHandle(input)).toBe(true);
      const parsed = parser.parse(input);
      expect(parsed).not.toBeNull();
      expect(parsed?.amount).toBe(60.0);
      expect(parsed?.type).toBe('DEBIT');
      expect(parsed?.accountLastFour).toBe('9876');
      expect(parsed?.paymentMethod).toBe('UPI');
      expect(parsed?.upiReference).toBe('123456789012');
    });

    it('should parse SBI credit transaction', () => {
      const input = {
        sender: 'SBIINB',
        body: 'Your A/C ending 9876 credited by Rs. 10,000.00 on 25Sep26 by transfer from John Doe. Ref 987654321012.',
      };
      const parsed = parser.parse(input);
      expect(parsed).not.toBeNull();
      expect(parsed?.amount).toBe(10000.0);
      expect(parsed?.type).toBe('CREDIT');
      expect(parsed?.accountLastFour).toBe('9876');
    });
  });

  describe('ICICI Bank Parser', () => {
    const parser = new IciciParser();

    it('should parse ICICI UPI transaction', () => {
      const input = {
        sender: 'ICICIB',
        body: 'ICICI Bank Acct XX4444 debited with INR 280.00 on 25-Sep-26. Info: UPI*UBER*426912345678. Avbl Bal INR 18,340.20.',
      };
      expect(parser.canHandle(input)).toBe(true);
      const parsed = parser.parse(input);
      expect(parsed).not.toBeNull();
      expect(parsed?.amount).toBe(280.0);
      expect(parsed?.type).toBe('DEBIT');
      expect(parsed?.accountLastFour).toBe('4444');
      expect(parsed?.merchant).toBe('UBER');
      expect(parsed?.upiReference).toBe('426912345678');
    });
  });

  describe('Axis Bank Parser', () => {
    const parser = new AxisParser();

    it('should parse Axis Bank UPI transaction', () => {
      const input = {
        sender: 'AXISBK',
        body: 'Axis Bank: INR 350.00 debited from A/c no. XX1234 on 25-09-26 14:32:10 towards UPI/426912345678/ZOMATO. Avail Bal: INR 12,500.00',
      };
      expect(parser.canHandle(input)).toBe(true);
      const parsed = parser.parse(input);
      expect(parsed).not.toBeNull();
      expect(parsed?.amount).toBe(350.0);
      expect(parsed?.type).toBe('DEBIT');
      expect(parsed?.accountLastFour).toBe('1234');
      expect(parsed?.merchant).toBe('ZOMATO');
      expect(parsed?.upiReference).toBe('426912345678');
    });
  });

  describe('Generic Parser Fallback', () => {
    const parser = new GenericParser();

    it('should parse unknown bank SMS using generic rules', () => {
      const input = {
        sender: 'KOTAKB',
        body: 'Rs 1,250.00 debited from your A/c ending 3321 on 25-09-26 via UPI Ref 998877665544. Avl Bal Rs 5,000.00',
      };
      const parsed = parser.parse(input);
      expect(parsed).not.toBeNull();
      expect(parsed?.amount).toBe(1250.0);
      expect(parsed?.type).toBe('DEBIT');
      expect(parsed?.accountLastFour).toBe('3321');
      expect(parsed?.paymentMethod).toBe('UPI');
      expect(parsed?.upiReference).toBe('998877665544');
    });
  });

  describe('SmsParserRegistry', () => {
    it('should automatically select the correct parser based on sender/body', () => {
      const hdfc = SmsParserRegistry.parse({
        sender: 'HDFCBK',
        body: 'UPDATE: INR 438.00 debited from HDFC Bank A/C **1234 (UPI Ref No 112233445566).',
      });
      expect(hdfc?.institutionName).toBe('HDFC Bank');

      const sbi = SmsParserRegistry.parse({
        sender: 'SBMS-SBI',
        body: 'Dear SBI User, your A/c ending 9876 debited by INR 60.00 by UPI Ref 998811223344.',
      });
      expect(sbi?.institutionName).toBe('State Bank of India');
    });
  });
});

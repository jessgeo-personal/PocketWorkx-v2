// src/services/BankFormatDetector.ts
import { BankStatementFormat } from '../types/finance';

// Sample formats for two major Indian banks as examples
const HDFCBankFormat: BankStatementFormat = {
  bankName: 'HDFC Bank',
  identifier: /HDFC Bank Statement/i,
  patterns: {
    header: [/Date/gi, /Description/gi, /Debit/gi, /Credit/gi, /Balance/gi],
    transaction: [/\d{2}\/\d{2}\/\d{4}/gi],
    dateFormat: 'DD/MM/YYYY',
    amountFormat: /[0-9,]+\.?[0-9]*/g,
    balanceFormat: /[0-9,]+\.?[0-9]*/g,
  },
  columns: { date: 0, description: 1, debit: 2, credit: 3, balance: 4 },
  skipLines: 1,
};

const ICICIBankFormat: BankStatementFormat = {
  bankName: 'ICICI Bank',
  identifier: /ICICI Bank Statement/i,
  patterns: {
    header: [/Value Date/gi, /Narration/gi, /Withdrawal/gi, /Deposit/gi, /Closing Balance/gi],
    transaction: [/\d{2}-[A-Z]{3}-\d{2}/gi],
    dateFormat: 'DD-MMM-YY',
    amountFormat: /[0-9,]+\.?[0-9]*/g,
    balanceFormat: /[0-9,]+\.?[0-9]*/g,
  },
  columns: { date: 0, description: 1, debit: 2, credit: 3, balance: 4 },
  skipLines: 2,
};

const supportedFormats: BankStatementFormat[] = [HDFCBankFormat, ICICIBankFormat];

export function detectBankFormat(content: string): BankStatementFormat | null {
  for (const format of supportedFormats) {
    if (format.identifier.test(content)) {
      return format;
    }
  }
  return null;
}

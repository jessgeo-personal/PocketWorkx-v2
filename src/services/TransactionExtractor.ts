// src/services/TransactionExtractor.ts
import { BankStatementFormat, ParsedTransaction, ParseError } from '../types/finance';

export function extractTransactions(
  rawLines: string[],
  format: BankStatementFormat
): { transactions: ParsedTransaction[]; errors: ParseError[] } {
  const transactions: ParsedTransaction[] = [];
  const errors: ParseError[] = [];

  rawLines.slice(format.skipLines).forEach((line, index) => {
    try {
      const cols = line.trim().split(/\s{2,}/);
      if (cols.length < format.columns.balance + 1) return;

      const rawDate = cols[format.columns.date];
      const parsedDate = new Date(rawDate); // Use moment with format.dateFormat for accuracy
      const description = cols[format.columns.description];
      const debit = format.columns.debit !== undefined ? parseFloat(cols[format.columns.debit].replace(/,/g, '')) : undefined;
      const credit = format.columns.credit !== undefined ? parseFloat(cols[format.columns.credit].replace(/,/g, '')) : undefined;
      const balance = parseFloat(cols[format.columns.balance].replace(/,/g, ''));

      transactions.push({
        rawDate,
        parsedDate,
        description,
        debitAmount: debit,
        creditAmount: credit,
        balance,
        rawText: line,
      });
    } catch (e: any) {
      errors.push({ line: index + format.skipLines + 1, message: e.message, severity: 'medium', rawData: line });
    }
  });

  return { transactions, errors };
}

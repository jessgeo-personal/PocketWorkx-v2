// src/services/StatementParserService.ts

import { parseCsvFile, processCsvFiles, ProcessedTransaction } from './FileProcessorService';
import { StorageError } from './accountService';

export interface StatementParseResult {
  transactions: ProcessedTransaction[];
  success: boolean;
  error?: string;
}

/**
 * Parses a single statement file (CSV) and returns transactions.
 */
export const parseStatementFile = async (
  fileUri: string
): Promise<StatementParseResult> => {
  try {
    const transactions = await parseCsvFile(fileUri);
    return { transactions, success: true };
  } catch (error) {
    console.error('parseStatementFile error:', error);
    return {
      transactions: [],
      success: false,
      error: (error as Error).message,
    };
  }
};

/**
 * Parses multiple statement files and returns combined transactions.
 */
export const parseStatementFiles = async (
  fileUris: string[]
): Promise<StatementParseResult> => {
  try {
    const transactions = await processCsvFiles(fileUris);
    return { transactions, success: true };
  } catch (error) {
    console.error('parseStatementFiles error:', error);
    return {
      transactions: [],
      success: false,
      error: (error as Error).message,
    };
  }
};

// src/services/FileProcessorService.ts
import Papa from 'papaparse';
import * as FileSystem from 'expo-file-system';
import { StorageError } from './accountService';

/**
 * Interface for processed transaction data
 */
export interface ProcessedTransaction {
  accountId: string;
  description: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  date: string;
  category?: string;
}

/**
 * Reads a CSV file from the given URI and parses it into JSON
 */
export const parseCsvFile = async (
  fileUri: string
): Promise<ProcessedTransaction[]> => {
  try {
    // Read file content as string with UTF-8 encoding
    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: 'utf8',
    });

    // Parse CSV using PapaParse
    const result = Papa.parse<any>(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    if (result.errors.length) {
      console.warn('CSV parsing errors:', result.errors);
    }

    // Map rows to ProcessedTransaction
    const transactions: ProcessedTransaction[] = result.data.map(row => ({
      accountId: String(row.accountId || ''),
      description: String(row.description || ''),
      amount: Number(row.amount || 0),
      type: row.type === 'DEBIT' ? 'DEBIT' : 'CREDIT',
      date: String(row.date || ''),
      category: row.category ? String(row.category) : undefined,
    }));

    return transactions;
  } catch (error) {
    console.error('parseCsvFile error:', error);
    throw new StorageError('Failed to process CSV file', error as Error);
  }
};

/**
 * Processes a list of CSV file URIs and returns combined transactions
 */
export const processCsvFiles = async (
  fileUris: string[]
): Promise<ProcessedTransaction[]> => {
  const allTransactions: ProcessedTransaction[] = [];

  for (const uri of fileUris) {
    const transactions = await parseCsvFile(uri);
    allTransactions.push(...transactions);
  }

  return allTransactions;
};
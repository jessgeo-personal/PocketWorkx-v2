// src/services/exportService.ts
import { getAllAccounts, exportData } from './accountService';
import * as FileSystem from 'expo-file-system';
import { Alert, Share } from 'react-native';
import Papa from 'papaparse';

interface ExportResult {
  fileUri: string;
  success: boolean;
}

// Determine base directory (documentDirectory or cacheDirectory)
const baseDirectory: string =
  // @ts-ignore
  FileSystem.documentDirectory ||
  // @ts-ignore
  FileSystem.cacheDirectory ||
  '';

/**
 * Converts JSON data to a CSV string.
 */
const jsonToCsv = (data: any[]): string => {
  return Papa.unparse(data, {
    quotes: false,
    delimiter: ',',
    header: true,
  });
};

/**
 * Writes CSV text to a file and shares it.
 */
const writeAndShareCsv = async (
  fileName: string,
  csvText: string
): Promise<ExportResult> => {
  try {
    if (!baseDirectory) {
      throw new Error('No valid file system directory available');
    }

    const fileUri = `${baseDirectory}${fileName}`;
    // Write file with UTF-8 encoding
    await FileSystem.writeAsStringAsync(fileUri, csvText, {
      encoding: 'utf8',
    });

    await Share.share({
      url: fileUri,
      title: 'Export PocketWorkx Data',
      message: `PocketWorkx data export: ${fileName}`,
    });

    return { fileUri, success: true };
  } catch (error) {
    console.error('CSV export error:', error);
    Alert.alert('Export Error', 'Failed to export data. Please try again.');
    return { fileUri: '', success: false };
  }
};

/**
 * Shows a preview if sharing fails.
 */
const showCsvPreview = async (
  fileName: string,
  csvText: string
): Promise<ExportResult> => {
  try {
    if (!baseDirectory) {
      throw new Error('No valid file system directory available');
    }

    const fileUri = `${baseDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, csvText, {
      encoding: 'utf8',
    });

    const previewLines = csvText.split('\n').slice(0, 5).join('\n');
    Alert.alert(
      `Exported: ${fileName}`,
      `File saved to: ${fileUri}\n\nPreview:\n${previewLines}${
        csvText.split('\n').length > 5 ? '\n...' : ''
      }`
    );

    return { fileUri, success: true };
  } catch (error) {
    console.error('CSV preview error:', error);
    Alert.alert('Export Error', 'Failed to export data. Please try again.');
    return { fileUri: '', success: false };
  }
};

/**
 * Exports all accounts as CSV.
 */
export const exportAccountsCsv = async (): Promise<ExportResult> => {
  try {
    const accounts = await getAllAccounts();
    const flatAccounts = accounts.map(acc => ({
      id: acc.id,
      nickname: acc.nickname,
      bankName: acc.bankName,
      accountNumber: acc.accountNumber,
      accountType: acc.accountType,
      balance: acc.balance,
      currency: acc.currency,
      createdAt: acc.createdAt,
      updatedAt: acc.updatedAt,
      isActive: acc.isActive,
    }));

    const csvText = jsonToCsv(flatAccounts);

    try {
      return await writeAndShareCsv('pocketworkx_accounts.csv', csvText);
    } catch {
      return await showCsvPreview('pocketworkx_accounts.csv', csvText);
    }
  } catch (error) {
    console.error('exportAccountsCsv error:', error);
    Alert.alert('Export Error', 'Failed to export accounts data.');
    return { fileUri: '', success: false };
  }
};

/**
 * Exports all transactions as CSV.
 */
export const exportTransactionsCsv = async (): Promise<ExportResult> => {
  try {
    const { transactions } = await exportData();
    const flatTransactions = transactions.map(tx => ({
      id: tx.id,
      accountId: tx.accountId,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      date: tx.date,
      category: tx.category || '',
      createdAt: tx.createdAt,
    }));

    const csvText = jsonToCsv(flatTransactions);

    try {
      return await writeAndShareCsv('pocketworkx_transactions.csv', csvText);
    } catch {
      return await showCsvPreview('pocketworkx_transactions.csv', csvText);
    }
  } catch (error) {
    console.error('exportTransactionsCsv error:', error);
    Alert.alert('Export Error', 'Failed to export transactions data.');
    return { fileUri: '', success: false };
  }
};

/**
 * Exports both accounts and transactions CSV files.
 */
export const exportAllDataCsv = async (): Promise<ExportResult[]> => {
  return Promise.all([exportAccountsCsv(), exportTransactionsCsv()]);
};
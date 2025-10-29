// src/utils/csvExport.ts - Expo FileSystem version (replaces react-native-fs)

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { TransactionRecord, FilterCriteria } from '../types/transactions';




/**
 * Format date to DD-MMM-YYYY format for filenames
 * Example: 29-Oct-2025
 */
const formatDateForFilename = (date: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}${month}${year}`;
};

/**
 * Format date-time for CSV content
 * Example: 29-Oct-2025 14:30:45
 */
const formatDateTimeForCSV = (date: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
};

/**
 * Escape CSV special characters (quotes, commas, newlines)
 */
const escapeCSVValue = (value: string): string => {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

/**
 * Generate filename based on filter criteria and download date
 * Format: {assetType}_{filterLabel}_{downloadDate}.csv
 * Example: cash_Wallet_29Oct2025.csv
 */
const generateFilename = (filterCriteria: FilterCriteria, downloadDate: Date): string => {
  const { assetType, assetLabel } = filterCriteria;
  const formattedDate = formatDateForFilename(downloadDate);
  const sanitizedLabel = assetLabel.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  return `${assetType}_${sanitizedLabel}_${formattedDate}.csv`;
};

/**
 * Convert transaction records to CSV string
 */
const transactionsToCSV = (transactions: TransactionRecord[]): string => {
  // CSV Headers
  const headers = [
    'DateTime',
    'Description',
    'Amount (₹)',
    'Cash Category',
    'Expense Category',
    'Notes',
    'Type',
    'Asset Label'
  ];

  // Generate CSV rows
  const rows = transactions.map(transaction => {
    const datetime = formatDateTimeForCSV(new Date(transaction.datetime));
    const description = escapeCSVValue(transaction.description || '');
    const amount = transaction.amount.amount.toFixed(2);
    const cashCategory = escapeCSVValue(transaction.cashCategory || '');
    const expenseCategory = escapeCSVValue(transaction.expenseCategory || '');
    const notes = escapeCSVValue(transaction.notes || '');
    const type = transaction.type;
    const assetLabel = escapeCSVValue(transaction.assetLabel || '');

    return [datetime, description, amount, cashCategory, expenseCategory, notes, type, assetLabel].join(',');
  });

  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
};

/**
 * Export transactions to CSV file and trigger download/share
 * @param transactions - Array of transaction records to export
 * @param filterCriteria - Filter criteria for filename generation
 * @returns Promise resolving to success status and file URI
 */
  export const exportTransactionsToCSV = async (
    transactions: TransactionRecord[],
    filterCriteria: FilterCriteria
  ): Promise<{ success: boolean; uri?: string; error?: string }> => {
    try {
      // Generate CSV content
      const csvContent = transactionsToCSV(transactions);
      
      // Generate filename
      const filename = generateFilename(filterCriteria, new Date());
      
      /// Define file path using Expo FileSystem (fixed version)
  const dir = (FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory ?? '';
  if (!dir) {
    return { success: false, error: 'FileSystem directory unavailable' };
  }

  const fileUri = dir + filename;

// Write CSV to file system using Expo FileSystem
await FileSystem.writeAsStringAsync(fileUri, csvContent, {
  encoding: (FileSystem as any).EncodingType?.UTF8 ?? 'utf8',
});

// Check if sharing is available
const isSharingAvailable = await Sharing.isAvailableAsync();
if (isSharingAvailable) {
  // Share the file (allows user to save to Downloads or share via apps)
  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Save Transaction CSV',
    UTI: 'public.comma-separated-values-text',
  });
} else {
  // Fallback: File saved but sharing not available
  console.log('CSV saved to:', fileUri);
}

return { success: true, uri: fileUri };

  } catch (error) {
    console.error('CSV Export Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Get preview of CSV content (first 5 rows for testing)
 * Useful for debugging without triggering file system operations
 */
export const getCSVPreview = (transactions: TransactionRecord[]): string => {
  const previewTransactions = transactions.slice(0, 5);
  return transactionsToCSV(previewTransactions);
};

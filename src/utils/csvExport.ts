// src/utils/csvExport.ts - Bulletproof CSV Export

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { TransactionRecord, FilterCriteria } from '../types/transactions';

/**
 * Format date to DD-MMM-YYYY format for filenames
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
 * Escape CSV special characters
 */
const escapeCSVValue = (value: string): string => {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

/**
 * Generate filename
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

  return [headers.join(','), ...rows].join('\n');
};

/**
 * Export transactions to CSV - BULLETPROOF VERSION
 */
export const exportTransactionsToCSV = async (
  transactions: TransactionRecord[],
  filterCriteria: FilterCriteria
): Promise<{ success: boolean; uri?: string; error?: string }> => {
  try {
    const csvContent = transactionsToCSV(transactions);
    const filename = generateFilename(filterCriteria, new Date());
    
    console.log('Generated filename:', filename);
    console.log('CSV content length:', csvContent.length);

    // Try cacheDirectory first, then documentDirectory
    const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    
    if (!baseDir) {
      return { success: false, error: 'No file system directory available' };
    }

    console.log('Using directory:', baseDir);
    
    const fileUri = baseDir + filename;
    console.log('File URI:', fileUri);

    // Write file
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    console.log('File written successfully');

    // Share file
    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (!isSharingAvailable) {
      return { success: false, error: 'Sharing not available' };
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Save Transaction CSV',
    });

    console.log('File shared successfully');
    return { success: true, uri: fileUri };

  } catch (error) {
    console.error('CSV Export Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Export failed' 
    };
  }
};

/**
 * Get CSV preview
 */
export const getCSVPreview = (transactions: TransactionRecord[]): string => {
  const previewTransactions = transactions.slice(0, 5);
  return transactionsToCSV(previewTransactions);
};

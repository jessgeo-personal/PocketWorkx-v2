// src/utils/csvExport.ts
// Expo managed workflow compatible CSV export utilities for PocketWorkx
// Uses expo-file-system/legacy + expo-sharing per project constraints

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { TransactionRecord, FilterCriteria } from '../types/transactions';

const csvEscape = (v: any) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const formatDateTime = (d: Date) => {
  try {
    const date = new Date(d);
    const dd = String(date.getDate()).padStart(2, '0');
    const mon = date.toLocaleString('en-IN', { month: 'short' });
    const yyyy = date.getFullYear();
    const time = date.toLocaleTimeString('en-IN', { hour12: false });
    return `${dd}-${mon}-${yyyy} ${time}`;
  } catch {
    return '';
  }
};

export const transactionsToCSV = (transactions: TransactionRecord[]): string => {
  // Unified headers for all asset types; optional fields are blank when not applicable
  const headers = [
    'ID',
    'DateTime',
    'Amount',
    'Currency',
    'Description',
    'Notes',
    'AssetType',
    'AssetID',
    'AssetLabel',
    // Cash-specific
    'CashCategory',
    'ExpenseCategory',
    // Account-specific
    'BankName',
    'BalanceAfter',
    'ReferenceNumber',
    // Loan-specific
    'PaymentType',
    'RemainingBalance',
    // Credit card-specific
    'CardEnding',
    'MerchantCategory',
    'Merchant',
    'AvailableCredit',
  ];

  const rows = transactions.map((t) => {
    return [
      csvEscape(t.id),
      csvEscape(formatDateTime(t.datetime)),
      csvEscape(t.amount?.amount ?? ''),
      csvEscape(t.amount?.currency ?? ''),
      csvEscape(t.description ?? ''),
      csvEscape(t.notes ?? ''),
      csvEscape(t.assetType ?? ''),
      csvEscape(t.assetId ?? ''),
      csvEscape(t.assetLabel ?? ''),
      // Cash
      csvEscape(t.cashCategory ?? ''),
      csvEscape(t.expenseCategory ?? ''),
      // Account
      csvEscape(t.bankName ?? ''),
      csvEscape(t.balance ?? ''),
      csvEscape(t.referenceNumber ?? ''),
      // Loan
      csvEscape(t.paymentType ?? ''),
      csvEscape(t.remainingBalance ?? ''),
      // Credit card
      csvEscape(t.cardEnding ?? ''),
      csvEscape(t.merchantCategory ?? ''),
      csvEscape(t.merchant ?? ''),
      csvEscape(t.availableCredit ?? ''),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

const generateFilename = (filter: FilterCriteria): string => {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(
    2,
    '0'
  )}`;
  const type = filter.assetType.replace(/\s+/g, '_');
  const scope = filter.filterType === 'all' ? 'ALL' : 'CATEGORY';
  return `PocketWorkx-${type}-${scope}-${stamp}.csv`;
};

// Wrapper kept for backwards compatibility with existing imports
export const exportTransactionsToCSV = async (
  transactions: TransactionRecord[],
  filter: FilterCriteria
): Promise<{ path: string; shared: boolean }> => {
  const csv = transactionsToCSV(transactions);
  const filename = generateFilename(filter);
  const fileUri = `${FileSystem.cacheDirectory ?? ''}${filename}`;

  // Write file
  await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

  // Share file (if available)
  let shared = false;
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Transactions CSV' });
      shared = true;
    }
  } catch (e) {
    // Keep silent per dev methodology; console log for debug if needed
    console.log('Sharing error (non-fatal):', e);
  }

  return { path: fileUri, shared };
};

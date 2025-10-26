import React from 'react';
import { Button, View } from 'react-native';
import {
  exportAccountsCsv,
  exportTransactionsCsv,
} from '../services/exportService';

export default function AnalyticsScreen() {
  const onExportAccounts = async () => {
    const result = await exportAccountsCsv();
    if (!result.success) {
      alert('Failed to export accounts');
    }
  };

  const onExportTransactions = async () => {
    const result = await exportTransactionsCsv();
    if (!result.success) {
      alert('Failed to export transactions');
    }
  };

  return (
    <View>
      <Button title="Export Accounts CSV" onPress={onExportAccounts} />
      <Button title="Export Transactions CSV" onPress={onExportTransactions} />
    </View>
  );
}

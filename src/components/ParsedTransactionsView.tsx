// src/components/ParsedTransactionsView.tsx

import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { ParsedTransaction } from '../types/finance';
import { colors } from '../utils/theme';

interface ParsedTransactionsViewProps {
  transactions: ParsedTransaction[];
}

const ParsedTransactionsView: React.FC<ParsedTransactionsViewProps> = ({ transactions }) => {
  const renderItem = ({ item }: { item: ParsedTransaction }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.dateText}>{item.parsedDate.toLocaleDateString()}</Text>
      <Text style={styles.descriptionText}>{item.description}</Text>
      <View style={styles.amountContainer}>
        {item.debitAmount != null && <Text style={styles.debitText}>-₹{item.debitAmount.toFixed(2)}</Text>}
        {item.creditAmount != null && <Text style={styles.creditText}>+₹{item.creditAmount.toFixed(2)}</Text>}
      </View>
    </View>
  );

  return (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.referenceNumber || item.rawText}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    backgroundColor: colors.background,
  },
  itemContainer: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginVertical: 4,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  debitText: {
    color: colors.error,
    fontSize: 14,
  },
  creditText: {
    color: colors.primary,
    fontSize: 14,
  },
});

export default ParsedTransactionsView;

// src/app/account/[id].tsx

import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  fetchAccountById,
  addTransaction,
  Account,
  Transaction,
} from '../../services/accountService';
import DocumentUploadModal from '../../components/DocumentUploadModal';
import { ProcessedTransaction } from '../../services/FileProcessorService';

type AccountWithTx = Account & { transactions: Transaction[] };

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [account, setAccount] = useState<AccountWithTx | null>(null);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadAccount(id);
  }, [id]);

  const loadAccount = async (accountId: string) => {
    setLoading(true);
    const fullAcct = await fetchAccountById(accountId);
    setAccount(fullAcct);
    setLoading(false);
  };

  const handleParsed = async (parsed: ProcessedTransaction[]) => {
    if (!account) return;
    for (const tx of parsed) {
      await addTransaction(account.id, {
        accountId: account.id,
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        date: tx.date,
        category: tx.category,
      });
    }
    loadAccount(account.id);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading…</Text>
      </View>
    );
  }

  if (!account) {
    return (
      <View style={styles.center}>
        <Text>Account not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{account.nickname}</Text>
      <Text style={styles.balance}>
        Balance: {account.currency} {account.balance.toLocaleString()}
      </Text>

      <Button
        title="Upload Statement CSV"
        onPress={() => setUploadVisible(true)}
      />

      <FlatList
        data={account.transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.txRow}>
            <Text style={styles.txDate}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
            <Text style={styles.txDesc}>{item.description}</Text>
            <Text style={styles.txAmt}>
              {item.type === 'DEBIT' ? '-' : '+'}
              {account.currency} {item.amount.toLocaleString()}
            </Text>
          </View>
        )}
      />

      <DocumentUploadModal
        visible={uploadVisible}
        onClose={() => setUploadVisible(false)}
        onParsed={handleParsed}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  balance: {
    fontSize: 18,
    marginVertical: 8,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  txDate: { flex: 2 },
  txDesc: { flex: 4 },
  txAmt: { flex: 2, textAlign: 'right' },
});

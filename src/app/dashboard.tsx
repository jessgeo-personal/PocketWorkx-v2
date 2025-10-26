// src/app/dashboard.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { getAllAccounts, Account } from '../services/accountService';

export default function DashboardScreen() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    const accts = await getAllAccounts();
    setAccounts(accts);
    setLoading(false);
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const currency = accounts[0]?.currency || 'INR';

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.netWorth}>
        Net Worth: {currency} {totalBalance.toLocaleString()}
      </Text>
      <Button title="Refresh" onPress={loadAccounts} />

      {accounts.map((acc) => (
        <View key={acc.id} style={styles.card}>
          <Text style={styles.cardTitle}>{acc.nickname}</Text>
          <Text>
            Balance: {acc.currency} {acc.balance.toLocaleString()}
          </Text>
          <Button
            title="View Details"
            onPress={() => router.push(`/account/${acc.id}`)}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    marginBottom: 12,
  },
  netWorth: {
    fontSize: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
});

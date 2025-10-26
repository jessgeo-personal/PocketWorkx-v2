// src/app/account/[id]/edit.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  fetchAccountById,
  updateAccount,
  Account,
} from '../../../services/accountService';

export default function EditAccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [account, setAccount] = useState<Account | null>(null);
  const [nickname, setNickname] = useState('');
  const [bankName, setBankName] = useState('');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState<'INR' | 'USD' | 'EUR' | 'AED' | 'GBP'>('INR');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadAccount(id);
  }, [id]);

  const loadAccount = async (accountId: string) => {
    setLoading(true);
    const accDetail = await fetchAccountById(accountId);
    if (accDetail) {
      // accDetail includes transactions; strip them
      const { transactions, ...acct } = accDetail;
      setAccount(acct);
      setNickname(acct.nickname);
      setBankName(acct.bankName);
      setBalance(String(acct.balance));
      setCurrency(acct.currency);
    }
    setLoading(false);
  };

  const onSave = async () => {
    if (!account) return;
    if (!nickname || !bankName || !balance) {
      Alert.alert('Please fill all fields');
      return;
    }
    setSaving(true);
    try {
      await updateAccount(account.id, {
        nickname,
        bankName,
        balance: Number(balance),
        currency,
      });
      router.back();
    } catch (e) {
      Alert.alert('Error updating account');
      setSaving(false);
    }
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
      <Text style={styles.title}>Edit Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Nickname"
        value={nickname}
        onChangeText={setNickname}
      />
      <TextInput
        style={styles.input}
        placeholder="Bank Name"
        value={bankName}
        onChangeText={setBankName}
      />
      <TextInput
        style={styles.input}
        placeholder="Balance"
        keyboardType="numeric"
        value={balance}
        onChangeText={setBalance}
      />
      <Button title={saving ? 'Saving…' : 'Save'} onPress={onSave} disabled={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 12,
    borderRadius: 4,
  },
});

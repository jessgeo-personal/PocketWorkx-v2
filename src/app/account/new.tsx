// src/app/account/new.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { createAccount, Account } from '../../services/accountService';

export default function CreateAccountScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState<'INR' | 'USD' | 'EUR' | 'AED' | 'GBP'>('INR');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!nickname || !bankName || !accountNumber || !balance) {
      Alert.alert('Please fill all fields');
      return;
    }
    setSaving(true);
    try {
      const newAcct = await createAccount({
        nickname,
        bankName,
        accountNumber,
        accountType: 'savings',
        balance: Number(balance),
        currency,
        isActive: true,
      });
      router.replace(`/account/${newAcct.id}`);
    } catch (e) {
      Alert.alert('Error creating account');
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Account</Text>
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
        placeholder="Account Number"
        value={accountNumber}
        onChangeText={setAccountNumber}
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
  title: { fontSize: 20, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 12,
    borderRadius: 4,
  },
});

// src/app/account/[id]/edit.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import ScreenLayout from '../../../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../utils/theme';
import {
  fetchAccountById,
  updateAccount,
  Account,
} from '../../../services/accountService';

type Currency = 'INR' | 'USD' | 'EUR' | 'AED' | 'GBP';

export default function EditAccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [account, setAccount] = useState<Account | null>(null);
  const [nickname, setNickname] = useState('');
  const [bankName, setBankName] = useState('');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState<Currency>('INR');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const currencies: { code: Currency; symbol: string; name: string }[] = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  ];

  useEffect(() => {
    if (id) loadAccount(id);
  }, [id]);

  const loadAccount = async (accountId: string) => {
    setLoading(true);
    try {
      const accDetail = await fetchAccountById(accountId);
      if (accDetail) {
        // accDetail includes transactions; strip them for account type
        const { transactions, ...acct } = accDetail;
        setAccount(acct);
        setNickname(acct.nickname);
        setBankName(acct.bankName);
        setBalance(String(acct.balance));
        setCurrency(acct.currency);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load account details');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!nickname.trim()) {
      Alert.alert('Validation Error', 'Please enter an account nickname');
      return false;
    }
    if (!bankName.trim()) {
      Alert.alert('Validation Error', 'Please enter a bank name');
      return false;
    }
    if (!balance.trim() || isNaN(Number(balance))) {
      Alert.alert('Validation Error', 'Please enter a valid balance');
      return false;
    }
    return true;
  };

  const onSave = async () => {
    if (!account || !validateForm()) return;
    
    setSaving(true);
    try {
      await updateAccount(account.id, {
        nickname: nickname.trim(),
        bankName: bankName.trim(),
        balance: Number(balance),
        currency,
      });
      Alert.alert('Success', 'Account updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update account');
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    Alert.alert(
      'Discard Changes?',
      'Any unsaved changes will be lost.',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() }
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerButton} onPress={onCancel}>
        <Feather name="x" size={24} color={Colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Edit Account</Text>
      <TouchableOpacity 
        style={[styles.headerButton, saving && styles.disabledButton]} 
        onPress={onSave}
        disabled={saving}
      >
        <Text style={[styles.saveButtonText, saving && styles.disabledText]}>
          {saving ? 'Saving...' : 'Save'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderFormField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    keyboardType: 'default' | 'numeric' = 'default',
    multiline: boolean = false
  ) => (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.textInput, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.secondary}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

  const renderCurrencySelector = () => (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>Currency</Text>
      <View style={styles.currencyContainer}>
        {currencies.map((curr) => (
          <TouchableOpacity
            key={curr.code}
            style={[
              styles.currencyOption,
              currency === curr.code && styles.selectedCurrency
            ]}
            onPress={() => setCurrency(curr.code)}
          >
            <Text style={[
              styles.currencySymbol,
              currency === curr.code && styles.selectedCurrencyText
            ]}>
              {curr.symbol}
            </Text>
            <Text style={[
              styles.currencyCode,
              currency === curr.code && styles.selectedCurrencyText
            ]}>
              {curr.code}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <ScreenLayout>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading account details...</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (!account) {
    return (
      <ScreenLayout>
        <View style={styles.center}>
          <Feather name="alert-circle" size={48} color={Colors.error.main} />
          <Text style={styles.errorText}>Account not found</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => id && loadAccount(id)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {renderHeader()}
        
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            {renderFormField(
              'Account Nickname',
              nickname,
              setNickname,
              'e.g., HDFC Savings, Salary Account'
            )}
            
            {renderFormField(
              'Bank Name',
              bankName,
              setBankName,
              'e.g., HDFC Bank, ICICI Bank'
            )}
            
            {renderFormField(
              'Current Balance',
              balance,
              setBalance,
              '0.00',
              'numeric'
            )}
            
            {renderCurrencySelector()}
            
            <View style={styles.infoCard}>
              <Feather name="info" size={20} color={Colors.info.main} />
              <Text style={styles.infoText}>
                Changes will be saved immediately. Make sure all information is accurate.
              </Text>
            </View>
          </View>
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.error.main,
    marginTop: Spacing.base,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    backgroundColor: Colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  saveButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.accent,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: Colors.text.secondary,
  },
  scrollContainer: {
    flex: 1,
  },
  formContainer: {
    padding: Spacing.base,
  },
  formField: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.border.main,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    ...Shadows.base,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  currencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.border.main,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 80,
    ...Shadows.base,
  },
  selectedCurrency: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  currencySymbol: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginRight: Spacing.xs,
  },
  currencyCode: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  selectedCurrencyText: {
    color: Colors.white,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.info.light,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info.main,
    marginTop: Spacing.lg,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.info.dark,
    marginLeft: Spacing.sm,
    flex: 1,
    lineHeight: Typography.fontSize.sm * 1.4,
  },
  bottomSpacing: {
    height: 100, // Space for bottom menu
  },
});
// src/app/accounts.tsx

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import ScreenLayout from '../components/ScreenLayout';
import { formatCurrency, formatCompactCurrency } from '../utils/currency';
import { Colors, colors } from '../utils/theme';

type Currency = 'INR';
type Money = { amount: number; currency: Currency };
type AccountType = 'savings' | 'current' | 'salary' | 'other';

type Account = {
  id: string;
  bankName: string;
  nickname: string;
  accountNumberMasked: string;
  type: AccountType;
  balance: Money;
  lastSynced?: Date | null;
};

const initialAccounts: Account[] = [
  {
    id: 'a1',
    bankName: 'ICICI Bank',
    nickname: 'ICICI Savings',
    accountNumberMasked: '****1235',
    type: 'savings',
    balance: { amount: 10023550, currency: 'INR' },
    lastSynced: new Date('2025-10-01'),
  },
  {
    id: 'a2',
    bankName: 'ICICI Bank',
    nickname: 'ICICI Salary',
    accountNumberMasked: '****3366',
    type: 'salary',
    balance: { amount: 329556, currency: 'INR' },
    lastSynced: new Date('2025-10-03'),
  },
  {
    id: 'a3',
    bankName: 'HDFC Bank',
    nickname: 'HDFC Savings',
    accountNumberMasked: '****4353',
    type: 'savings',
    balance: { amount: 329556, currency: 'INR' },
    lastSynced: new Date('2025-10-02'),
  },
];

const AccountsScreen: React.FC = () => {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const [bankName, setBankName] = useState('');
  const [nickname, setNickname] = useState('');
  const [accountNumberMasked, setAccountNumberMasked] = useState('');
  const [type, setType] = useState<AccountType>('savings');
  const [balanceAmount, setBalanceAmount] = useState('');

  const totalBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + a.balance.amount, 0),
    [accounts]
  );

  const handleUploadStatements = () =>
    Alert.alert('Coming Soon', 'Upload Statements flow will be implemented next.');
  const handleScanSMS = () =>
    Alert.alert('Coming Soon', 'SMS scanning flow will be implemented next.');
  const handleScanEmails = () =>
    Alert.alert('Coming Soon', 'Email scanning flow will be implemented next.');

  const handleOpenAdd = () => setIsAddModalVisible(true);
  const resetAddForm = () => {
    setBankName(''); setNickname(''); setAccountNumberMasked(''); setType('savings'); setBalanceAmount('');
  };
  const handleCloseAdd = () => {
    resetAddForm(); setIsAddModalVisible(false);
  };

  const handleAddAccount = () => {
    if (!bankName.trim() || !nickname.trim() || !balanceAmount.trim()) {
      Alert.alert('Error', 'Bank, Nickname, and Balance are required.');
      return;
    }
    const amt = parseFloat(balanceAmount);
    if (isNaN(amt) || amt < 0) {
      Alert.alert('Error', 'Enter a valid non-negative balance.');
      return;
    }
    const newAccount: Account = {
      id: Date.now().toString(),
      bankName: bankName.trim(),
      nickname: nickname.trim(),
      accountNumberMasked: accountNumberMasked.trim() || '****XXXX',
      type,
      balance: { amount: amt, currency: 'INR' },
    };
    setAccounts(prev => [...prev, newAccount]);
    handleCloseAdd();
  };

  const handleDeleteAccount = (id: string) =>
    Alert.alert('Confirm Delete', 'Remove this account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () =>
          setAccounts(prev => prev.filter(a => a.id !== id)) },
    ]);

  const getBankBadgeColor = (bankName: string) => {
    const b = bankName.toLowerCase();
    if (b.includes('icici')) return '#F37021';
    if (b.includes('hdfc')) return '#0054A6';
    if (b.includes('sbi')) return '#1E88E5';
    if (b.includes('axis')) return '#AE275F';
    return '#666666';
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Accounts</Text>
      <TouchableOpacity style={styles.addButton} onPress={handleOpenAdd}>
        <MaterialIcons name="add" size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const renderTotalCard = () => (
    <LinearGradient colors={['#2F80ED', '#56CCF2']} style={styles.totalCard}>
      <Text style={styles.totalLabel}>Total Bank Accounts</Text>
      <Text style={styles.totalAmount}>{formatCompactCurrency(totalBalance, 'INR')}</Text>
      <Text style={styles.entriesCount}>
        {accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'}
      </Text>
    </LinearGradient>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionGrid}>
        <TouchableOpacity style={styles.actionButton} onPress={handleUploadStatements}>
          <MaterialIcons name="upload-file" size={24} color={colors.primary} />
          <Text style={styles.actionText}>Upload Statements</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleScanSMS}>
          <MaterialIcons name="sms" size={24} color={colors.secondary} />
          <Text style={styles.actionText}>Scan SMS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleScanEmails}>
          <MaterialIcons name="email" size={24} color={colors.primary} />
          <Text style={styles.actionText}>Scan Emails</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleOpenAdd}>
          <MaterialIcons name="add-circle-outline" size={24} color={colors.secondary} />
          <Text style={styles.actionText}>Add Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAccountCard = (acc: Account) => (
    <View key={acc.id} style={styles.accountCard}>
      <View style={styles.accountHeader}>
        <View style={styles.accountLeft}>
          <View style={[styles.bankIcon, { backgroundColor: getBankBadgeColor(acc.bankName) }]}>
            <MaterialIcons name="account-balance" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.accountDetails}>
            <Text style={styles.accountNickname}>{acc.nickname}</Text>
            <Text style={styles.accountSubtext}>
              {acc.bankName} • {acc.accountNumberMasked}
            </Text>
            <Text style={styles.accountMeta}>{acc.type.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.accountRight}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceValue}>{formatCompactCurrency(acc.balance.amount, 'INR')}</Text>
        </View>
      </View>
      <View style={styles.accountActions}>
        <TouchableOpacity style={styles.rowAction} onPress={() => router.push(`/account/${acc.id}`)}>
          <MaterialIcons name="visibility" size={18} color={colors.textPrimary} />
          <Text style={styles.rowActionText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rowAction} onPress={() => router.push(`/account/${acc.id}/edit`)}>
          <MaterialIcons name="edit" size={18} color={colors.textPrimary} />
          <Text style={styles.rowActionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rowAction} onPress={() => handleDeleteAccount(acc.id)}>
          <MaterialIcons name="delete-outline" size={18} color={colors.error} />
          <Text style={[styles.rowActionText, { color: colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenLayout>
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 24 }}>
        {renderHeader()}
        {renderTotalCard()}
        {renderQuickActions()}
        <View style={styles.accountsContainer}>{accounts.map(renderAccountCard)}</View>
      </ScrollView>

      <Modal visible={isAddModalVisible} transparent animationType="slide" onRequestClose={handleCloseAdd}>
        {/* Modal content */}
      </Modal>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: Colors.background.primary },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.background.secondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.main,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
},
  headerTitle: { fontSize: 24, fontWeight: '600', color: Colors.text.primary },
  addButton: { backgroundColor: Colors.accent, borderRadius: 20, padding: 8 },

  totalCard: {
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 24,
    borderRadius: 16,
    backgroundColor: colors.primary,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  totalLabel: { fontSize: 14, color: '#FFFFFF', opacity: 0.9, marginBottom: 8 },
  totalAmount: { fontSize: 32, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  entriesCount: { fontSize: 12, color: '#FFFFFF', opacity: 0.8 },

  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },

  quickActionsContainer: { paddingHorizontal: 16, marginBottom: 24 },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    width: '47%',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: { fontSize: 12, color: Colors.text.primary, marginTop: 8, textAlign: 'center' },

  accountsContainer: { paddingHorizontal: 16, marginBottom: 100 },
  accountCard: {
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  accountLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountDetails: { flex: 1 },
  accountNickname: { fontSize: 16, fontWeight: '600', color: Colors.text.primary, marginBottom: 2 },
  accountSubtext: { fontSize: 14, color: Colors.text.secondary, marginBottom: 4 },
  accountMeta: { fontSize: 12, color: Colors.text.tertiary },

  accountRight: { alignItems: 'flex-end' },
  balanceLabel: { fontSize: 12, color: Colors.text.secondary, marginBottom: 4 },
  balanceValue: { fontSize: 20, fontWeight: '700', color: colors.secondary },

  accountActions: { flexDirection: 'row', marginTop: 8 },
  rowAction: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  rowActionText: { fontSize: 13, color: colors.textPrimary, marginLeft: 6 },

  // Modal styles here...
});

export { AccountsScreen as default };

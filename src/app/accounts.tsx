// src/app/accounts.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenLayout from '../components/ScreenLayout';
import { Colors } from '../utils/theme';
import { formatCompactCurrency } from '../utils/currency';
import type { TransactionRecord, FilterCriteria } from '../types/transactions';
import TransactionsModal from '../components/modals/TransactionsModal';
import { useStorage } from '../services/storage/StorageProvider';
import { StatusBar } from 'expo-status-bar';

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
  status?: 'active' | 'closed';
};

// Add this helper function after imports and before getAssetIcon
const parseAccountLabel = (label?: string) => {
  try {
    const obj = JSON.parse(label || '');
    if (obj && typeof obj === 'object') {
      return obj as { 
        nickname?: string; 
        accountType?: string; 
        last4?: string; 
        bankName?: string; 
      };
    }
  } catch {}
  return null;
};

// Indian bank colors for visual consistency
const getBankBadgeColor = (bankName: string) => {
  const b = bankName.toLowerCase();
  if (b.includes('icici')) return '#F37021';
  if (b.includes('hdfc')) return '#0054A6';
  if (b.includes('sbi')) return '#1E88E5';
  if (b.includes('axis')) return '#AE275F';
  if (b.includes('kotak')) return '#0066CC';
  return '#666666';
};

// Add this function after getBankBadgeColor
const formatFullINR = (value: number): string => {
  try {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });
    return formatter.format(Math.round(value));
  } catch {
    // Fallback if Intl not available
    const abs = Math.abs(Math.round(value));
    const sign = value < 0 ? '-' : '';
    const str = abs.toString();
    const lastThree = str.substring(str.length - 3);
    const otherNumbers = str.substring(0, str.length - 3);
    const result = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + 
                  (otherNumbers ? ',' : '') + lastThree;
    return `${sign}₹${result}`;
  }
};



const AccountsScreen: React.FC = () => {
  const router = useRouter();
  const { state, loading, save } = useStorage();

  // Modal states
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [bankName, setBankName] = useState('');
  const [nickname, setNickname] = useState('');
  const [accountNumberMasked, setAccountNumberMasked] = useState('');
  const [type, setType] = useState<AccountType>('savings');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Edit form fields
  const [editBankName, setEditBankName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editAccountNumberMasked, setEditAccountNumberMasked] = useState('');
  const [editType, setEditType] = useState<AccountType>('savings');
  const [editBalanceAmount, setEditBalanceAmount] = useState('');

  // TransactionsModal states
  const [txModalVisible, setTxModalVisible] = useState(false);
  const [txFilter, setTxFilter] = useState<FilterCriteria | null>(null);

  // Get accounts from storage
  const accounts: Account[] = (state?.accounts as Account[] | undefined) ?? [];

  // Calculate total balance
  const totalBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + a.balance.amount, 0),
    [accounts]
  );

  //Handle Account Delete
  const handleDeleteAccountConfirm = (acc: Account) => {
    const last4 = acc.accountNumberMasked.slice(-4).replace('*', '');
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${acc.nickname} ${last4 ? `****${last4}` : ''}?  The account and all transactions under it will be lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteAccount(acc.id) },
      ]
    );
  };

  // Reset form helper
  const resetAddForm = () => {
    setBankName('');
    setNickname('');
    setAccountNumberMasked('');
    setType('savings');
    setBalanceAmount('');
  };

  // Add account handler
  const handleAddAccount = async () => {
    if (isProcessing) return;

    if (!bankName.trim() || !nickname.trim() || !balanceAmount.trim()) {
      Alert.alert('Error', 'Bank, Nickname, and Balance are required.');
      return;
    }

    const amt = parseFloat(balanceAmount);
    if (isNaN(amt) || amt < 0) {
      Alert.alert('Error', 'Enter a valid non-negative balance.');
      return;
    }

    setIsProcessing(true);
    try {
      const newAccount: Account = {
        id: Date.now().toString(),
        bankName: bankName.trim(),
        nickname: nickname.trim(),
        accountNumberMasked: accountNumberMasked.trim() || '****XXXX',
        type,
        balance: { amount: amt, currency: 'INR' },
        lastSynced: new Date(),
        status: 'active',
      };

      await save(draft => {
        const next = draft.accounts ? [...draft.accounts] : [];
        next.push(newAccount);
        return { ...draft, accounts: next };
      });

      resetAddForm();
      setIsAddModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add account. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditAccount = (acc: Account) => {
    setEditingAccount(acc);
    setEditBankName(acc.bankName);
    setEditNickname(acc.nickname);
    setEditAccountNumberMasked(acc.accountNumberMasked);
    setEditType(acc.type);
    setEditBalanceAmount(String(acc.balance.amount));
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAccount) return;
    const amt = Number(editBalanceAmount);
    if (!Number.isFinite(amt) || amt < 0) {
      Alert.alert('Error', 'Enter a valid non-negative balance.');
      return;
    }
    await save(draft => {
      const next = (draft.accounts ?? []).map((a: Account) =>
        a.id === editingAccount.id
          ? {
              ...a,
              bankName: editBankName.trim(),
              nickname: editNickname.trim(),
              accountNumberMasked: editAccountNumberMasked.trim() || a.accountNumberMasked,
              type: editType,
              balance: { amount: amt, currency: 'INR' },
              lastSynced: new Date(),
            }
          : a
      );
      return { ...draft, accounts: next };
    });
    setIsEditModalVisible(false);
    setEditingAccount(null);
  };



  // Delete account handler
  const handleDeleteAccount = (id: string) =>
    Alert.alert('Confirm Delete', 'Remove this account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await save(draft => {
            const next = (draft.accounts ?? []).filter((a: Account) => a.id !== id);
            return { ...draft, accounts: next };
          });
        },
      },
    ]);

  // Quick action handlers
  const handleUploadStatements = () =>
    Alert.alert('Coming Soon', 'Upload Statements flow will be implemented next.');
  const handleScanSMS = () =>
    Alert.alert('Coming Soon', 'SMS scanning flow will be implemented next.');
  const handleScanEmails = () =>
    Alert.alert('Coming Soon', 'Email scanning flow will be implemented next.');

  // Header component
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Accounts</Text>
      <TouchableOpacity style={styles.addButton} onPress={() => setIsAddModalVisible(true)}>
        <MaterialIcons name="add" size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  // Total card - CLICKABLE to open all transactions
  const renderTotalCard = () => {
    const handleOpenAllTransactions = () => {
      setTxFilter({
        assetType: 'account',
        filterType: 'all',
        assetLabel: 'All Bank Accounts',
      });
      setTxModalVisible(true);
    };

    return (
      <TouchableOpacity activeOpacity={0.9} onPress={handleOpenAllTransactions}>
        <LinearGradient colors={['#2F80ED', '#56CCF2']} style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Bank Accounts</Text>
          <Text style={[
            styles.totalAmount,
            totalBalance < 0 && styles.negativeTotalAmount
          ]}>
            {formatFullINR(totalBalance)}
          </Text>
          <Text style={styles.entriesCount}>
            {accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Quick actions grid
  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionGrid}>
        <TouchableOpacity style={styles.actionButton} onPress={handleUploadStatements}>
          <MaterialIcons name="upload-file" size={24} color="#8B5CF6" />
          <Text style={styles.actionText}>Upload Statements</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleScanSMS}>
          <MaterialIcons name="sms" size={24} color="#8B5CF6" />
          <Text style={styles.actionText}>Scan SMS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleScanEmails}>
          <MaterialIcons name="email" size={24} color="#8B5CF6" />
          <Text style={styles.actionText}>Scan Emails</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => setIsAddModalVisible(true)}>
          <MaterialIcons name="add-circle-outline" size={24} color="#8B5CF6" />
          <Text style={styles.actionText}>Add Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Account card - CLICKABLE to open filtered transactions
  const renderAccountCard = (acc: Account) => {
    const handleOpenAccountTransactions = () => {
      setTxFilter({
        assetType: 'account',
        filterType: 'category',
        // Pack full card reference so modal can display it
        assetLabel: JSON.stringify({
          nickname: acc.nickname,
          accountType: acc.type,
          last4: acc.accountNumberMasked.slice(-4).replace('*', ''),
          bankName: acc.bankName,
        }),
      });
      setTxModalVisible(true);
    };

   return (
    <TouchableOpacity
      key={acc.id}
      style={[
        styles.accountCard,
        (acc.status ?? 'active') === 'closed' && { opacity: 0.6 }
      ]}

      activeOpacity={0.9}
      onPress={handleOpenAccountTransactions}
    >
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
      </View>
      <View style={styles.accountRight}>
        <Text style={styles.balanceLabel}>Account Balance</Text>
        <Text
          style={[
            styles.balanceValue,
            acc.balance.amount < 0 && styles.negativeAmount
          ]}
        >
          {formatFullINR(acc.balance.amount)}
        </Text>
      </View>
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: '#EEE', marginTop: 8 }} />

      <View style={styles.accountActionsBottomRow}>
        <TouchableOpacity
          style={styles.rowAction}
          onPress={(e) => {
            e.stopPropagation();
            setTxFilter({
              assetType: 'account',
              filterType: 'category',
              assetLabel: JSON.stringify({
                nickname: acc.nickname,
                accountType: acc.type,
                last4: acc.accountNumberMasked.slice(-4).replace('*', ''),
                bankName: acc.bankName,
              }),
            });
            setTxModalVisible(true);
          }}
        >
          <MaterialIcons name="visibility" size={18} color={Colors.text.primary} />
          <Text style={styles.rowActionText}>View</Text>
        </TouchableOpacity>

        
        {(acc.status ?? 'active') === 'active' ? (
          <TouchableOpacity
            style={styles.rowAction}
            onPress={(e) => {
              e.stopPropagation();
              save(draft => {
                const next = (draft.accounts ?? []).map((a: Account) =>
                  a.id === acc.id ? { ...a, status: 'closed' as const } : a
                );
                return { ...draft, accounts: next };
              });
            }}
          >
            <MaterialIcons name="lock" size={18} color={Colors.text.primary} />
            <Text style={styles.rowActionText}>Close</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.rowAction}
            onPress={(e) => {
              e.stopPropagation();
              save(draft => {
                const next = (draft.accounts ?? []).map((a: Account) =>
                  a.id === acc.id ? { ...a, status: 'active' as const } : a
                );
                return { ...draft, accounts: next };
              });
            }}
          >
            <MaterialIcons name="lock-open" size={18} color={Colors.text.primary} />
            <Text style={styles.rowActionText}>Revive</Text>
          </TouchableOpacity>
        )}




        <TouchableOpacity
          style={styles.rowAction}
          onPress={(e) => {
            e.stopPropagation();
            openEditAccount(acc);
          }}
        >
          <MaterialIcons name="edit" size={18} color={Colors.text.primary} />
          <Text style={styles.rowActionText}>Edit</Text>
        </TouchableOpacity>

      </View>
    </TouchableOpacity>
  );}



  // Add account modal
  const renderAddModal = () => (
    <Modal visible={isAddModalVisible} transparent animationType="slide" onRequestClose={() => setIsAddModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Bank Account</Text>
            <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Bank Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={bankName}
                  onChangeText={setBankName}
                  placeholder="e.g., HDFC Bank, ICICI Bank"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Account Nickname *</Text>
                <TextInput
                  style={styles.textInput}
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="e.g., HDFC Savings, Salary Account"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Account Number (Last 4 digits)</Text>
                <TextInput
                  style={styles.textInput}
                  value={accountNumberMasked}
                  onChangeText={setAccountNumberMasked}
                  placeholder="****1234"
                  maxLength={8}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Account Type *</Text>
                <View style={styles.pickerContainer}>
                  {(['savings', 'current', 'salary', 'other'] as AccountType[]).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.pickerOption,
                        type === option && styles.pickerOptionSelected
                      ]}
                      onPress={() => setType(option)}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        type === option && styles.pickerOptionTextSelected
                      ]}>
                        {option.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Current Balance (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={balanceAmount}
                  onChangeText={setBalanceAmount}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsAddModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.addButton, isProcessing && styles.disabledButton]}
              onPress={handleAddAccount}
              disabled={isProcessing}
            >
              <Text style={styles.addButtonText}>
                {isProcessing ? 'Adding...' : 'Add Account'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Edit account modal
  const renderEditModal = () => (
    <Modal visible={isEditModalVisible} transparent animationType="slide" onRequestClose={() => setIsEditModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Bank Account</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => {
                  if (editingAccount) handleDeleteAccountConfirm(editingAccount);
                }}
                style={{ marginRight: 12 }}
              >
                <MaterialIcons name="delete" size={22} color="#E74C3C" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Bank Name *</Text>
                <TextInput style={styles.textInput} value={editBankName} onChangeText={setEditBankName} />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Account Nickname *</Text>
                <TextInput style={styles.textInput} value={editNickname} onChangeText={setEditNickname} />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Account Number (Last 4 digits)</Text>
                <TextInput style={styles.textInput} value={editAccountNumberMasked} onChangeText={setEditAccountNumberMasked} />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Account Type *</Text>
                <View style={styles.pickerContainer}>
                  {(['savings', 'current', 'salary', 'other'] as AccountType[]).map((option) => (
                    <TouchableOpacity
                      key={`edit-${option}`}
                      style={[styles.pickerOption, editType === option && styles.pickerOptionSelected]}
                      onPress={() => setEditType(option)}
                    >
                      <Text style={[styles.pickerOptionText, editType === option && styles.pickerOptionTextSelected]}>
                        {option.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Current Balance (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={editBalanceAmount}
                  onChangeText={setEditBalanceAmount}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={handleSaveEdit}>
              <Text style={styles.addButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );


  if (loading) {
    return (
      <ScreenLayout>
        <View style={{ padding: 16 }}>
          <Text>Loading accounts data…</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <StatusBar style="dark" backgroundColor="#F7D94C" />
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      {renderHeader()}

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 24 }}>
        {renderTotalCard()}
        {renderQuickActions()}
        
        <View style={styles.accountsContainer}>
          <Text style={styles.sectionTitle}>Your Bank Accounts</Text>
          {accounts.length > 0 ? (
            [...accounts]
              .sort((a, b) => {
                const ac = (a.status ?? 'active') === 'closed';
                const bc = (b.status ?? 'active') === 'closed';
                if (ac === bc) return 0;
                return ac ? 1 : -1;
              })
              .map(renderAccountCard)
          ) : (
            <View style={styles.emptyAccounts}>
              <MaterialIcons name="account-balance" size={64} color="#E0E0E0" />
              <Text style={styles.emptyText}>No bank accounts yet</Text>
              <Text style={styles.emptySubtext}>Add your first bank account to get started</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {renderAddModal()}
      {renderEditModal()}
      
      {/* TransactionsModal Integration */}
      {txFilter ? (
        <TransactionsModal
          visible={txModalVisible}
          onClose={() => setTxModalVisible(false)}
          params={{ filterCriteria: txFilter }}
        />
      ) : null}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#F7D94C' }, // Golden background
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: { fontSize: 24, fontWeight: '600', color: '#1A1A1A' },
  addButton: { backgroundColor: '#8B5CF6', borderRadius: 20, padding: 8 }, // Purple accent

  totalCard: {
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 24,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  totalLabel: { fontSize: 14, color: '#FFFFFF', opacity: 0.9, marginBottom: 8 },
  totalAmount: { fontSize: 32, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  entriesCount: { fontSize: 12, color: '#FFFFFF', opacity: 0.8 },

  quickActionsContainer: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
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
  actionText: { fontSize: 12, color: '#1A1A1A', marginTop: 8, textAlign: 'center' },

  accountsContainer: { paddingHorizontal: 16, marginBottom: 100 },
  accountCard: {
    backgroundColor: '#FFFFFF',
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
  accountNickname: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 2 },
  accountSubtext: { fontSize: 14, color: '#666666', marginBottom: 4 },
  accountMeta: { fontSize: 12, color: '#999999' },
  deleteButton: { padding: 4 },

  accountRight: { alignItems: 'flex-end' },
  balanceLabel: { fontSize: 12, color: '#666666', marginBottom: 4 },
  balanceValue: { fontSize: 20, fontWeight: '700', color: '#8B5CF6' }, // Purple amount

  emptyAccounts: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalScrollView: {
    flexGrow: 1,
  },
  modalBody: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  pickerOptionSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  pickerOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666666',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
    opacity: 0.6,
  },
  logoContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
  },
  logo: {
    width: 200,
    height: 100,
  },
  negativeTotalAmount: {
    color: '#FF6B6B', // Lighter red for header negative amounts
  },
  negativeAmount: {
    color: '#E74C3C',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowActionText: {
    fontSize: 13,
    color: Colors.text.primary,
    marginLeft: 6,
  },
  accountActionsBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },

});

export { AccountsScreen as default };
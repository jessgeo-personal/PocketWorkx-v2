// src/app/accounts.tsx
import React, { useState, useMemo, useEffect } from 'react';
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
import { useLocalSearchParams,useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenLayout from '../components/ScreenLayout';
import { Colors } from '../utils/theme';
import { formatCompactCurrency } from '../utils/currency';
import { AssetType, CurrencyCode, BaseAsset, EncryptedStorageMetadata, AuditTrail } from '../types/finance';
import { generateAssetId, maskAccountNumber, getDefaultUserProfile } from '../utils/idGeneration';
import { formatFullINR } from '../utils/currency';
import TransactionsModal from '../components/modals/TransactionsModal';
import { useStorage } from '../services/storage/StorageProvider';
import { StatusBar } from 'expo-status-bar';
import type { TransactionRecord, FilterCriteria, AccountTransaction } from '../types/transactions';
import { DebitCategoryType, getDebitCategoryOptions } from '../types/categories';
import AppFooter from '../components/AppFooter';
import ComingSoonModal from '../components/ui/ComingSoonModal';


type Currency = 'INR';
type Money = { amount: number; currency: Currency };
type AccountType = 'savings' | 'current' | 'salary' | 'other';

type Account = {
  id: string;
  bankName: string;
  nickname: string;
  accountNumberMasked: string; // Keep for backward compatibility
  accountNumberFull?: string; // NEW: full account number or IBAN
  ifscCode?: string; // NEW
  swiftCode?: string; // NEW
  upiId?: string; // NEW
  accountHolderName?: string; // NEW
  type: AccountType;
  balance: Money;
  lastSynced?: Date | null;
  status?: 'active' | 'closed';
  transactions?: AccountTransaction[]; // NEW: ready for persistence

  // New BaseAsset fields (optional for migration compatibility)
  assetId?: string;
  userProfile?: string;
  assetType?: import('../types/finance').AssetType;
  currency?: import('../types/finance').CurrencyCode;
  currencyFormat?: 'Indian' | 'NonIndian';
  assetHolderName?: string;
  assetNickname?: string;
  bankNameOrIssuer?: string;
  createdDate?: Date;
  createdBy?: string;
  assetStatus?: 'active' | 'inactive' | 'closed';

  // Add these two to match object literal in handleAddAccount
  encryptedData?: import('../types/finance').EncryptedStorageMetadata;
  auditTrail?: import('../types/finance').AuditTrail;
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

// Helper for future transaction management
const createAccountTransaction = (
  type: AccountTransaction['type'],
  amount: number,
  description: string,
  notes?: string
): AccountTransaction => ({
  id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  datetime: new Date(),
  amount: { amount, currency: 'INR' },
  description,
  type,
  notes,
  source: 'manual',
  status: 'completed',
});

// Add this function after getBankBadgeColor
///const formatFullINR = (value: number): string => {
  ///try {
    ///const formatter = new Intl.NumberFormat('en-IN', {
      ///style: 'currency',
      ///currency: 'INR',
      ///maximumFractionDigits: 0,
      ///minimumFractionDigits: 0,
    ///});
    ///return formatter.format(Math.round(value));
  ///} catch {
    // Fallback if Intl not available
    ///const abs = Math.abs(Math.round(value));
    ///const sign = value < 0 ? '-' : '';
    ///const str = abs.toString();
    ///const lastThree = str.substring(str.length - 3);
    ///const otherNumbers = str.substring(0, str.length - 3);
    ///const result = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + 
       ///           (otherNumbers ? ',' : '') + lastThree;
    ///return `${sign}₹${result}`;
  ///}
///};



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
  const [accountNumberFull, setAccountNumberFull] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [isDebitModalVisible, setIsDebitModalVisible] = useState(false);



  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Edit form fields
  const [editBankName, setEditBankName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editAccountNumberMasked, setEditAccountNumberMasked] = useState('');
  const [editType, setEditType] = useState<AccountType>('savings');
  const [editBalanceAmount, setEditBalanceAmount] = useState('');
  const [editAccountNumberFull, setEditAccountNumberFull] = useState('');
  const [editIfscCode, setEditIfscCode] = useState('');
  const [editSwiftCode, setEditSwiftCode] = useState('');
  const [editUpiId, setEditUpiId] = useState('');
  const [editAccountHolderName, setEditAccountHolderName] = useState('');

  const [debitAmount, setDebitAmount] = useState('');
  const [debitDescription, setDebitDescription] = useState('');
  const [debitCategory, setDebitCategory] = useState<string>('other');
  const [debitDate, setDebitDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [accountSearch, setAccountSearch] = useState('');


  // TransactionsModal states
  const [txModalVisible, setTxModalVisible] = useState(false);
  const [txFilter, setTxFilter] = useState<FilterCriteria | null>(null);
  // ComingSoonModal states
  const [isComingSoonModalVisible, setIsComingSoonModalVisible] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState('');
  const [comingSoonDescription, setComingSoonDescription] = useState('');

// Get navigation parameters for auto-opening modals
const searchParams = useLocalSearchParams<{ openModal?: string }>();

  // Auto-open debit modal when navigated from home quick actions
  useEffect(() => {
    if (searchParams?.openModal === 'debit') {
      setIsDebitModalVisible(true);
    }
  }, [searchParams?.openModal]);

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

  // Edit form validation (inside component)
  const editFormValidation = useMemo(() => {
    if (!editingAccount) return { hasChanges: false, isValid: false };
    
    const currentBalance = Number(editBalanceAmount);
    const isBalanceValid = Number.isFinite(currentBalance) && currentBalance >= 0;
    
    const hasChanges = (
      //editBankName.trim() !== editingAccount.bankName ||
      editNickname.trim() !== editingAccount.nickname ||
      //editAccountNumberFull.trim() !== (editingAccount.accountNumberFull || '') ||
      editIfscCode.trim() !== (editingAccount.ifscCode || '') ||
      editSwiftCode.trim() !== (editingAccount.swiftCode || '') ||
      editUpiId.trim() !== (editingAccount.upiId || '') ||
      editAccountHolderName.trim() !== (editingAccount.accountHolderName || '') 
      //||
      //editType !== editingAccount.type ||
      //currentBalance !== editingAccount.balance.amount
    );
    
    const isValid = (
      //editBankName.trim().length > 0 && 
      editNickname.trim().length > 0 
      //&&
      //isBalanceValid
    );
    
    return { hasChanges, isValid };
  }, [
    editingAccount,
    editBankName,
    editNickname,
    editAccountNumberFull,
    editIfscCode,
    editSwiftCode,
    editUpiId,
    editAccountHolderName,
    editType,
    editBalanceAmount
  ]);

  const showComingSoon = (feature: string, description: string) => {
    setComingSoonFeature(feature);
    setComingSoonDescription(description);
    setIsComingSoonModalVisible(true);
  };


  // Reset form helper
  const resetAddForm = () => {
    setBankName('');
    setNickname('');
    setAccountNumberMasked('');
    setAccountNumberFull('');
    setIfscCode('');
    setSwiftCode('');
    setUpiId('');
    setAccountHolderName('');
    setType('savings');
    setBalanceAmount('');
  };

  // Add account handler
  const handleAddAccount = async () => {
    if (isProcessing) return;

    if (!bankName.trim() || !accountNumberFull.trim() || !balanceAmount.trim()) {
      Alert.alert('Error', 'Bank Name, Full Account Number, and Opening Balance are required.');
      return;
    }

    const amt = parseFloat(balanceAmount);
    if (isNaN(amt) || amt < 0) {
      Alert.alert('Error', 'Enter a valid non-negative balance.');
      return;
    }

    setIsProcessing(true);
    try {
      const now = new Date();
      const fullNumber = accountNumberFull.trim();
      const maskedNumber = maskAccountNumber(fullNumber);
      const derivedMasked = `****${maskedNumber}`;

      // Auto-generate nickname if not provided
      const finalNickname = nickname.trim() || 
        `${bankName.trim()} ${type.charAt(0).toUpperCase() + type.slice(1)} ${maskedNumber}`;

      // Generate guideline-compliant asset ID
      const assetId = generateAssetId(
        AssetType.BANK_ACCOUNT,
        finalNickname,
        CurrencyCode.INR,
        maskedNumber
      );

      const newAccount: Account = {
        // Legacy fields (backward compatibility)
        id: Date.now().toString(),
        bankName: bankName.trim(),
        nickname: finalNickname,
        accountNumberMasked: derivedMasked,
        accountNumberFull: fullNumber,
        ifscCode: ifscCode.trim() || undefined,
        swiftCode: swiftCode.trim() || undefined,
        upiId: upiId.trim() || undefined,
        accountHolderName: accountHolderName.trim() || undefined,
        type,
        balance: { amount: amt, currency: 'INR' },
        lastSynced: now,
        status: 'active',
        transactions: [],

        // New BaseAsset-compliant fields (guidelines compliance)
        assetId,
        userProfile: getDefaultUserProfile(),
        assetType: AssetType.BANK_ACCOUNT,
        currency: CurrencyCode.INR,
        currencyFormat: 'Indian',
        assetHolderName: accountHolderName.trim() || 'Account Holder',
        assetNickname: finalNickname,
        bankNameOrIssuer: bankName.trim(),
        createdDate: now,
        createdBy: 'user',
        assetStatus: 'active',
        
        // Security fields (using defaults)
        encryptedData: {
          encryptionKey: '',
          encryptionAlgorithm: 'AES-256' as const,
          lastEncrypted: now,
          isEncrypted: false,
        },
        auditTrail: {
          createdBy: 'user',
          createdAt: now,
          updatedBy: 'user',
          updatedAt: now,
          version: 1,
          changes: [{
            field: 'account_created',
            oldValue: null,
            newValue: assetId,
            timestamp: now,
            reason: 'New account creation'
          }],
        },
      };

      await save(draft => {
        const next = draft.accounts ? [...draft.accounts] : [];
        next.push(newAccount);
        return { ...draft, accounts: next };
      });

      resetAddForm();
      setIsAddModalVisible(false);
    } catch (error) {
      console.error('Account creation error:', error);
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
      setEditAccountNumberFull(acc.accountNumberFull || '');
      setEditIfscCode(acc.ifscCode || '');
      setEditSwiftCode(acc.swiftCode || '');
      setEditUpiId(acc.upiId || '');
      setEditAccountHolderName(acc.accountHolderName || '');
      setEditType(acc.type);
      setEditBalanceAmount(String(acc.balance.amount));
      setIsEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAccount) return;
    
    if (!editFormValidation.isValid) {
      Alert.alert('Error', 'Bank Name, Account Nickname, and a valid non-negative balance are required.');
      return;
    }
    
    if (!editFormValidation.hasChanges) {
      Alert.alert('Info', 'No changes to save.');
      return;
    }
    
    const amt = Number(editBalanceAmount);
    const fullNumber = editAccountNumberFull.trim();
    const derivedMasked = fullNumber
      ? (fullNumber.length >= 4 ? `****${fullNumber.slice(-4)}` : '****XXXX')
      : editingAccount.accountNumberMasked;

    await save(draft => {
      const next = (draft.accounts ?? []).map((a: Account) =>
        a.id === editingAccount.id
          ? {
              ...a,
               // Core fields remain unchanged:
              //bankName: editBankName.trim(),
              nickname: editNickname.trim(),
              accountNumberMasked: derivedMasked,
              //accountNumberFull: fullNumber || undefined,
              ifscCode: editIfscCode.trim() || undefined,
              swiftCode: editSwiftCode.trim() || undefined,
              upiId: editUpiId.trim() || undefined,
              accountHolderName: editAccountHolderName.trim() || undefined,
              //type: editType,
              //balance: { amount: amt, currency: 'INR' },
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

  // Quick action handlers 1
  // Replace the handleSaveDebitExpense function in accounts.tsx with this corrected implementation
  const handleSaveDebitExpense = async () => {
    // Validation
    if (!debitAmount || isNaN(Number(debitAmount)) || Number(debitAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount greater than 0.');
      return;
    }

    if (!selectedAccountId) {
      Alert.alert('Error', 'Please select an account for the debit transaction.');
      return;
    }

    if (!debitDate) {
      Alert.alert('Error', 'Please select a transaction date.');
      return;
    }

    const amount = Number(debitAmount);
    const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
    
    if (!selectedAccount) {
      Alert.alert('Error', 'Selected account not found. Please select a valid account.');
      return;
    }

    // Check if account is closed
    if ((selectedAccount.status ?? 'active') === 'closed') {
      Alert.alert('Error', 'Cannot debit from a closed account. Please select an active account.');
      return;
    }

    // DECLARE the processDebitTransaction function FIRST
    const processDebitTransaction = async () => {
      try {
        setIsProcessing(true);

        // 1. Create AccountTransaction with type 'withdrawal' - NEGATIVE amount for debits
        const newTransaction: AccountTransaction = createAccountTransaction(
          'withdrawal',
          -amount,  // Make debit amounts negative
          debitDescription.trim() || `${debitCategory.toUpperCase()} expense`,
          `Category: ${debitCategory} | Date: ${debitDate}`
        );


        // 2. Update the selected account with new transaction and reduced balance
        await save(draft => {
          const updatedAccounts = (draft.accounts ?? []).map((account: Account) => {
            if (account.id === selectedAccountId) {
              // Ensure transactions array exists
              const existingTransactions = account.transactions ?? [];
              
              return {
                ...account,
                // 3. Append to selectedAccount.transactions array
                transactions: [...existingTransactions, newTransaction],
                // 4. Update balance - since newTransaction.amount is already negative, we ADD it
                balance: {
                  ...account.balance,
                  amount: account.balance.amount + newTransaction.amount.amount  // Add negative amount
                },
                lastSynced: new Date(),
              };
            }
            return account;
          });

          return { ...draft, accounts: updatedAccounts };
        });

        // Success feedback
        Alert.alert(
          'Transaction Saved', 
          `Debit of ${formatFullINR(amount)} saved successfully to ${selectedAccount.nickname}.`,
          [{ text: 'OK', onPress: () => {
            // Reset form and close modal
            setDebitAmount('');
            setDebitDescription('');
            setDebitCategory('other');
            setDebitDate(new Date().toISOString().slice(0,10));
            setSelectedAccountId('');
            setAccountSearch('');
            setIsDebitModalVisible(false);
          }}]
        );

      } catch (error) {
        console.error('Debit transaction save failed:', error);
        Alert.alert('Error', 'Failed to save transaction. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    };

    // Check sufficient balance (optional warning) - NOW CALL the function
    if (selectedAccount.balance.amount < amount) {
      Alert.alert(
        'Insufficient Balance',
        `Account balance: ${formatFullINR(selectedAccount.balance.amount)}\nTransaction amount: ${formatFullINR(amount)}\n\nThis will result in a negative balance. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => processDebitTransaction() }
        ]
      );
      return;
    }

    // Direct call for sufficient balance
    processDebitTransaction();
  };


  // Quick action handlers 2
  const handleUploadStatements = () =>
    showComingSoon('Statement Upload', 'Upload PDF or image bank statements for automatic transaction import and categorization.');
    
  // Quick action handlers 3
  const handleScanSMS = () =>
    showComingSoon('SMS Scanner', 'Automatically detect and import transactions from bank SMS notifications in your inbox.');
    
  // Quick action handlers 4
  const handleScanEmails = () =>
    showComingSoon('Email Scanner', 'Import transactions from bank email statements, e-receipts, and payment confirmations.');


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
        <TouchableOpacity style={styles.actionButton} onPress={() => setIsDebitModalVisible(true)}>
          <MaterialIcons name="point-of-sale" size={24} color="#8B5CF6" />
          <Text style={styles.actionText}>Add Debit Card/UPI Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleScanSMS}>
          <MaterialIcons name="sms" size={24} color="#8B5CF6" />
          <Text style={styles.actionText}>Scan SMS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleScanEmails}>
          <MaterialIcons name="email" size={24} color="#8B5CF6" />
          <Text style={styles.actionText}>Scan Emails</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleUploadStatements}>
          <MaterialIcons name="upload-file" size={24} color="#8B5CF6" />
          <Text style={styles.actionText}>Upload Statements</Text>
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
        assetId: acc.id, // stable filter key
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
        <MaterialIcons name="chevron-right" size={22} color={Colors.text.secondary} />
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
            style={[styles.rowAction, { opacity: 1 }]}
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
            style={[styles.rowAction, { opacity: 1 }]}
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
                <Text style={styles.inputLabel}>Full Account Number / IBAN *</Text>
                <TextInput
                  style={styles.textInput}
                  value={accountNumberFull}
                  onChangeText={setAccountNumberFull}
                  placeholder="Complete account number or IBAN"
                  keyboardType="default"
                  autoCapitalize="characters"
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
                <Text style={styles.inputLabel}>Opening Balance (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={balanceAmount}
                  onChangeText={setBalanceAmount}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              {/* Optional Fields Divider */}
              <View style={styles.optionalFieldsDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Optional fields</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Account Holder Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={accountHolderName}
                  onChangeText={setAccountHolderName}
                  placeholder="Name as per bank records"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Account Nickname (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="Auto-generated if left blank"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>IFSC Code</Text>
                <TextInput
                  style={styles.textInput}
                  value={ifscCode}
                  onChangeText={(text) => setIfscCode(text.toUpperCase())}
                  placeholder="e.g., HDFC0001234"
                  autoCapitalize="characters"
                  maxLength={11}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Swift Code</Text>
                <TextInput
                  style={styles.textInput}
                  value={swiftCode}
                  onChangeText={(text) => setSwiftCode(text.toUpperCase())}
                  placeholder="e.g., HDFCINBB"
                  autoCapitalize="characters"
                  maxLength={11}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>UPI ID</Text>
                <TextInput
                  style={styles.textInput}
                  value={upiId}
                  onChangeText={setUpiId}
                  placeholder="e.g., yourname@paytm"
                  keyboardType="email-address"
                  autoCapitalize="none"
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
                accessibilityRole="button"
                accessibilityLabel="Delete account"
              >
                <MaterialIcons name="delete" size={22} color="#E74C3C" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)} accessibilityRole="button" accessibilityLabel="Close edit modal">
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.modalBody}>
              {/* Required fields only */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Bank Name</Text>
                <View style={[styles.textInput, styles.readOnlyInput]}>
                  <Text style={styles.readOnlyText}>{editingAccount?.bankName}</Text>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Account Number / IBAN</Text>
                <View style={[styles.textInput, styles.readOnlyInput]}>
                  <Text style={styles.readOnlyText}>
                    {editingAccount?.accountNumberFull || 'Not provided'}
                  </Text>
                </View>
              </View>


              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Account Type</Text>
                <View style={[styles.textInput, styles.readOnlyInput]}>
                  <Text style={styles.readOnlyText}>{editingAccount?.type?.toUpperCase()}</Text>
                </View>
              </View>


              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Opening Balance (₹)</Text>
                <View style={[styles.textInput, styles.readOnlyInput]}>
                  <Text style={styles.readOnlyText}>
                    {formatFullINR(editingAccount?.balance?.amount || 0)}
                  </Text>
                </View>
                <Text style={styles.readOnlyHint}>
                  Balance is updated automatically by transactions
                </Text>
              </View>


              {/* Optional Fields Divider */}
              <View style={styles.optionalFieldsDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Optional fields</Text>
              </View>

              {/* Optional fields (same order as Add Account) */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Account Holder Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editAccountHolderName}
                  onChangeText={setEditAccountHolderName}
                  placeholder="Name as per bank records"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Account Nickname (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={editNickname}
                  onChangeText={setEditNickname}
                  placeholder="Auto-generated if left blank"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>IFSC Code</Text>
                <TextInput
                  style={styles.textInput}
                  value={editIfscCode}
                  onChangeText={(text) => setEditIfscCode(text.toUpperCase())}
                  placeholder="e.g., HDFC0001234"
                  autoCapitalize="characters"
                  maxLength={11}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Swift Code</Text>
                <TextInput
                  style={styles.textInput}
                  value={editSwiftCode}
                  onChangeText={(text) => setEditSwiftCode(text.toUpperCase())}
                  placeholder="e.g., HDFCINBB"
                  autoCapitalize="characters"
                  maxLength={11}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>UPI ID</Text>
                <TextInput
                  style={styles.textInput}
                  value={editUpiId}
                  onChangeText={setEditUpiId}
                  placeholder="e.g., yourname@paytm"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.addButton, 
                (!editFormValidation.hasChanges || !editFormValidation.isValid) && styles.disabledButton
              ]} 
              onPress={handleSaveEdit}
              disabled={!editFormValidation.hasChanges || !editFormValidation.isValid}
            >
              <Text style={styles.addButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderDebitModal = () => {
    const accountsList = accounts.filter(a => (a.status ?? 'active') === 'active');

    return (
      <Modal
        visible={isDebitModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDebitModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Debit Card/UPI Expense</Text>
              <TouchableOpacity onPress={() => setIsDebitModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.modalBody}>
                {/* Amount */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Amount (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={debitAmount}
                    onChangeText={setDebitAmount}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>

                {/* Description */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Description (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={debitDescription}
                    onChangeText={setDebitDescription}
                    placeholder="e.g., Grocery, Fuel, Food"
                  />
                </View>

                {/* Category - reuse cash categories style */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Debit Category</Text>
                  <View style={styles.pickerContainer}>
                    {getDebitCategoryOptions().map(option => (
                      <TouchableOpacity
                        key={option}
                        style={[styles.pickerOption, debitCategory === option && styles.pickerOptionSelected]}
                        onPress={() => setDebitCategory(option)}
                      >
                        <Text style={[styles.pickerOptionText, debitCategory === option && styles.pickerOptionTextSelected]}>
                          {option.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Date selector */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Transaction Date *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={debitDate}
                    onChangeText={setDebitDate}
                    placeholder={new Date().toISOString().slice(0,10)}
                  />
                </View>

                {/* Account picker with dropdown switch */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Debit Account *</Text>
                  <View style={styles.pickerContainer}>
                    {(accountsList.length <= 5 ? accountsList : accountsList.slice(0,5)).map((acc) => (
                      <TouchableOpacity
                        key={acc.id}
                        style={[styles.pickerOption, selectedAccountId === acc.id && styles.pickerOptionSelected]}
                        onPress={() => setSelectedAccountId(acc.id)}
                      >
                        <Text style={[styles.pickerOptionText, selectedAccountId === acc.id && styles.pickerOptionTextSelected]}>
                          {acc.nickname}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {accountsList.length > 5 && (
                    <View style={{ marginTop: 8 }}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Search/select account"
                        value={accountSearch}
                        onChangeText={setAccountSearch}
                      />
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsDebitModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleSaveDebitExpense} // To be added in HP-4
              >
                <Text style={styles.addButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };




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
        <AppFooter />
      </ScrollView>

      {renderAddModal()}
      {renderEditModal()}
      {renderDebitModal()}

      {/* TransactionsModal Integration */}
      {txFilter ? (
        <TransactionsModal
          visible={txModalVisible}
          onClose={() => setTxModalVisible(false)}
          params={{ filterCriteria: txFilter }}
        />
      ) : null}

      {/* ComingSoonModal Integration */}
      <ComingSoonModal
        visible={isComingSoonModalVisible}
        onClose={() => setIsComingSoonModalVisible(false)}
        feature={comingSoonFeature}
        description={comingSoonDescription}
      />

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
  optionalFieldsDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    marginHorizontal: 4,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E0E0E0',
    marginRight: 12,
  },
  dividerText: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
    textAlign: 'right',
  },
  readOnlyInput: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    justifyContent: 'center',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  readOnlyHint: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
    fontStyle: 'italic',
  },

});

export { AccountsScreen as default };
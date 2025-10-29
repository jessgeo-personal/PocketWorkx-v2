// src/app/cash.tsx
import React, { useState } from 'react';
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
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenLayout from '../components/ScreenLayout';
import { Colors } from '../utils/theme';
import { formatCompactCurrency } from '../utils/currency';
import type { TransactionRecord, FilterCriteria } from '../types/transactions';

import TransactionsModal from '../components/modals/TransactionsModal';



// NEW: use the shared storage (file-backed) instead of component-local arrays
import { useStorage } from '../services/storage/StorageProvider';

// Align with your existing CashEntry typing in src/types/finance
// If you have the CashEntry type defined, import it:
// import { CashEntry } from '../types/finance';
// Otherwise, define a minimal local type here (compatible with your previous structure):
type Currency = 'INR';
type Money = { amount: number; currency: Currency };

enum CashCategoryType {
  WALLET = 'Wallet',
  HOME_SAFE = 'Home Safe', 
  LOOSE_CHANGE_CAR = 'Loose change (car)',
  LOOSE_CHANGE_HOME = 'Loose Change (home)'
}

enum ExpenseCategoryType {
  FOOD = 'Food',
  GROCERY = 'Grocery',
  HOME_EXPENSES = 'Home expenses',
  SHOPPING = 'Shopping',
  JEWELERY = 'Jewelery',
  FUEL = 'Fuel',
  CAR_EXPENDITURE = 'Car expenditure',
  UTILITIES = 'utilities',
  SUBSCRIPTIONS = 'subscriptions',
  PHONE_INTERNET = 'Phone & Internet',
  INVESTMENTS = 'Investments'
}

// CashEntry type (cashTransactions format)
type CashEntry = {
  id: string;
  description: string;
  amount: Money;
  type: 'ADD_CASH' | 'RECORD_EXPENSE' | 'MOVE_CASH';
  cashCategory: string;
  expenseCategory?: string; // Only for RECORD_EXPENSE
  notes?: string;
  timestamp: Date;
  encryptedData?: {
    encryptionKey: string;
    encryptionAlgorithm: string;
    lastEncrypted: Date;
    isEncrypted: boolean;
  };
  auditTrail?: {
    createdBy: string;
    createdAt: Date;
    updatedBy: string;
    updatedAt: Date;
    version: number;
    changes: any[];
  };
  linkedTransactions?: any[];
};


// Add these new types after the existing CashEntry type
type cashCategoryGroup = {
  categoryName: string;
  totalAmount: number;
  transactionCount: number;
  lastUpdated: Date;
  transactions: CashEntry[];
};

type CashTransaction = CashEntry & {
  transactionType: 'ADD_CASH' | 'RECORD_EXPENSE' | 'MOVE_CASH';
  fromCategory?: string; // For MOVE_CASH
  toCategory?: string;   // For MOVE_CASH
};


const CashScreen: React.FC = () => {
  // Hook into global storage
  const { state, loading, save } = useStorage();

  // Local UI state for the "Add Cash" modal inputs
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newCashDescription, setNewCashDescription] = useState('');
  const [newCashAmount, setNewCashAmount] = useState('');
  const [newCashcashCategory, setNewCashcashCategory] = useState<string>(CashCategoryType.WALLET);
  // ADD new state variables (around line 53, after existing states)
  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<string>(ExpenseCategoryType.FOOD);
  const [expenseCashCategory, setExpenseCashCategory] = useState<string>(CashCategoryType.WALLET);
  const [expenseNotes, setExpenseNotes] = useState('');
  // ADD near other expense modal states
  const [isMoveModalVisible, setIsMoveModalVisible] = useState(false);
  const [moveAmount, setMoveAmount] = useState('');
  const [moveFromCategory, setMoveFromCategory] = useState<string>(CashCategoryType.WALLET);
  const [moveToCategory, setMoveToCategory] = useState<string>(CashCategoryType.HOME_SAFE);
  const [moveNotes, setMoveNotes] = useState('');
  // ADD new state variables (after existing modal states)
  const [isDepositModalVisible, setIsDepositModalVisible] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositFromCategory, setDepositFromCategory] = useState<string>(CashCategoryType.WALLET);
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('');
  const [depositNotes, setDepositNotes] = useState('');
  // ADD loading state (after other states):
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [modalTransactions, setModalTransactions] = useState<TransactionRecord[]>([]);
  const [modalFilterCriteria, setModalFilterCriteria] = useState<FilterCriteria | null>(null);
  const [txModalVisible, setTxModalVisible] = useState(false);
  const [txFilter, setTxFilter] = useState<FilterCriteria | null>(null);



  // ADD router hook in component
  const router = useRouter();

  // ADD dropdown helper
  const getcashCategoryOptions = (): string[] => {
    return Object.values(CashCategoryType);
  };

  // ADD helper function for expense categories
  const getExpenseCategoryOptions = (): string[] => {
    return Object.values(ExpenseCategoryType);
  };

    // Read cash entries from the shared store (backed by local JSON file)
  const cashEntries: CashEntry[] = (state?.cashEntries as CashEntry[] | undefined) ?? [];

  const availableBankAccounts = (state?.accounts as any[] | undefined) ?? [];
  const hasBankAccounts = availableBankAccounts.length > 0;

  const formatWithTZ = (d: Date) => {
    try {
      const date = new Date(d);
      const parts = date.toString().split(' ');
      const tzAbbr = parts[parts.length - 2].includes('GMT') ? 'GMT' : parts[parts.length - 1];
      return `${date.toLocaleDateString('en-IN')} ${tzAbbr}`;
    } catch {
      return '';
    }
  };

  // ADD this helper function near the top (after the existing helpers)
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





  // Group entries by cash category
  const cashCategoriesMap = cashEntries.reduce((acc, entry) => {
    const categoryName = entry.cashCategory || 'Uncategorized';
    
    if (!acc[categoryName]) {
      acc[categoryName] = {
        categoryName,
        totalAmount: 0,
        transactionCount: 0,
        lastUpdated: new Date(entry.auditTrail?.updatedAt || new Date()),
        transactions: []
      };
    }
    
    acc[categoryName].totalAmount += entry.amount.amount;
    acc[categoryName].transactionCount += 1;
    acc[categoryName].transactions.push(entry);
    
    // Update last updated date if this transaction is newer
    const entryDate = new Date(entry.auditTrail?.updatedAt || new Date());
    if (entryDate > acc[categoryName].lastUpdated) {
      acc[categoryName].lastUpdated = entryDate;
    }
    
    return acc;
  }, {} as Record<string, cashCategoryGroup>);

  const cashCategoryGroups = Object.values(cashCategoriesMap);

  // Calculate total liquid cash from all categories
  const totalLiquidCash = cashCategoryGroups.reduce(
    (sum, group) => sum + group.totalAmount,
    0
  );

  // Keep your icon mapping for cash Category
  const getcashCategoryIcon = (cashCategory: string) => {
    const l = cashCategory?.toLowerCase() || '';
    if (l.includes('wallet')) return 'account-balance-wallet';
    if (l.includes('home')) return 'home';
    if (l.includes('car')) return 'directions-car';
    if (l.includes('office')) return 'work';
    if (l.includes('safe')) return 'security';
    return 'place';
  };

  const getcashCategoryColor = (cashCategory: string) => {
    const l = cashCategory?.toLowerCase() || '';
    if (l.includes('wallet')) return '#4CAF50';
    if (l.includes('home')) return '#2196F3';
    if (l.includes('car')) return '#FF9800';
    if (l.includes('office')) return '#9C27B0';
    if (l.includes('safe')) return '#795548';
    return '#666666';
  };

  // REPLACE your existing handleAddCash function completely:
  const handleAddCash = async () => {
    if (isProcessing) return; // Prevent double-tap
    
    if (!newCashDescription.trim() || !newCashAmount.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    const amount = parseFloat(newCashAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    try {
      const now = new Date();
      const newEntry: CashEntry = {
        id: Date.now().toString(),
        description: newCashDescription.trim(),
        amount: { amount, currency: 'INR' },
        type: 'ADD_CASH',
        cashCategory: newCashcashCategory.trim() || 'Wallet',
        timestamp: now,
        encryptedData: {
          encryptionKey: '',
          encryptionAlgorithm: 'AES-256',
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
            action: 'ADD_CASH',
            timestamp: now,
            amount: amount,
            category: newCashcashCategory.trim() || 'Wallet'
          }],
        },
        linkedTransactions: [],
      };

      await save(draft => {
        const next = draft.cashEntries ? [...draft.cashEntries] : [];
        next.push(newEntry);
        return { ...draft, cashEntries: next };
      });

      // Reset form and close modal only on success
      setNewCashDescription('');
      setNewCashAmount('');
      setNewCashcashCategory(CashCategoryType.WALLET);
      setIsAddModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add cash entry. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };


  // REPLACE your existing handleRecordExpense function:
  const handleRecordExpense = async () => {
    if (isProcessing) return;
    
    if (!expenseDescription.trim() || !expenseAmount.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const raw = Number(expenseAmount);
    if (!Number.isFinite(raw) || raw <= 0) {
      Alert.alert('Error', 'Please enter a valid positive amount');
      return;
    }

    setIsProcessing(true);
    try {
      const now = new Date();
      const amount = Math.round(raw) * -1; // negative for expense

      const newEntry: CashEntry = {
        id: `${Date.now()}`,
        description: expenseDescription.trim(),
        amount: { amount, currency: 'INR' },
        type: 'RECORD_EXPENSE',
        cashCategory: expenseCashCategory,
        expenseCategory,
        notes: expenseNotes?.trim() || undefined,
        timestamp: now,
        encryptedData: {
          encryptionKey: '',
          encryptionAlgorithm: 'AES-256',
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
            action: 'RECORD_EXPENSE',
            timestamp: now,
            amount,
            cashCategory: expenseCashCategory,
            expenseCategory,
          }],
        },
        linkedTransactions: [],
      };

      await save(draft => {
        const next = draft.cashEntries ? [...draft.cashEntries] : [];
        next.push(newEntry);
        return { ...draft, cashEntries: next };
      });

      // Reset fields and close modal
      setExpenseDescription('');
      setExpenseAmount('');
      setExpenseCategory(ExpenseCategoryType.FOOD);
      setExpenseCashCategory(CashCategoryType.WALLET);
      setExpenseNotes('');
      setIsExpenseModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to record expense. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };


  // ADD below handleRecordExpense()
  // REPLACE your existing handleMoveCash function:
  const handleMoveCash = async () => {
    if (isProcessing) return;
    
    if (!moveAmount.trim()) {
      Alert.alert('Error', 'Please enter amount to move');
      return;
    }
    const raw = Number(moveAmount);
    if (!Number.isFinite(raw) || raw <= 0) {
      Alert.alert('Error', 'Please enter a valid positive amount');
      return;
    }
    if (moveFromCategory === moveToCategory) {
      Alert.alert('Error', 'From and To categories must be different');
      return;
    }

    setIsProcessing(true);
    try {
      const now = new Date();
      const amt = Math.round(raw);

      const debit: CashEntry = {
        id: `${Date.now()}-debit`,
        description: `Move to ${moveToCategory}`,
        amount: { amount: -amt, currency: 'INR' },
        type: 'MOVE_CASH',
        cashCategory: moveFromCategory,
        timestamp: now,
        notes: moveNotes?.trim() || undefined,
        encryptedData: { encryptionKey: '', encryptionAlgorithm: 'AES-256', lastEncrypted: now, isEncrypted: false },
        auditTrail: {
          createdBy: 'user', createdAt: now, updatedBy: 'user', updatedAt: now, version: 1,
          changes: [{ action: 'MOVE_CASH_DEBIT', timestamp: now, amount: -amt, from: moveFromCategory, to: moveToCategory }],
        },
        linkedTransactions: [],
      };

      const credit: CashEntry = {
        id: `${Date.now()}-credit`,
        description: `Move from ${moveFromCategory}`,
        amount: { amount: amt, currency: 'INR' },
        type: 'MOVE_CASH',
        cashCategory: moveToCategory,
        timestamp: now,
        notes: moveNotes?.trim() || undefined,
        encryptedData: { encryptionKey: '', encryptionAlgorithm: 'AES-256', lastEncrypted: now, isEncrypted: false },
        auditTrail: {
          createdBy: 'user', createdAt: now, updatedBy: 'user', updatedAt: now, version: 1,
          changes: [{ action: 'MOVE_CASH_CREDIT', timestamp: now, amount: amt, from: moveFromCategory, to: moveToCategory }],
        },
        linkedTransactions: [],
      };

      await save(draft => {
        const next = draft.cashEntries ? [...draft.cashEntries] : [];
        next.push(debit, credit);
        return { ...draft, cashEntries: next };
      });

      setMoveAmount('');
      setMoveFromCategory(CashCategoryType.WALLET);
      setMoveToCategory(CashCategoryType.HOME_SAFE);
      setMoveNotes('');
      setIsMoveModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to move cash. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };


  // ADD below handleMoveCash()
  const handleDepositToBank = async () => {
    if (!depositAmount.trim()) {
      Alert.alert('Error', 'Please enter deposit amount');
      return;
    }
    if (!hasBankAccounts || !selectedBankAccount) {
      Alert.alert('Error', 'Please select a bank account');
      return;
    }

    const raw = Number(depositAmount);
    if (!Number.isFinite(raw) || raw <= 0) {
      Alert.alert('Error', 'Please enter a valid positive amount');
      return;
    }

    const now = new Date();
    const amount = Math.round(raw) * -1; // negative for deposit (reduces cash)
    
    const selectedAccount = availableBankAccounts.find(acc => acc.id === selectedBankAccount);
    const bankDisplayName = selectedAccount ? 
      `${selectedAccount.bankName} (${selectedAccount.accountType})` : 
      'Selected Bank';

    const depositEntry: CashEntry = {
      id: `${Date.now()}-deposit`,
      description: `Bank deposit to ${bankDisplayName}`,
      amount: { amount, currency: 'INR' },
      type: 'RECORD_EXPENSE',
      cashCategory: depositFromCategory,
      expenseCategory: 'Bank Deposit',
      notes: depositNotes?.trim() || undefined,
      timestamp: now,
      encryptedData: {
        encryptionKey: '',
        encryptionAlgorithm: 'AES-256',
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
          action: 'DEPOSIT_TO_BANK',
          timestamp: now,
          amount,
          cashCategory: depositFromCategory,
          bankAccount: selectedBankAccount,
        }],
      },
      linkedTransactions: [],
    };

    await save(draft => {
      const next = draft.cashEntries ? [...draft.cashEntries] : [];
      next.push(depositEntry);
      return { ...draft, cashEntries: next };
    });

    // Reset form and close modal
    setDepositAmount('');
    setDepositFromCategory(CashCategoryType.WALLET);
    setSelectedBankAccount('');
    setDepositNotes('');
    setIsDepositModalVisible(false);
  };



  const handleDeleteCash = async (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to remove this cash entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await save(draft => {
            const next = (draft.cashEntries ?? []).filter((e: CashEntry) => e.id !== id);
            return { ...draft, cashEntries: next };
          });
        },
      },
    ]);
  };

  // Add this new function after handleDeleteCash:
  const handleDeletecashCategory = async (categoryName: string) => {
    Alert.alert(
      'Confirm Delete Category', 
      `Are you sure you want to delete all cash entries in "${categoryName}"? This will remove ${
        cashCategoriesMap[categoryName]?.transactionCount || 0
      } transactions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await save(draft => {
              const next = (draft.cashEntries ?? []).filter(
                (e: CashEntry) => (e.cashCategory || 'Uncategorized') !== categoryName
              );
              return { ...draft, cashEntries: next };
            });
          },
        },
      ]
    );
  };


  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Cash</Text>
      <TouchableOpacity style={styles.addButton} onPress={() => setIsAddModalVisible(true)}>
        <MaterialIcons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );



  const renderTotalCard = () => (
    <TouchableOpacity activeOpacity={0.9} onPress={() => {
      setTxFilter({
        assetType: 'cash',
        filterType: 'all',
        assetLabel: 'All Liquid Cash',
      });
      setTxModalVisible(true);
    }}>       
        <LinearGradient colors={['#27AE60', '#2ECC71']} style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Liquid Cash</Text>
          <Text style={[
            styles.totalAmount,
            totalLiquidCash < 0 && styles.negativeTotalAmount
          ]}>
            {formatFullINR(totalLiquidCash)}
          </Text>
          <Text style={styles.entriesCount}>
            {cashCategoryGroups.length} Cash {cashCategoryGroups.length === 1 ? 'Category' : 'Categories'}
          </Text>
          <Text style={styles.transactionsCount}>
            {cashEntries.length} Total Transactions
          </Text>
        </LinearGradient>
    </TouchableOpacity>
  );





  const rendercashCategoryGroup = (group: cashCategoryGroup) => {
    // Calculate transaction type counts
    const addCount = group.transactions.filter(t => t.type === 'ADD_CASH').length;
    const expenseCount = group.transactions.filter(t => t.type === 'RECORD_EXPENSE').length;
    const moveCount = group.transactions.filter(t => t.type === 'MOVE_CASH').length;

    const handleOpenTransactions = () => {
      setTxFilter({
        assetType: 'cash',
        filterType: 'category',
        assetLabel: group.categoryName, // display label shown in modal header and CSV filename
      });
      setTxModalVisible(true);
    };

    return (
      <TouchableOpacity
        key={group.categoryName}
        style={styles.cashCard}
        activeOpacity={0.9}
        onPress={handleOpenTransactions}
      >
        <View style={styles.cashHeader}>
          <View style={styles.cashLeft}>
            <View
              style={[
                styles.cashCategoryIcon,
                { backgroundColor: getcashCategoryColor(group.categoryName) },
              ]}
            >
              <MaterialIcons
                name={getcashCategoryIcon(group.categoryName) as any}
                size={24}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.cashDetails}>
              <Text style={styles.cashDescription}>{group.categoryName}</Text>
              <View style={styles.transactionBreakdown}>
                {addCount > 0 && (
                  <Text style={styles.transactionType}>
                    +{addCount} deposits
                  </Text>
                )}
                {expenseCount > 0 && (
                  <Text style={styles.transactionType}>
                    -{expenseCount} expenses
                  </Text>
                )}
                {moveCount > 0 && (
                  <Text style={styles.transactionType}>
                    ↔{moveCount} moves
                  </Text>
                )}
              </View>
              <Text style={styles.cashDate}>
                Last updated: {formatWithTZ(group.lastUpdated)}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={() => handleDeletecashCategory(group.categoryName)}
          >
            <MaterialIcons name="delete" size={20} color="#E74C3C" />
          </TouchableOpacity>
        </View>
        <View style={styles.cashAmount}>
          <Text style={styles.amountLabel}>Category Total</Text>
          <Text
            style={[
              styles.amountValue,
              group.totalAmount < 0 && styles.negativeAmount
            ]}
          >
            {formatFullINR(group.totalAmount)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };


  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionGrid}>
        <TouchableOpacity style={styles.actionButton} onPress={() => setIsAddModalVisible(true)}>
          <MaterialIcons name="add-circle" size={24} color="#27AE60" />
          <Text style={styles.actionText}>Add Cash</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setIsMoveModalVisible(true)}
        >
          <MaterialIcons name="swap-horiz" size={24} color="#27AE60" />
          <Text style={styles.actionText}>Move Cash</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setIsExpenseModalVisible(true)}
        >
          <MaterialIcons name="receipt" size={24} color="#27AE60" />
          <Text style={styles.actionText}>Record Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setIsDepositModalVisible(true)}
        >
          <MaterialIcons name="account-balance" size={24} color="#27AE60" />
          <Text style={styles.actionText}>Deposit to Bank</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAddCashModal = () => (
    <Modal
      visible={isAddModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setIsAddModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContentScrollable}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Cash Entry</Text>
            <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={styles.textInput}
                value={newCashDescription}
                onChangeText={setNewCashDescription}
                placeholder="e.g., Wallet Cash, Home Safe"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount (₹) *</Text>
              <TextInput
                style={styles.textInput}
                value={newCashAmount}
                onChangeText={setNewCashAmount}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Cash Category *</Text>
              <View style={styles.pickerContainer}>
                {getcashCategoryOptions().map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.pickerOption,
                      newCashcashCategory === option && styles.pickerOptionSelected
                    ]}
                    onPress={() => setNewCashcashCategory(option)}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      newCashcashCategory === option && styles.pickerOptionTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsAddModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.addCashButton, isProcessing && styles.disabledButton]} 
              onPress={handleAddCash}
              disabled={isProcessing}
            >
              <Text style={styles.addButtonText}>
                {isProcessing ? 'Adding...' : 'Add Cash'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ADD new modal function (after renderAddCashModal, around line 250)
 const renderRecordExpenseModal = () => (
    <Modal
      visible={isExpenseModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setIsExpenseModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Record Expense</Text>
            <TouchableOpacity onPress={() => setIsExpenseModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={styles.textInput}
                  value={expenseDescription}
                  onChangeText={setExpenseDescription}
                  placeholder="e.g., Lunch, Groceries, Fuel"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Amount (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={expenseAmount}
                  onChangeText={setExpenseAmount}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Expense Category *</Text>
                <View style={styles.pickerContainer}>
                  {getExpenseCategoryOptions().map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.pickerOption,
                        expenseCategory === option && styles.pickerOptionSelected
                      ]}
                      onPress={() => setExpenseCategory(option)}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        expenseCategory === option && styles.pickerOptionTextSelected
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Cash Category *</Text>
                <View style={styles.pickerContainer}>
                  {getcashCategoryOptions().map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.pickerOption,
                        expenseCashCategory === option && styles.pickerOptionSelected
                      ]}
                      onPress={() => setExpenseCashCategory(option)}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        expenseCashCategory === option && styles.pickerOptionTextSelected
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.notesInput]}
                  value={expenseNotes}
                  onChangeText={setExpenseNotes}
                  placeholder="Additional details..."
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsExpenseModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.addCashButton, isProcessing && styles.disabledButton]}
              onPress={handleRecordExpense}
              disabled={isProcessing}
            >
              <Text style={styles.addButtonText}>
                {isProcessing ? 'Recording...' : 'Record Expense'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ADD after renderRecordExpenseModal
  const renderMoveCashModal = () => (
    <Modal
      visible={isMoveModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setIsMoveModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContentScrollable}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Move Cash</Text>
            <TouchableOpacity onPress={() => setIsMoveModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Amount (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={moveAmount}
                  onChangeText={setMoveAmount}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>From Cash Category *</Text>
                <View style={styles.pickerContainer}>
                  {Object.values(CashCategoryType).map((option) => (
                    <TouchableOpacity
                      key={`from-${option}`}
                      style={[
                        styles.pickerOption,
                        moveFromCategory === option && styles.pickerOptionSelected
                      ]}
                      onPress={() => setMoveFromCategory(option)}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        moveFromCategory === option && styles.pickerOptionTextSelected
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>To Cash Category *</Text>
                <View style={styles.pickerContainer}>
                  {Object.values(CashCategoryType).map((option) => (
                    <TouchableOpacity
                      key={`to-${option}`}
                      style={[
                        styles.pickerOption,
                        moveToCategory === option && styles.pickerOptionSelected
                      ]}
                      onPress={() => setMoveToCategory(option)}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        moveToCategory === option && styles.pickerOptionTextSelected
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.notesInput]}
                  value={moveNotes}
                  onChangeText={setMoveNotes}
                  placeholder="Reason for move…"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsMoveModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.addCashButton, isProcessing && styles.disabledButton]}
              onPress={handleMoveCash}
              disabled={isProcessing}
            >
              <Text style={styles.addButtonText}>
                {isProcessing ? 'Moving...' : 'Move'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ADD after renderMoveCashModal
  const renderDepositToBankModal = () => (
    <Modal
      visible={isDepositModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setIsDepositModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContentScrollable}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Deposit to Bank</Text>
            <TouchableOpacity onPress={() => setIsDepositModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Amount (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={depositAmount}
                  onChangeText={setDepositAmount}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>From Cash Category *</Text>
                <View style={styles.pickerContainer}>
                  {Object.values(CashCategoryType).map((option) => (
                    <TouchableOpacity
                      key={`deposit-from-${option}`}
                      style={[
                        styles.pickerOption,
                        depositFromCategory === option && styles.pickerOptionSelected
                      ]}
                      onPress={() => setDepositFromCategory(option)}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        depositFromCategory === option && styles.pickerOptionTextSelected
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {hasBankAccounts ? (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>To Bank Account *</Text>
                  <View style={styles.pickerContainer}>
                    {availableBankAccounts.map((account, index) => (
                      <TouchableOpacity
                        key={`bank-${index}`}
                        style={[
                          styles.pickerOption,
                          selectedBankAccount === account.id && styles.pickerOptionSelected
                        ]}
                        onPress={() => setSelectedBankAccount(account.id)}
                      >
                        <Text style={[
                          styles.pickerOptionText,
                          selectedBankAccount === account.id && styles.pickerOptionTextSelected
                        ]}>
                          {account.bankName} - {account.accountType}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Bank Account Required</Text>
                  <TouchableOpacity 
                    style={styles.addBankButton}
                    onPress={() => {
                      setIsDepositModalVisible(false);
                      router.push('/accounts');
                    }}
                  >
                    <MaterialIcons name="add-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.addBankButtonText}>Add Bank Account</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.notesInput]}
                  value={depositNotes}
                  onChangeText={setDepositNotes}
                  placeholder="Reference number, purpose..."
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsDepositModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.addCashButton,
                (isProcessing || !hasBankAccounts || !selectedBankAccount) && styles.disabledButton
              ]}
              onPress={handleDepositToBank}
              disabled={isProcessing || !hasBankAccounts || !selectedBankAccount}
            >
              <Text style={styles.addButtonText}>
                {isProcessing ? 'Depositing...' : 'Deposit'}
              </Text>
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
          <Text>Loading local data…</Text>
        </View>
      </ScreenLayout>
    );
  }

 return (
  <ScreenLayout>
    <StatusBar style="dark" backgroundColor={Colors.background.primary} />
    <View style={styles.logoContainer}>
      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
    {renderHeader()}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderTotalCard()}
        {renderQuickActions()}
        <View style={styles.cashContainer}>
          <Text style={styles.sectionTitle}>Your Cash Categories</Text>
          {cashCategoryGroups.length > 0 ? (
            cashCategoryGroups.map(rendercashCategoryGroup)
          ) : (
            <View style={styles.emptyCash}>
              <MaterialIcons name="account-balance-wallet" size={64} color="#E0E0E0" />
              <Text style={styles.emptyText}>No cash categories yet</Text>
              <Text style={styles.emptySubtext}>Add your first cash entry to get started</Text>
            </View>
          )}
        </View>
      </ScrollView>
      {renderAddCashModal()}
      {renderRecordExpenseModal()}
      {renderMoveCashModal()}
      {renderDepositToBankModal()}
      {/* NEW: Reusable Transactions modal (opens on total card or category taps) */}
      {txFilter && (
        <TransactionsModal
          visible={txModalVisible}
          onClose={() => setTxModalVisible(false)}
          params={{ filterCriteria: txFilter }}
        />
      )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  addButton: {
    backgroundColor: Colors.accent,
    borderRadius: 20,
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
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
  totalLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  entriesCount: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
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
  actionText: {
    fontSize: 12,
    color: Colors.text.primary,
    marginTop: 8,
    textAlign: 'center',
  },
  cashContainer: {
    paddingHorizontal: 16,
    marginBottom: 100,
  },
  cashCard: {
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
  cashHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cashLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  cashCategoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cashDetails: {
    flex: 1,
  },
  cashDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  cashcashCategory: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  cashDate: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  deleteButton: {
    padding: 4,
  },
  cashAmount: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#27AE60',
  },
  emptyCash: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.background.modal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.main,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
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
    color: Colors.text.primary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border.main,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border.main,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  addCashButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
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
  transactionsCount: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.7,
    marginTop: 2,
  },
  transactionSummary: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 4,
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
    borderColor: Colors.border.main,
    backgroundColor: Colors.background.secondary,
  },
  pickerOptionSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  pickerOptionText: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  pickerOptionTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalContentScrollable: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%', // Allow more height
    overflow: 'hidden',
  },
  modalScrollView: {
    flexGrow: 1,
  },
  modalScrollContent: {
    paddingBottom: 12,
  },
  negativeAmount: {
    color: '#E74C3C', // Red color for negative amounts
  },
  negativeTotalAmount: {
    color: '#FF6B6B', // Lighter red for header negative amounts
  },
  // ADD these styles to StyleSheet
  addBankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  addBankButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: Colors.border.main,
    opacity: 0.6,
  },
  transactionBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
    gap: 8,
  },
  transactionType: {
    fontSize: 11,
    color: Colors.text.tertiary,
    backgroundColor: Colors.background.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },

});

export { CashScreen as default };

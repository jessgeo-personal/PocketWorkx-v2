// src/app/credit-cards.tsx
import React, { useState, useEffect } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenLayout from '../components/ScreenLayout';
import { Colors } from '../utils/theme';
import { formatCompactCurrency } from '../utils/currency';
import type { TransactionRecord, FilterCriteria } from '../types/transactions';
import TransactionsModal from '../components/modals/TransactionsModal';
import AppFooter from '../components/AppFooter';
import WheelPicker from '@quidone/react-native-wheel-picker';

// Use shared storage
// Use shared storage
import { useStorage, type AppModel, type CreditCardEntry as SPCreditCardEntry, type CreditCardTransaction as SPCreditCardTransaction } from '../services/storage/StorageProvider';

// Credit Card data types (matching finance.ts CreditCard interface)
type Currency = 'INR';
type Money = { amount: number; currency: Currency };

type CreditCardEntry = SPCreditCardEntry;
type CreditCardTransaction = SPCreditCardTransaction;

// ADD this missing UI grouping type:
type CreditCardGroup = {
  cardName: string;
  bank: string;
  cardType: string;
  totalBalance: number;
  availableCredit: number;
  minimumPayment: number;
  dueDate: Date;
  transactionCount: number;
  lastUpdated: Date;
  transactions: CreditCardTransaction[];
  card: CreditCardEntry;
};

// Credit Card Categories
const CreditCardCategoryType = {
  FOOD: 'Food & Dining',
  GROCERY: 'Groceries',
  FUEL: 'Fuel & Gas',
  SHOPPING: 'Shopping',
  TRAVEL: 'Travel & Transport',
  ENTERTAINMENT: 'Entertainment',
  BILLS: 'Bills & Utilities',
  HEALTH: 'Health & Medical',
  ONLINE: 'Online Services',
  OTHER: 'Other Expenses',
};

const getCreditCardCategoryOptions = (): string[] => {
  return Object.values(CreditCardCategoryType);
};

const CreditCardsScreen: React.FC = () => {
  // Hook into global storage
  const { state, loading, save } = useStorage();

  // Local UI state for modals
  const [isAddCardModalVisible, setIsAddCardModalVisible] = useState(false);
  const [isChargeModalVisible, setIsChargeModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  
  // Add Card Modal states
  const [newCardBank, setNewCardBank] = useState('');
  const [newCardName, setNewCardName] = useState('');
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardType, setNewCardType] = useState<'visa' | 'mastercard' | 'amex' | 'rupay' | 'diners'>('visa');
  const [newCreditLimit, setNewCreditLimit] = useState('');
  const [newCurrentBalance, setNewCurrentBalance] = useState('');
  const [newInterestRate, setNewInterestRate] = useState('');
  
  // Charge Modal states
  const [chargeDescription, setChargeDescription] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeCategory, setChargeCategory] = useState<string>(CreditCardCategoryType.FOOD);
  const [selectedCardForCharge, setSelectedCardForCharge] = useState<string>('');
  const [chargeMerchant, setChargeMerchant] = useState('');
  const [chargeNotes, setChargeNotes] = useState('');
  
    // Split date into separate day/month/year
  const [paymentDay, setPaymentDay] = useState<number>(new Date().getDate());
  const [paymentMonth, setPaymentMonth] = useState<number>(new Date().getMonth() + 1);
  const [paymentYear, setPaymentYear] = useState<number>(new Date().getFullYear());
  
  // Enhanced Payment Modal states  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedCardForPayment, setSelectedCardForPayment] = useState<string>('');
  const [selectedAccountForPayment, setSelectedAccountForPayment] = useState<string>('');


    // Initialize selections when data loads
  useEffect(() => {
    const cards = (state?.creditCardEntries ?? []) as CreditCardEntry[];
    const accounts = (state?.accounts ?? []) as Array<{ id: string }>;
    
    // Auto-select first card if none selected and cards exist
    if (!selectedCardForPayment && cards.length > 0) {
      setSelectedCardForPayment(cards[0].id);
    }
    
    // Auto-select first account if none selected and accounts exist  
    if (!selectedAccountForPayment && accounts.length > 0) {
      setSelectedAccountForPayment(accounts[0].id);
    }
  }, [state?.creditCardEntries, state?.accounts, selectedCardForPayment, selectedAccountForPayment]);

  // NEW USEEFFECT GOES HERE - Ensure selected account value always matches available picker values
  useEffect(() => {
    const accts = (state?.accounts ?? []) as Array<{ id: string }>;
    if (!accts || accts.length === 0) return;

    const current = String(selectedAccountForPayment || '');
    const options = accts.map(a => String(a.id));

    // If current selection is not in the list (or empty), snap to the last (fully visible) option
    if (!options.includes(current)) {
      setSelectedAccountForPayment(options[options.length - 1]);
    }
  }, [state?.accounts, selectedAccountForPayment]);

  
  // Split date into separate day/month/year
  const [paymentDay, setPaymentDay] = useState<number>(new Date().getDate());
  const [paymentMonth, setPaymentMonth] = useState<number>(new Date().getMonth() + 1);
  const [paymentYear, setPaymentYear] = useState<number>(new Date().getFullYear());
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState('');

  
  const [isProcessing, setIsProcessing] = useState(false);
  const [txModalVisible, setTxModalVisible] = useState(false);
  const [txFilter, setTxFilter] = useState<FilterCriteria | null>(null);

  // Get navigation parameters for auto-opening modals
  const searchParams = useLocalSearchParams<{ openModal?: string }>();
  const router = useRouter();

  // Auto-open modals when navigated from home quick actions
  useEffect(() => {
    if (searchParams?.openModal === 'charge') {
      setIsChargeModalVisible(true);
    } else if (searchParams?.openModal === 'payment') {
      setIsPaymentModalVisible(true);
    }
  }, [searchParams?.openModal]);

  // Read credit card entries and transactions from shared store
  const creditCardEntries: CreditCardEntry[] = (state?.creditCardEntries as CreditCardEntry[] | undefined) ?? [];
  const creditCardTransactions: CreditCardTransaction[] = (state?.creditCardTransactions as CreditCardTransaction[] | undefined) ?? [];

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

  // Group credit cards with their transactions
  const creditCardGroupsMap = creditCardEntries.reduce((acc, card) => {
    const cardTransactions = creditCardTransactions.filter(tx => tx.cardId === card.id);
    
    acc[card.id] = {
      cardName: card.cardName,
      bank: card.bank,
      cardType: card.cardType,
      totalBalance: card.currentBalance.amount,
      availableCredit: card.availableCredit.amount,
      minimumPayment: card.minimumPayment.amount,
      dueDate: card.paymentDueDate,
      transactionCount: cardTransactions.length,
      lastUpdated: new Date(card.auditTrail?.updatedAt || card.timestamp),
      transactions: cardTransactions,
      card: card,
    };
    
    return acc;
  }, {} as Record<string, CreditCardGroup>);

  const creditCardGroups = Object.values(creditCardGroupsMap);

  // Calculate total outstanding balance across all cards
  const totalOutstandingBalance = creditCardGroups.reduce(
    (sum, group) => sum + group.totalBalance,
    0
  );

  // Icon mapping for card types
  const getCardTypeIcon = (cardType: string) => {
    switch (cardType.toLowerCase()) {
      case 'visa': return 'credit-card';
      case 'mastercard': return 'credit-card';
      case 'amex': return 'credit-card';
      case 'rupay': return 'credit-card';
      case 'diners': return 'credit-card';
      default: return 'credit-card';
    }
  };

  const getCardTypeColor = (cardType: string) => {
    switch (cardType.toLowerCase()) {
      case 'visa': return '#1A1F71';
      case 'mastercard': return '#EB001B';
      case 'amex': return '#006FCF';
      case 'rupay': return '#00A3E0';
      case 'diners': return '#0072CE';
      default: return '#8B5CF6';
    }
  };

  // CRUD Operations
  const handleAddCard = async () => {
    if (isProcessing) return;
    
    if (!newCardBank.trim() || !newCardName.trim() || !newCardNumber.trim() || !newCreditLimit.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    const creditLimit = parseFloat(newCreditLimit);
    const currentBalance = parseFloat(newCurrentBalance) || 0;
    const interestRate = parseFloat(newInterestRate) || 18.0;
    
    if (isNaN(creditLimit) || creditLimit <= 0) {
      Alert.alert('Error', 'Please enter a valid credit limit');
      return;
    }

    setIsProcessing(true);
    try {
      const now = new Date();
      const newCard: CreditCardEntry = {
        id: Date.now().toString(),
        bank: newCardBank.trim(),
        cardName: newCardName.trim(),
        cardNumber: `****${newCardNumber.slice(-4)}`, // mask card number
        cardType: newCardType,
        creditLimit: { amount: creditLimit, currency: 'INR' },
        currentBalance: { amount: currentBalance, currency: 'INR' },
        availableCredit: { amount: creditLimit - currentBalance, currency: 'INR' },
        minimumPayment: { amount: Math.max(currentBalance * 0.05, 100), currency: 'INR' },
        paymentDueDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        statementDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        interestRate: interestRate,
        isActive: true,
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
            action: 'ADD_CARD',
            timestamp: now,
            cardName: newCardName.trim(),
            bank: newCardBank.trim(),
            creditLimit: creditLimit
          }],
        },
        linkedTransactions: [],
      };

      await save((draft: AppModel) => {
        const next: CreditCardEntry[] = draft.creditCardEntries ? [...draft.creditCardEntries] as CreditCardEntry[] : [];
        next.push(newCard as CreditCardEntry);
        return { ...draft, creditCardEntries: next };
      });


      // Reset form and close modal
      setNewCardBank('');
      setNewCardName('');
      setNewCardNumber('');
      setNewCardType('visa');
      setNewCreditLimit('');
      setNewCurrentBalance('');
      setNewInterestRate('');
      setIsAddCardModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add credit card. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordCharge = async () => {
    if (isProcessing) return;
    
    if (!chargeDescription.trim() || !chargeAmount.trim() || !selectedCardForCharge) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const raw = Number(chargeAmount);
    if (!Number.isFinite(raw) || raw <= 0) {
      Alert.alert('Error', 'Please enter a valid positive amount');
      return;
    }

    setIsProcessing(true);
    try {
      const now = new Date();
      const amount = Math.round(raw);

      // Create charge transaction
      const newCharge: CreditCardTransaction = {
        id: `${Date.now()}-charge`,
        description: chargeDescription.trim(),
        amount: { amount, currency: 'INR' }, // positive for charges
        type: 'CHARGE',
        category: chargeCategory,
        cardId: selectedCardForCharge,
        merchantName: chargeMerchant?.trim() || undefined,
        notes: chargeNotes?.trim() || undefined,
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
            action: 'RECORD_CHARGE',
            timestamp: now,
            amount,
            cardId: selectedCardForCharge,
            category: chargeCategory,
          }],
        },
        linkedTransactions: [],
      };

      await save((draft: AppModel) => {
        const nextTransactions: CreditCardTransaction[] = draft.creditCardTransactions ? [...draft.creditCardTransactions] as CreditCardTransaction[] : [];
        nextTransactions.push(newCharge as CreditCardTransaction);

        const nextCards: CreditCardEntry[] = (draft.creditCardEntries ?? []).map((card) => {
          if (card.id === selectedCardForCharge) {
            const newBalance = card.currentBalance.amount + amount;
            return {
              ...card,
              currentBalance: { ...card.currentBalance, amount: newBalance },
              availableCredit: { ...card.availableCredit, amount: card.creditLimit.amount - newBalance },
              minimumPayment: { ...card.minimumPayment, amount: Math.max(newBalance * 0.05, card.minimumPayment.amount) }
            } as CreditCardEntry;
          }
          return card as CreditCardEntry;
        });

        return { 
          ...draft, 
          creditCardTransactions: nextTransactions,
          creditCardEntries: nextCards 
        };
      });


      // Reset form and close modal
      setChargeDescription('');
      setChargeAmount('');
      setChargeCategory(CreditCardCategoryType.FOOD);
      setSelectedCardForCharge('');
      setChargeMerchant('');
      setChargeNotes('');
      setIsChargeModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to record charge. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordPayment = async () => {
    if (isProcessing) return;
    
    const cards = (state?.creditCardEntries ?? []) as CreditCardEntry[];
    const accounts = (state?.accounts ?? []) as Array<{
      id: string;
      nickname: string;
      balance: { amount: number; currency: string };
    }>;
    
    console.log('Payment validation:');
    console.log('- Amount:', paymentAmount);
    console.log('- Selected card:', selectedCardForPayment);
    console.log('- Selected account:', selectedAccountForPayment);
    console.log('- Available cards:', cards.length);
    console.log('- Available accounts:', accounts.length);
    
    // Enhanced validation for all 3 mandatory fields
    if (!paymentAmount.trim()) {
      Alert.alert('Error', 'Please enter a payment amount');
      return;
    }
    if (!selectedCardForPayment || !cards.find(c => c.id === selectedCardForPayment)) {
      Alert.alert('Error', 'Please select a valid credit card');
      return;
    }
    if (!selectedAccountForPayment || !accounts.find(a => a.id === selectedAccountForPayment)) {
      Alert.alert('Error', 'Please select a valid source account');
      return;
    }


    const raw = Number(paymentAmount);
    if (!Number.isFinite(raw) || raw <= 0) {
      Alert.alert('Error', 'Please enter a valid positive amount');
      return;
    }

    // Check if selected account has sufficient balance
    const selectedAccount = accounts.find(acc => acc.id === selectedAccountForPayment);
    if (!selectedAccount) {
      Alert.alert('Error', 'Selected account not found');
      return;
    }

    if (selectedAccount.balance.amount < raw) {
      Alert.alert(
        'Insufficient Balance',
        `Account balance: ${formatFullINR(selectedAccount.balance.amount)}\nPayment amount: ${formatFullINR(raw)}\n\nThis will result in negative balance. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => processPayment(raw, selectedAccount) }
        ]
      );
      return;
    }

    processPayment(raw, selectedAccount);
  };

  // Separate function to handle the actual payment processing
  const processPayment = async (amount: number, sourceAccount: any) => {
    setIsProcessing(true);
    try {
      const transactionDate = useCustomDate ? 
        new Date(paymentYear, paymentMonth - 1, paymentDay) : 
        new Date();
      const roundedAmount = Math.round(amount);

      // 1. Create Credit Card Payment Transaction (reduces credit card balance)
      const creditCardPayment: CreditCardTransaction = {
        id: `${Date.now()}-payment`,
        description: `Payment from ${sourceAccount.nickname}`,
        amount: { amount: -roundedAmount, currency: 'INR' },
        type: 'PAYMENT',
        category: 'Payment',
        cardId: selectedCardForPayment,
        notes: paymentNotes?.trim() || `Paid from ${sourceAccount.nickname}`,
        timestamp: transactionDate,
        encryptedData: {
          encryptionKey: '',
          encryptionAlgorithm: 'AES-256',
          lastEncrypted: transactionDate,
          isEncrypted: false,
        },
        auditTrail: {
          createdBy: 'user',
          createdAt: transactionDate,
          updatedBy: 'user',
          updatedAt: transactionDate,
          version: 1,
          changes: [{
            action: 'RECORD_PAYMENT',
            timestamp: transactionDate,
            amount: -roundedAmount,
            cardId: selectedCardForPayment,
            sourceAccountId: selectedAccountForPayment,
          }],
        },
        linkedTransactions: [],
      };

      // 2. Create Bank Account Withdrawal Transaction (reduces bank account balance)
      const accountWithdrawal = {
        id: `${Date.now()}-withdrawal`,
        datetime: transactionDate,
        amount: { amount: -roundedAmount, currency: 'INR' },
        description: `Credit Card Payment`,
        type: 'withdrawal',
        notes: paymentNotes?.trim() || `Payment to credit card`,
        source: 'manual',
        status: 'completed',
      };

      // 3. Update storage with dual transactions
      await save((draft: AppModel) => {
        // Add credit card payment transaction
        const nextCCTransactions: CreditCardTransaction[] = draft.creditCardTransactions ? 
          [...draft.creditCardTransactions] as CreditCardTransaction[] : [];
        nextCCTransactions.push(creditCardPayment as CreditCardTransaction);

        // Update credit card balance
        const nextCards: CreditCardEntry[] = (draft.creditCardEntries ?? []).map((card) => {
          if (card.id === selectedCardForPayment) {
            const newBalance = Math.max(0, card.currentBalance.amount - roundedAmount);
            return {
              ...card,
              currentBalance: { ...card.currentBalance, amount: newBalance },
              availableCredit: { ...card.availableCredit, amount: card.creditLimit.amount - newBalance },
              minimumPayment: { ...card.minimumPayment, amount: Math.max(newBalance * 0.05, 100) }
            } as CreditCardEntry;
          }
          return card as CreditCardEntry;
        });

        // Update bank account with withdrawal transaction and reduce balance
        const nextAccounts = (draft.accounts ?? []).map((account: any) => {
          if (account.id === selectedAccountForPayment) {
            const existingTransactions = account.transactions ?? [];
            return {
              ...account,
              transactions: [...existingTransactions, accountWithdrawal],
              balance: {
                ...account.balance,
                amount: account.balance.amount - roundedAmount
              },
              lastSynced: transactionDate,
            };
          }
          return account;
        });

        return { 
          ...draft, 
          creditCardTransactions: nextCCTransactions,
          creditCardEntries: nextCards,
          accounts: nextAccounts
        };
      });

      Alert.alert(
        'Payment Saved', 
        `Payment of ${formatFullINR(roundedAmount)} processed successfully.\n\nFrom: ${sourceAccount.nickname}\nTo: Credit Card`,
        [{ text: 'OK', onPress: resetPaymentForm }]
      );

    } catch (error) {
      Alert.alert('Error', 'Failed to record payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset form helper
  const resetPaymentForm = () => {
    setPaymentAmount('');
    
    // Initialize with first available items or empty
    const cards = (state?.creditCardEntries ?? []) as CreditCardEntry[];
    const accounts = (state?.accounts ?? []) as Array<{ id: string }>;
    
    setSelectedCardForPayment(cards.length > 0 ? cards[0].id : '');
    setSelectedAccountForPayment(accounts.length > 0 ? accounts[0].id : '');
    
    const today = new Date();
    setPaymentDay(today.getDate());
    setPaymentMonth(today.getMonth() + 1);
    setPaymentYear(today.getFullYear());
    setUseCustomDate(false);
    setPaymentNotes('');
    setIsPaymentModalVisible(false);
  };

  const handleDeleteCard = async (cardId: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to remove this credit card?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await save((draft: AppModel) => {
            const nextCards: CreditCardEntry[] = (draft.creditCardEntries ?? []).filter((c) => c.id !== cardId) as CreditCardEntry[];
            const nextTransactions: CreditCardTransaction[] = (draft.creditCardTransactions ?? []).filter((tx) => tx.cardId !== cardId) as CreditCardTransaction[];
            return { 
              ...draft, 
              creditCardEntries: nextCards,
              creditCardTransactions: nextTransactions
            };
          });
        },
      },
    ]);
  };

  // Render functions
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Credit Cards</Text>
      <TouchableOpacity style={styles.addButton} onPress={() => setIsAddCardModalVisible(true)}>
        <MaterialIcons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const renderTotalCard = () => {
    const handleOpenAllTransactions = () => {
      setTxFilter({
        assetType: 'creditcard',
        filterType: 'all',
        assetLabel: 'All Credit Cards',
      });
      setTxModalVisible(true);
    };

    return (
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={handleOpenAllTransactions}
      >
        <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.totalCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.totalLabel}>Total Outstanding Balance</Text>
            <MaterialIcons name="chevron-right" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.totalAmount}>
            {formatFullINR(totalOutstandingBalance)}
          </Text>
          <Text style={styles.entriesCount}>
            {creditCardGroups.length} Credit {creditCardGroups.length === 1 ? 'Card' : 'Cards'}
          </Text>
          <Text style={styles.transactionsCount}>
            {creditCardTransactions.length} Total Transactions
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderCreditCardGroup = (group: CreditCardGroup) => {
    const daysUntilDue = Math.ceil((group.dueDate.getTime() - Date.now()) / (1000 * 86400));
    const isOverdue = daysUntilDue < 0;
    const chargeCount = group.transactions.filter(t => t.type === 'CHARGE').length;
    const paymentCount = group.transactions.filter(t => t.type === 'PAYMENT').length;

    const handleOpenTransactions = () => {
      setTxFilter({
        assetType: 'creditcard',
        filterType: 'category',
        assetLabel: group.cardName,
        assetId: group.card.id,
      });
      setTxModalVisible(true);
    };

    return (
      <TouchableOpacity
        key={group.card.id}
        style={styles.cardGroup}
        activeOpacity={0.9}
        onPress={handleOpenTransactions}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <View
              style={[
                styles.cardTypeIcon,
                { backgroundColor: getCardTypeColor(group.cardType) },
              ]}
            >
              <MaterialIcons
                name={getCardTypeIcon(group.cardType) as any}
                size={24}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.cardDetails}>
              <Text style={styles.cardName}>{group.cardName}</Text>
              <Text style={styles.bankText}>{group.bank} • {group.card.cardNumber}</Text>
              <View style={styles.transactionBreakdown}>
                {chargeCount > 0 && (
                  <Text style={styles.transactionType}>
                    {chargeCount} charges
                  </Text>
                )}
                {paymentCount > 0 && (
                  <Text style={styles.transactionType}>
                    {paymentCount} payments
                  </Text>
                )}
              </View>
              <Text style={styles.cardDate}>
                Last updated: {formatWithTZ(group.lastUpdated)}
              </Text>
            </View>
          </View>
          <View style={styles.rightIconsRow}>
            <MaterialIcons name="chevron-right" size={22} color={Colors.text.secondary} />
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={() => handleDeleteCard(group.card.id)}
            >
              <MaterialIcons name="delete" size={20} color="#E74C3C" />
            </TouchableOpacity>
          </View>
        </View>

        
        <View style={styles.balanceSection}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Outstanding Balance</Text>
            <Text style={styles.balanceAmount}>
              {formatFullINR(group.totalBalance)}
            </Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Available Credit</Text>
            <Text style={styles.availableAmount}>
              {formatFullINR(group.availableCredit)}
            </Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={[styles.dueLabel, isOverdue && styles.overdueText]}>
              {isOverdue ? `Overdue by ${Math.abs(daysUntilDue)} days` : `Due in ${daysUntilDue} days`}
            </Text>
            <Text style={[styles.minimumAmount, isOverdue && styles.overdueText]}>
              Min: {formatFullINR(group.minimumPayment)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionGrid}>
        <TouchableOpacity style={styles.actionButton} onPress={() => setIsAddCardModalVisible(true)}>
          <MaterialIcons name="add-circle" size={24} color="#8B5CF6" />
          <Text style={styles.actionText}>Add Card</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setIsChargeModalVisible(true)}
        >
          <MaterialIcons name="receipt" size={24} color="#8B5CF6" />
          <Text style={styles.actionText}>Record Charge</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setIsPaymentModalVisible(true)}
        >
          <MaterialIcons name="payment" size={24} color="#8B5CF6" />
          <Text style={styles.actionText}>Make Payment</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/cashflow')}
        >
          <MaterialIcons name="trending-up" size={24} color="#8B5CF6" />
          <Text style={styles.actionText}>View Trends</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Add Card Modal
  const renderAddCardModal = () => (
    <Modal
      visible={isAddCardModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setIsAddCardModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Credit Card</Text>
            <TouchableOpacity onPress={() => setIsAddCardModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Bank Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newCardBank}
                  onChangeText={setNewCardBank}
                  placeholder="e.g., HDFC, ICICI, SBI"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Card Name (Nickname) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newCardName}
                  onChangeText={setNewCardName}
                  placeholder="e.g., HDFC Millennia"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Last 4 Digits *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newCardNumber}
                  onChangeText={setNewCardNumber}
                  placeholder="1234"
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Card Network *</Text>
                <View style={styles.pickerRow}>
                  {(['visa','mastercard','amex','rupay','diners'] as const).map(net => (
                    <TouchableOpacity
                      key={net}
                      style={[styles.pickerPill, newCardType === net && styles.pickerPillSelected]}
                      onPress={() => setNewCardType(net)}
                    >
                      <Text style={[styles.pickerPillText, newCardType === net && styles.pickerPillTextSelected]}>
                        {net.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Credit Limit (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newCreditLimit}
                  onChangeText={setNewCreditLimit}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Current Balance (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  value={newCurrentBalance}
                  onChangeText={setNewCurrentBalance}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.optionalFieldsDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Optional</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Interest Rate (%)</Text>
                <TextInput
                  style={styles.textInput}
                  value={newInterestRate}
                  onChangeText={setNewInterestRate}
                  placeholder="e.g., 18"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAddCardModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, isProcessing && styles.disabledButton]}
              onPress={handleAddCard}
              disabled={isProcessing}
            >
              <Text style={styles.primaryButtonText}>{isProcessing ? 'Adding...' : 'Add Card'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Record Charge Modal
  const renderChargeModal = () => {
    const cards = (state?.creditCardEntries ?? []) as CreditCardEntry[];
    return (
      <Modal
        visible={isChargeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsChargeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Charge</Text>
              <TouchableOpacity onPress={() => setIsChargeModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.modalBody}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Amount (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={chargeAmount}
                    onChangeText={setChargeAmount}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Description *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={chargeDescription}
                    onChangeText={setChargeDescription}
                    placeholder="e.g., Grocery, Fuel, Amazon"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Category</Text>
                  <View style={styles.pickerRow}>
                    {getCreditCardCategoryOptions().map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.pickerPill, chargeCategory === cat && styles.pickerPillSelected]}
                        onPress={() => setChargeCategory(cat)}
                      >
                        <Text style={[styles.pickerPillText, chargeCategory === cat && styles.pickerPillTextSelected]}>
                          {cat.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Card *</Text>
                  <View style={styles.pickerRow}>
                    {cards.slice(0,5).map(c => (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.pickerPill, selectedCardForCharge === c.id && styles.pickerPillSelected]}
                        onPress={() => setSelectedCardForCharge(c.id)}
                      >
                        <Text style={[styles.pickerPillText, selectedCardForCharge === c.id && styles.pickerPillTextSelected]}>
                          {c.cardName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Merchant (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={chargeMerchant}
                    onChangeText={setChargeMerchant}
                    placeholder="e.g., Amazon, Zomato"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Notes (Optional)</Text>
                  <TextInput
                    style={[styles.textInput, { minHeight: 60 }]}
                    value={chargeNotes}
                    onChangeText={setChargeNotes}
                    placeholder="Any additional context"
                    multiline
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsChargeModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, isProcessing && styles.disabledButton]}
                onPress={handleRecordCharge}
                disabled={isProcessing}
              >
                <Text style={styles.primaryButtonText}>{isProcessing ? 'Saving...' : 'Save Charge'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Fixed wheel picker callbacks - handle both event formats
  const handleCardChange = (event: any) => {
    console.log('Card picker event:', event);
    let newValue: string;
    
    if (event && typeof event === 'string') {
      newValue = event;
    } else if (event && event.item && event.item.value) {
      newValue = event.item.value;
    } else if (event && event.value) {
      newValue = event.value;
    } else {
      console.warn('Unexpected card picker event format:', event);
      return;
    }
    
    console.log('Setting selected card to:', newValue);
    setSelectedCardForPayment(newValue);
  };

  const handleAccountChange = (event: any) => {
    console.log('Account picker event:', event);
    let newValue: string;
    
    if (event && typeof event === 'string') {
      newValue = event;
    } else if (event && event.item && event.item.value !== undefined) {
      newValue = event.item.value;
    } else if (event && event.value !== undefined) {
      newValue = event.value;
    } else {
      console.warn('Unexpected account picker event format:', event);
      return;
    }
    
    console.log('Setting selected account to:', newValue);
    setSelectedAccountForPayment(newValue);
  };


  const handleDayChange = (event: any) => {
    if (event && event.item && event.item.value) {
      setPaymentDay(event.item.value);
    }
  };

  const handleMonthChange = (event: any) => {
    if (event && event.item && event.item.value) {
      setPaymentMonth(event.item.value);
    }
  };

  const handleYearChange = (event: any) => {
    if (event && event.item && event.item.value) {
      setPaymentYear(event.item.value);
    }
  };


 // Enhanced Make Payment Modal with Crash-Safe Wheel Pickers

  const renderPaymentModal = () => {
    const cards = (state?.creditCardEntries ?? []) as CreditCardEntry[];
    const accounts = (state?.accounts ?? []) as Array<{
      id: string;
      nickname: string;
      bankName: string;
      balance: { amount: number; currency: string };
    }>;
    
    // Safety check - don't render picker if no data
    if (cards.length === 0 && accounts.length === 0) {
      return (
        <Modal
          visible={isPaymentModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsPaymentModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Make Payment</Text>
                <TouchableOpacity onPress={() => setIsPaymentModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.emptyText}>Please add credit cards and bank accounts first.</Text>
              </View>
            </View>
          </View>
        </Modal>
      );
    }
    
    // Generate picker data with proper defaults
    const cardPickerData = cards.length > 0 ? cards.map(card => ({
      value: String(card.id),
      label: `${card.cardName} ${card.cardNumber}\n${formatFullINR(card.currentBalance.amount)} due`,
    })) : [{ value: '', label: 'No cards available' }];

    const accountPickerData = accounts.length > 0 ? accounts.map(acc => ({
      value: String(acc.id), // ensure string identity
      label: `${acc.nickname}\n${formatFullINR(acc.balance.amount)} available`,
    })) : [{ value: '', label: 'No accounts available' }];
    
    const monthData = [
      {value: 1, label: 'Jan'}, {value: 2, label: 'Feb'}, {value: 3, label: 'Mar'},
      {value: 4, label: 'Apr'}, {value: 5, label: 'May'}, {value: 6, label: 'Jun'},
      {value: 7, label: 'Jul'}, {value: 8, label: 'Aug'}, {value: 9, label: 'Sep'},
      {value: 10, label: 'Oct'}, {value: 11, label: 'Nov'}, {value: 12, label: 'Dec'}
    ];
    
    const currentYear = new Date().getFullYear();
    const yearData = Array.from({length: 5}, (_, i) => ({
      value: currentYear - 2 + i,
      label: (currentYear - 2 + i).toString()
    }));

    // Auto-initialize if empty and data is available
    if (!selectedCardForPayment && cards.length > 0) {
      setSelectedCardForPayment(cards[0].id);
    }
    if (!selectedAccountForPayment && accounts.length > 0) {
      setSelectedAccountForPayment(accounts[0].id);
    }


    return (
      <Modal
        visible={isPaymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Make Payment</Text>
              <TouchableOpacity onPress={() => setIsPaymentModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.modalBody}>
                
                {/* Enhanced Amount Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.largeInputLabel}>Amount (₹) *</Text>
                  <TextInput
                    style={styles.largeTextInput}
                    value={paymentAmount}
                    onChangeText={setPaymentAmount}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>

                {/* Credit Card Wheel Picker - Always Visible */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Select Credit Card *</Text>
                  {cards.length > 0 ? (
                    <View style={styles.wheelPickerContainer}>
                      <WheelPicker
                        data={cardPickerData}
                        value={selectedCardForPayment}
                        onValueChanged={handleCardChange}
                        itemHeight={60}
                        visibleItemCount={3}
                        enableScrollByTapOnItem={true}
                        style={styles.wheelPickerStyle}
                        itemTextStyle={styles.wheelPickerText}
                        overlayItemStyle={styles.wheelPickerOverlay}
                      />
                    </View>
                  ) : (
                    <View style={styles.emptyPickerContainer}>
                      <Text style={styles.emptyPickerText}>No credit cards added yet</Text>
                      <TouchableOpacity 
                        style={styles.addCardQuickButton}
                        onPress={() => {
                          setIsPaymentModalVisible(false);
                          setIsAddCardModalVisible(true);
                        }}
                      >
                        <MaterialIcons name="add-circle" size={20} color="#8B5CF6" />
                        <Text style={styles.addCardQuickText}>Add Credit Card First</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>


                {/* Source Account Wheel Picker - Always Visible */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Pay From Account *</Text>
                  {accounts.length > 0 ? (
                    <View style={styles.wheelPickerContainer}>
                      <WheelPicker
                        data={accountPickerData}
                        value={selectedAccountForPayment}
                        onValueChanged={handleAccountChange}
                        itemHeight={60}
                        visibleItemCount={3}
                        enableScrollByTapOnItem={true}
                        style={styles.wheelPickerStyle}
                        itemTextStyle={styles.wheelPickerText}
                        overlayItemStyle={styles.wheelPickerOverlay}
                      />
                    </View>
                  ) : (
                    <View style={styles.emptyPickerContainer}>
                      <Text style={styles.emptyPickerText}>No bank accounts found</Text>
                      <TouchableOpacity 
                        style={styles.addCardQuickButton}
                        onPress={() => {
                          setIsPaymentModalVisible(false);
                          router.push('/accounts');
                        }}
                      >
                        <MaterialIcons name="add-circle" size={20} color="#8B5CF6" />
                        <Text style={styles.addCardQuickText}>Add Bank Account First</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>


                {/* Payment Date Toggle */}
                <View style={styles.inputContainer}>
                  <View style={styles.checkboxRow}>
                    <TouchableOpacity 
                      style={[styles.checkbox, useCustomDate && styles.checkboxActive]}
                      onPress={() => setUseCustomDate(!useCustomDate)}
                    >
                      {useCustomDate && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
                    </TouchableOpacity>
                    <Text style={styles.checkboxLabel}>Custom Payment Date (optional)</Text>
                  </View>
                </View>

                {/* Date Wheel Pickers (Day/Month/Year) with Safety */}
                {useCustomDate && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Payment Date</Text>
                    <View style={styles.datePickerRow}>
                      {/* Day Picker */}
                      <View style={styles.datePickerColumn}>
                        <Text style={styles.datePickerLabel}>Day</Text>
                        <View style={styles.wheelPickerSmall}>
                          <WheelPicker
                            data={dayData}
                            value={paymentDay}
                            onValueChanged={handleDayChange}
                            itemHeight={40}
                            visibleItemCount={3}
                            enableScrollByTapOnItem={true}
                            style={styles.dateWheelStyle}
                            itemTextStyle={styles.dateWheelText}
                            overlayItemStyle={styles.dateWheelOverlay}
                          />
                        </View>
                      </View>
                      
                      {/* Month Picker */}
                      <View style={styles.datePickerColumn}>
                        <Text style={styles.datePickerLabel}>Month</Text>
                        <View style={styles.wheelPickerSmall}>
                          <WheelPicker
                            data={monthData}
                            value={paymentMonth}
                            onValueChanged={handleMonthChange}
                            itemHeight={40}
                            visibleItemCount={3}
                            enableScrollByTapOnItem={true}
                            style={styles.dateWheelStyle}
                            itemTextStyle={styles.dateWheelText}
                            overlayItemStyle={styles.dateWheelOverlay}
                          />
                        </View>
                      </View>
                      
                      {/* Year Picker */}
                      <View style={styles.datePickerColumn}>
                        <Text style={styles.datePickerLabel}>Year</Text>
                        <View style={styles.wheelPickerSmall}>
                          <WheelPicker
                            data={yearData}
                            value={paymentYear}
                            onValueChanged={handleYearChange}
                            itemHeight={40}
                            visibleItemCount={3}
                            enableScrollByTapOnItem={true}
                            style={styles.dateWheelStyle}
                            itemTextStyle={styles.dateWheelText}
                            overlayItemStyle={styles.dateWheelOverlay}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* Notes (Optional) */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Notes (Optional)</Text>
                  <TextInput
                    style={[styles.textInput, { minHeight: 60 }]}
                    value={paymentNotes}
                    onChangeText={setPaymentNotes}
                    placeholder="Reference or comments"
                    multiline
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsPaymentModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, isProcessing && styles.disabledButton]}
                onPress={handleRecordPayment}
                disabled={isProcessing}
              >
                <Text style={styles.primaryButtonText}>{isProcessing ? 'Processing...' : 'Save Payment'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };








  // Modal renders would go here - simplified for space
  // Will provide complete modal implementations in next phase

  if (loading) {
    return (
      <ScreenLayout>
        <View style={{ padding: 16 }}>
          <Text>Loading credit cards data…</Text>
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
        <View style={styles.cardsContainer}>
          <Text style={styles.sectionTitle}>Your Credit Cards</Text>
          {creditCardGroups.length > 0 ? (
            creditCardGroups.map(renderCreditCardGroup)
          ) : (
            <View style={styles.emptyCards}>
              <MaterialIcons name="credit-card" size={64} color="#E0E0E0" />
              <Text style={styles.emptyText}>No credit cards yet</Text>
              <Text style={styles.emptySubtext}>Add your first credit card to get started</Text>
            </View>
          )}
        </View>
        <AppFooter />
      </ScrollView>

      {renderAddCardModal()}
      {renderChargeModal()}
      {renderPaymentModal()}

      {/* TransactionsModal Integration */}
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
    backgroundColor: '#8B5CF6', // Purple accent
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
  transactionsCount: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.7,
    marginTop: 2,
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
  cardsContainer: {
    paddingHorizontal: 16,
    marginBottom: 100,
  },
  cardGroup: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  cardTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardDetails: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  bankText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
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
  cardDate: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  deleteButton: {
    padding: 4,
  },
  balanceSection: {
    gap: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E74C3C', // Red for outstanding balance
  },
  availableAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#27AE60', // Green for available credit
  },
  dueLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  minimumAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500', // Orange for minimum payment
  },
  overdueText: {
    color: '#E74C3C', // Red for overdue
    fontWeight: '600',
  },
  emptyCards: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginTop: 16,
    marginBottom: 4,
    textAlign: 'center',
    padding: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rightIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // Modal shared
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    width: '90%',
    maxWidth: 420,
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
    color: Colors.text.primary,
  },
  modalScrollView: { flexGrow: 1 },
  modalBody: { padding: 20 },
  inputContainer: { marginBottom: 16 },
  inputLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: Colors.background.secondary,
  },
  pickerPillSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  pickerPillText: {
    fontSize: 13,
    color: Colors.text.primary,
  },
  pickerPillTextSelected: {
    color: Colors.white,
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
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 10,
  },
  cancelButtonText: { fontSize: 16, color: '#666666' },
  primaryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  disabledButton: {
    backgroundColor: '#C7B8F7',
  },
  optionalFieldsDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
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
  // Complete wheel picker styles
  largeInputLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  largeTextInput: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderRadius: 12,
    padding: 20,
    fontSize: 28,
    fontWeight: '600',
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
    textAlign: 'center',
  },
  wheelPickerContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    marginTop: 8,
    height: 180,
  },
  wheelPickerStyle: {
    flex: 1,
  },
  wheelPickerSmall: {
    backgroundColor: Colors.background.primary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    height: 120,
    width: 100,
  },
  dateWheelStyle: {
    flex: 1,
  },
  wheelPickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
    lineHeight: 22,
  },
  wheelPickerOverlay: {
    backgroundColor: '#8B5CF6' + '20',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#8B5CF6',
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  datePickerColumn: {
    alignItems: 'center',
    flex: 1,
  },
  datePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  dateWheelText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  dateWheelOverlay: {
    backgroundColor: '#8B5CF6' + '15',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#8B5CF6',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#8B5CF6',
  },
  checkboxLabel: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  emptyPickerContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  emptyPickerText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  addCardQuickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6' + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  addCardQuickText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
  },


});

export { CreditCardsScreen as default };

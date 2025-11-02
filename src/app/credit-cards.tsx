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
  
  // Payment Modal states  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedCardForPayment, setSelectedCardForPayment] = useState<string>('');
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
    
    if (!paymentAmount.trim() || !selectedCardForPayment) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const raw = Number(paymentAmount);
    if (!Number.isFinite(raw) || raw <= 0) {
      Alert.alert('Error', 'Please enter a valid positive amount');
      return;
    }

    setIsProcessing(true);
    try {
      const now = new Date();
      const amount = Math.round(raw);

      // Create payment transaction
      const newPayment: CreditCardTransaction = {
        id: `${Date.now()}-payment`,
        description: 'Credit Card Payment',
        amount: { amount: -amount, currency: 'INR' }, // negative for payments
        type: 'PAYMENT',
        category: 'Payment',
        cardId: selectedCardForPayment,
        notes: paymentNotes?.trim() || undefined,
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
            action: 'RECORD_PAYMENT',
            timestamp: now,
            amount: -amount,
            cardId: selectedCardForPayment,
          }],
        },
        linkedTransactions: [],
      };

      await save((draft: AppModel) => {
        const nextTransactions: CreditCardTransaction[] = draft.creditCardTransactions ? [...draft.creditCardTransactions] as CreditCardTransaction[] : [];
        nextTransactions.push(newPayment as CreditCardTransaction);

        const nextCards: CreditCardEntry[] = (draft.creditCardEntries ?? []).map((card) => {
          if (card.id === selectedCardForPayment) {
            const newBalance = Math.max(0, card.currentBalance.amount - amount);
            return {
              ...card,
              currentBalance: { ...card.currentBalance, amount: newBalance },
              availableCredit: { ...card.availableCredit, amount: card.creditLimit.amount - newBalance },
              minimumPayment: { ...card.minimumPayment, amount: Math.max(newBalance * 0.05, 100) }
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
      setPaymentAmount('');
      setSelectedCardForPayment('');
      setPaymentNotes('');
      setIsPaymentModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to record payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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
          <Text style={styles.totalLabel}>Total Outstanding Balance</Text>
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
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={() => handleDeleteCard(group.card.id)}
          >
            <MaterialIcons name="delete" size={20} color="#E74C3C" />
          </TouchableOpacity>
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
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text.tertiary,
    textAlign: 'center',
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
});

export { CreditCardsScreen as default };

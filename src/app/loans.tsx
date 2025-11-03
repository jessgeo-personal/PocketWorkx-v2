// src/app/loans.tsx
import React, { useMemo, useState, useEffect } from 'react';
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
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenLayout from '../components/ScreenLayout';
import AppFooter from '../components/AppFooter';
import { Colors } from '../utils/theme';
import TransactionsModal from '../components/modals/TransactionsModal';
import type { FilterCriteria } from '../types/transactions';

// Note: Storage integration will be added next phase to replace placeholder data.
type Currency = 'INR';
type Money = { amount: number; currency: Currency };

type LoanEntry = {
  id: string;
  type: 'home' | 'car' | 'personal' | 'education' | 'other';
  bank: string;
  loanNumber: string;
  principalAmount: Money;
  currentBalance: Money;
  interestRate: number; // annual %
  tenureMonths: number;
  emiAmount: Money;
  nextPaymentDate: Date;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
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
    const result = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + (otherNumbers ? ',' : '') + lastThree;
    return `${sign}₹${result}`;
  }
};

const getLoanTypeIcon = (t: LoanEntry['type']) => {
  switch (t) {
    case 'home': return 'home';
    case 'car': return 'directions-car';
    case 'personal': return 'person';
    case 'education': return 'school';
    default: return 'trending-up';
  }
};

const getLoanAccent = (t: LoanEntry['type']) => {
  // Loans color scheme per spec: red/orange tones
  switch (t) {
    case 'home': return '#D32F2F';
    case 'car': return '#F57C00';
    case 'personal': return '#E64A19';
    case 'education': return '#C2185B';
    default: return '#D32F2F';
  }
};

const LoansScreen: React.FC = () => {
  // Placeholder local data for phase 1. Next phase: replace with storage state.
  const [loans, setLoans] = useState<LoanEntry[]>([
    {
      id: 'loan-1',
      type: 'home',
      bank: 'HDFC Bank',
      loanNumber: 'HL-0001',
      principalAmount: { amount: 7500000, currency: 'INR' },
      currentBalance: { amount: 5825000, currency: 'INR' },
      interestRate: 7.35,
      tenureMonths: 240,
      emiAmount: { amount: 45600, currency: 'INR' },
      nextPaymentDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 10),
      startDate: new Date(2021, 3, 15),
      endDate: new Date(2041, 3, 15),
      isActive: true,
    },
    {
      id: 'loan-2',
      type: 'car',
      bank: 'ICICI Bank',
      loanNumber: 'CAR-8921',
      principalAmount: { amount: 1200000, currency: 'INR' },
      currentBalance: { amount: 310000, currency: 'INR' },
      interestRate: 9.1,
      tenureMonths: 60,
      emiAmount: { amount: 25500, currency: 'INR' },
      nextPaymentDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 3),
      startDate: new Date(2023, 1, 10),
      endDate: new Date(2028, 1, 10),
      isActive: true,
    },
  ]);

  const [txModalVisible, setTxModalVisible] = useState(false);
  const [txFilter, setTxFilter] = useState<FilterCriteria | null>(null);

  const totalOutstanding = useMemo(
    () => loans.reduce((sum, l) => sum + (l.currentBalance?.amount || 0), 0),
    [loans]
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Loans & Liabilities</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => Alert.alert('Coming Soon', 'Add Loan modal will be implemented next.')}
      >
        <MaterialIcons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const openAllLoansTransactions = () => {
    // Next phase will implement TransactionsModal mapping for 'loan'
    setTxFilter({
      assetType: 'loan',
      filterType: 'all',
      assetLabel: 'All Loans',
    });
    setTxModalVisible(true);
  };

  const renderTotalCard = () => (
    <TouchableOpacity activeOpacity={0.9} onPress={openAllLoansTransactions}>
      <LinearGradient colors={['#D32F2F', '#E64A19']} style={styles.totalCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.totalLabel}>Total Outstanding Loans</Text>
          <MaterialIcons name="chevron-right" size={20} color="#FFFFFF" />
        </View>
        <Text style={styles.totalAmount}>{formatFullINR(totalOutstanding)}</Text>
        <Text style={styles.entriesCount}>{loans.length} Active {loans.length === 1 ? 'Loan' : 'Loans'}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionGrid}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Coming Soon', 'Add Loan will be implemented next.')}
        >
          <MaterialIcons name="add-circle" size={24} color="#8B5CF6" />
          <Text style={styles.actionText}>Add Loan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Coming Soon', 'Record EMI will be implemented next.')}
        >
          <MaterialIcons name="receipt" size={24} color="#8B5CF6" />
          <Text style={styles.actionText}>Record EMI</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Coming Soon', 'Prepay Loan will be implemented next.')}
        >
          <MaterialIcons name="payment" size={24} color="#8B5CF6" />
          <Text style={styles.actionText}>Prepay Loan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Coming Soon', 'Loan Trends will be implemented next.')}
        >
          <MaterialIcons name="trending-up" size={24} color="#8B5CF6" />
          <Text style={styles.actionText}>View Trends</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLoanCard = (loan: LoanEntry) => {
    const daysUntilDue = Math.ceil((loan.nextPaymentDate.getTime() - Date.now()) / (1000 * 86400));
    const isOverdue = daysUntilDue < 0;

    const onOpenLoanTransactions = () => {
      setTxFilter({
        assetType: 'loan',
        filterType: 'category',
        assetLabel: `${loan.bank} • ${loan.type.toUpperCase()}`,
        assetId: loan.id,
      });
      setTxModalVisible(true);
    };

    return (
      <TouchableOpacity
        key={loan.id}
        style={styles.card}
        activeOpacity={0.9}
        onPress={onOpenLoanTransactions}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <View style={[styles.typeIcon, { backgroundColor: getLoanAccent(loan.type) }]}>
              <MaterialIcons name={getLoanTypeIcon(loan.type) as any} size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{loan.type.toUpperCase()} Loan</Text>
              <Text style={styles.bankText}>{loan.bank} • {loan.loanNumber}</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={Colors.text.secondary} />
        </View>

        <View style={styles.balanceSection}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Outstanding Balance</Text>
            <Text style={styles.balanceAmount}>{formatFullINR(loan.currentBalance.amount)}</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>EMI</Text>
            <Text style={styles.emiAmount}>{formatFullINR(loan.emiAmount.amount)}</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={[styles.dueLabel, isOverdue && styles.overdueText]}>
              {isOverdue ? `Overdue by ${Math.abs(daysUntilDue)} days` : `Due in ${daysUntilDue} days`}
            </Text>
            <Text style={styles.rateLabel}>{loan.interestRate.toFixed(2)}% p.a.</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
          <Text style={styles.sectionTitle}>Your Loans</Text>
          {loans.length > 0 ? (
            loans.map(renderLoanCard)
          ) : (
            <View style={styles.emptyCards}>
              <MaterialIcons name="trending-up" size={64} color="#E0E0E0" />
              <Text style={styles.emptyText}>No loans yet</Text>
              <Text style={styles.emptySubtext}>Add your first loan to get started</Text>
            </View>
          )}
        </View>

        <AppFooter />
      </ScrollView>

      {/* TransactionsModal integration placeholder */}
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
    backgroundColor: Colors.background.primary, // Golden background
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
  scrollView: { flex: 1 },
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  cardsContainer: {
    paddingHorizontal: 16,
    marginBottom: 100,
  },
  card: {
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
    marginBottom: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 10,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  bankText: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  balanceSection: { gap: 8 },
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
    color: '#D32F2F', // red for liability
  },
  emiAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F57C00', // orange for EMI
  },
  dueLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  rateLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  overdueText: {
    color: '#E74C3C',
    fontWeight: '700',
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
});

export default LoansScreen;

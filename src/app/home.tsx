// src/app/home.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../utils/theme';
import { formatCurrency } from '../utils/currency';
import { useStorage } from '../services/storage/StorageProvider';
import AppFooter from '../components/AppFooter';


// Import the logo image
const LogoImage = require('../assets/logo.png');

interface DashboardData {
  liquidCash: number;
  netWorth: number;
  totalLiabilities: number;
  investmentsReceivables: number;
  userName: string;
  userEmail: string;
}

interface Transaction {
  id: string;
  merchant: string;
  date: Date;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  type: 'debit' | 'credit';
  assetType: 'cash' | 'account' | 'loan' | 'credit_card'; // NEW
  assetSource: string; // NEW: e.g., "Wallet", "HDFC Salary ****1234"
}


const HomeScreen: React.FC = () => {
  const router = useRouter();
  // Hook into global storage
  const { state } = useStorage();

  // Live calculations from actual data
  const dashboardData = useMemo((): DashboardData => {
    // 1) Cash totals
    const cashEntries = (state?.cashEntries ?? []) as Array<{
      amount: { amount: number; currency: string };
      type: string;
      timestamp: string | Date;
      description?: string;
      cashCategory?: string;
    }>;
    const liquidCash = cashEntries.reduce((sum, e) => sum + (e.amount?.amount ?? 0), 0);

    // 2) Bank accounts total balance  
    const accounts = (state?.accounts ?? []) as Array<{
      id: string;
      nickname: string;
      bankName: string;
      type: string;
      balance: { amount: number; currency: string };
    }>;
    const accountsTotal = accounts.reduce((sum, a) => sum + (a.balance?.amount ?? 0), 0);

    // 3) For now, liabilities and investments placeholders (to be wired in later phases)
    const totalLiabilities = 0;     // loans + credit cards totals will fill this
    const investmentsReceivables = 0;      // investments + receivables totals will fill this

    // 4) Net worth per verified formula: accounts + liquidCash - liabilities + investments
    const netWorth = accountsTotal + liquidCash - totalLiabilities + investmentsReceivables;

    return {
      liquidCash,
      netWorth,
      totalLiabilities,
      investmentsReceivables,
      userName: 'Donna',
      userEmail: 'hello@reallygreatsite.com',
    };
  }, [state]);

  // Build unified recent transactions from cash + accounts
  const recentTransactions = useMemo((): Transaction[] => {
    const cashEntries = (state?.cashEntries ?? []) as Array<{
      id: string;
      description?: string;
      amount: { amount: number; currency: string };
      timestamp: string | Date;
      cashCategory?: string;
      type: string;
    }>;

    const accounts = (state?.accounts ?? []) as Array<{
      id: string;
      nickname: string;
      accountNumberMasked: string;
      transactions?: Array<{
        id: string;
        datetime: string | Date;
        amount: { amount: number; currency: string };
        description: string;
        type: string;
        status?: string;
      }>;
    }>;

    const cashTxns = cashEntries.map(e => ({
      id: e.id,
      merchant: e.description || 'Cash Transaction',
      date: new Date(e.timestamp),
      amount: e.amount.amount,
      status: 'success' as const,
      type: e.amount.amount >= 0 ? 'credit' as const : 'debit' as const,
      assetType: 'cash' as const,
      assetSource: e.cashCategory || 'Cash', // Show which cash category
    }));

    const accountTxns = accounts.flatMap(acc => 
      (acc.transactions ?? []).map(tx => ({
        id: tx.id,
        merchant: tx.description || 'Bank Transaction',
        date: new Date(tx.datetime),
        amount: tx.amount.amount,
        status: (tx.status === 'completed' ? 'success' : 'pending') as 'success' | 'pending' | 'failed',
        type: tx.amount.amount >= 0 ? 'credit' as const : 'debit' as const,
        assetType: 'account' as const,
        assetSource: `${acc.nickname} ${acc.accountNumberMasked}`, // Show which account
      }))
    );

    return [...cashTxns, ...accountTxns]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 6); // Latest 6 transactions
  }, [state]);


  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  //const renderLogoHeader = () => (
  //  <View style={styles.logoHeader}>
  //    <Image 
  //      source={LogoImage} 
  //      style={styles.logoLarge}
  //      resizeMode="contain"
  //    />
  //  </View>
  //);

  const renderWelcomeHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.welcomeHeaderCompact}>
        <Text style={styles.welcomeTextCompact}>Welcome Back, {dashboardData.userName}</Text>
        <Text style={styles.emailTextCompact}>{dashboardData.userEmail}</Text>
      </View>
      <View style={styles.logoPositionedCompact}>
        <Image 
          source={LogoImage} 
          style={styles.logoCompact}
          resizeMode="contain"
        />
      </View>
    </View>
  );

  const renderTopQuickActions = () => (
    <View style={styles.topQuickActionsContainer}>
      <Text style={styles.topQuickActionsTitle}>Quick Actions</Text>
      <View style={styles.topQuickActionsGrid}>
        <TouchableOpacity 
          style={styles.topQuickActionButton}
          onPress={() => router.push({ pathname: '/cash', params: { openModal: 'expense' } })}
        >
          <Feather name="credit-card" size={24} color="#FFFFFF" />
          <Text style={styles.topQuickActionText}>Record Expense</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.topQuickActionButton}
          onPress={() => router.push({ pathname: '/accounts', params: { openModal: 'debit' } })}
        >
          <Feather name="minus-circle" size={24} color="#FFFFFF" />
          <Text style={styles.topQuickActionText}>Add Debit Card/UPI Expense</Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  const renderPrimaryBalance = () => (
    <View style={styles.primaryBalanceCard}>
      <Text style={styles.primaryAmount}>
        {formatCurrency(dashboardData.liquidCash, 'INR')}
      </Text>
      <Text style={styles.primaryLabel}>Your liquid cash balance</Text>
    </View>
  );

  const renderMetricsGrid = () => (
    <View style={styles.metricsGrid}>
      <TouchableOpacity 
        style={styles.metricCard}
        onPress={() => router.push('/analytics')}
      >
        <Text style={styles.metricAmount}>
          {formatCurrency(dashboardData.netWorth, 'INR')}
        </Text>
        <Text style={styles.metricLabel}>Your total net worth</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.metricCard}
        onPress={() => router.push('/liabilities')}
      >
        <Text style={[styles.metricAmount, { color: Colors.error.main }]}>
          {formatCurrency(dashboardData.totalLiabilities, 'INR')}
        </Text>
        <Text style={styles.metricLabel}>Your total liabilities</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.metricCard}
        onPress={() => router.push('/investments')}
      >
        <Text style={styles.metricAmount}>
          {formatCurrency(dashboardData.investmentsReceivables, 'INR')}
        </Text>
        <Text style={styles.metricLabel}>Your Investments & receivables</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLatestTransactions = () => (
    <View style={styles.transactionsSection}>
      <Text style={styles.sectionTitle}>Latest Transactions</Text>
      <View style={styles.transactionsList}>
        {recentTransactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              <Text style={styles.merchantName}>{transaction.merchant}</Text>
              <Text style={styles.transactionDate}>
                {transaction.date.toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
              {/* NEW: Asset type and source */}
              <Text style={styles.assetInfo}>
                {transaction.assetType === 'cash' ? '💰 ' : '🏦 '}{transaction.assetSource}
              </Text>
            </View>
            <View style={styles.transactionRight}>
              <View 
                style={[
                  styles.statusBadge,
                  { backgroundColor: transaction.status === 'success' ? Colors.success.light : Colors.error.light }
                ]}
              >
                <Text 
                  style={[
                    styles.statusText,
                    { color: transaction.status === 'success' ? Colors.success.dark : Colors.error.dark }
                  ]}
                >
                  {transaction.status === 'success' ? 'Success' : transaction.status === 'pending' ? 'Pending' : 'Failed'}
                </Text>
              </View>
              {/* NEW: Color-coded amounts with proper sign */}
              <Text 
                style={[
                  styles.transactionAmount, 
                  { 
                    color: transaction.type === 'credit' ? '#27AE60' : '#E74C3C' // Green for credit, red for debit
                  }
                ]}
              >
                {transaction.type === 'debit' ? '-' : '+'}
                {formatCurrency(Math.abs(transaction.amount), 'INR')}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsSection}>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity style={styles.quickActionItem}>
          <Feather name="camera" size={20} color={Colors.text.secondary} />
          <Text style={styles.quickActionText}>Scan receipts</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickActionItem}>
          <Feather name="upload" size={20} color={Colors.text.secondary} />
          <Text style={styles.quickActionText}>Upload Statements</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickActionItem}>
          <Feather name="message-circle" size={20} color={Colors.text.secondary} />
          <Text style={styles.quickActionText}>Scan SMS for transactions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickActionItem}>
          <Feather name="mail" size={20} color={Colors.text.secondary} />
          <Text style={styles.quickActionText}>Scan Emails for transactions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.quickActionItem, styles.primaryAction]}
          onPress={() => router.push({ pathname: '/cash', params: { openModal: 'add' } })}
        >
          <Feather name="plus" size={20} color={Colors.white} />
          <Text style={[styles.quickActionText, { color: Colors.white }]}>Add Cash</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenLayout>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderWelcomeHeader()}
        {renderTopQuickActions()}
        {renderPrimaryBalance()}
        {renderMetricsGrid()}
        {renderLatestTransactions()}
        {renderQuickActions()}
        <AppFooter />
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  headerContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm, // Reduced top padding
    marginBottom: Spacing.md, // Reduced bottom margin
  },

  // NEW: Compact welcome card - smaller, right-aligned, above logo
  welcomeHeaderCompact: {
    backgroundColor: Colors.background.card,
    padding: Spacing.md, // Reduced padding
    borderRadius: BorderRadius.lg,
    alignSelf: 'flex-end', // Right-aligned
    marginBottom: Spacing.sm,
    maxWidth: '70%', // Limit width to make it compact
    ...Shadows.base,
  },
  welcomeTextCompact: {
    fontSize: Typography.fontSize.base, // Smaller than original
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: 'right', // Right-aligned text
  },
  emailTextCompact: {
    fontSize: Typography.fontSize.xs, // Smaller than original
    color: Colors.text.secondary,
    textAlign: 'right', // Right-aligned text
  },

  // UPDATED: Logo section - reduced height and spacing
  logoPositionedCompact: {
    alignItems: 'flex-start',
    marginBottom: Spacing.xs, // Much smaller bottom margin
  },
  logoCompact: {
    width: 400, // Reduced from 400
    height: 250, // Reduced from 250
  },

  // Remove these old styles (they're replaced by compact versions):
  // logoPositioned: { ... },
  // logoLarge: { ... },
  // welcomeHeader: { ... },
  // welcomeText: { ... },
  // emailText: { ... },

  primaryBalanceCard: {
    backgroundColor: Colors.background.card,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm, // Small top margin since header is compact
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    ...Shadows.md,
  },

  primaryAmount: {
    fontSize: Typography.fontSize['5xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  primaryLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  metricsGrid: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
  },
  metricCard: {
    backgroundColor: Colors.background.card,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    ...Shadows.base,
  },
  metricAmount: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.info.main,
    marginBottom: Spacing.xs,
  },
  metricLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  transactionsSection: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.base,
  },
  transactionsList: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    ...Shadows.base,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  transactionLeft: {
    flex: 1,
  },
  merchantName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  transactionDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  transactionAmount: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  quickActionsSection: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
  },
  quickActionsGrid: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    ...Shadows.base,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  primaryAction: {
    backgroundColor: Colors.accent,
    marginBottom: 0,
  },
  quickActionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.md,
    fontWeight: Typography.fontWeight.medium,
  },
  bottomSpacing: {
    height: 100, // Space for bottom menu
  },
  assetInfo: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  topQuickActionsContainer: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
  },
  topQuickActionsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.base,
    textAlign: 'center',
  },
  topQuickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  topQuickActionButton: {
    flex: 1,
    backgroundColor: '#8B5CF6', // Purple accent per design guidelines
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    ...Shadows.md,
    minHeight: 80,
    justifyContent: 'center',
  },
  topQuickActionText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 16, // Better text wrapping for long button text
  },

});

export default HomeScreen;
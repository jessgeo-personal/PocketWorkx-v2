// src/app/home.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../utils/theme';
import { formatCurrency } from '../utils/currency';

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
}

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    liquidCash: 2345300,
    netWorth: 10325550,
    totalLiabilities: 7500550,
    investmentsReceivables: 17832550,
    userName: 'Donna',
    userEmail: 'hello@reallygreatsite.com',
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([
    {
      id: '1',
      merchant: 'Borcelle Store',
      date: new Date('2024-09-10'),
      amount: -3500,
      status: 'success',
      type: 'debit',
    },
    {
      id: '2', 
      merchant: 'Timmerman Industries',
      date: new Date('2024-06-12'),
      amount: -6500,
      status: 'success',
      type: 'debit',
    },
  ]);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const renderWelcomeHeader = () => (
    <View style={styles.welcomeHeader}>
      <Text style={styles.welcomeText}>Welcome Back, {dashboardData.userName}</Text>
      <Text style={styles.emailText}>{dashboardData.userEmail}</Text>
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
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
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
                  {transaction.status === 'success' ? 'Success' : 'Failed'}
                </Text>
              </View>
              <Text style={[styles.transactionAmount, { color: Colors.error.main }]}>
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
          onPress={() => router.push('/cash')}
        >
          <Feather name="plus" size={20} color={Colors.white} />
          <Text style={[styles.quickActionText, { color: Colors.white }]}>Add Cash</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenLayout title="Home">
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderWelcomeHeader()}
        {renderPrimaryBalance()}
        {renderMetricsGrid()}
        {renderLatestTransactions()}
        {renderQuickActions()}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeHeader: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
  },
  welcomeText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  emailText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  primaryBalanceCard: {
    backgroundColor: Colors.background.card,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
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
});

export default HomeScreen;
// src/app/liabilities.tsx
import React, { useState } from 'react';
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

interface LiabilitiesData {
  totalLiabilities: number;
  homeLoans: number;
  personalLoans: number;
  creditCards: number;
  otherDebts: number;
  debtToIncomeRatio: number;
  monthlyPayments: number;
}

interface UpcomingPayment {
  id: string;
  name: string;
  date: Date;
  amount: number;
  type: 'loan' | 'credit_card';
}

const LiabilitiesScreen: React.FC = () => {
  const router = useRouter();
  const [liabilitiesData, setLiabilitiesData] = useState<LiabilitiesData>({
    totalLiabilities: 12332550,
    homeLoans: 8500000,
    personalLoans: 3225000,
    creditCards: 252550,
    otherDebts: 355000,
    debtToIncomeRatio: 0.28,
    monthlyPayments: 166500,
  });
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([
    {
      id: '1',
      name: 'ICICI Home Loan 3235',
      date: new Date('2025-10-10'),
      amount: 122000,
      type: 'loan',
    },
    {
      id: '2',
      name: 'Federal Credit Card 3266',
      date: new Date('2025-10-23'),
      amount: 29556,
      type: 'credit_card',
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

  const renderLiabilitiesOverview = () => (
    <View style={styles.overviewCard}>
      <View style={styles.overviewHeader}>
        <Feather name="alert-triangle" size={24} color={Colors.error.main} />
        <Text style={styles.overviewTitle}>Total Liabilities</Text>
      </View>
      <Text style={[styles.overviewAmount, { color: Colors.error.main }]}>
        {formatCurrency(liabilitiesData.totalLiabilities, 'INR')}
      </Text>
      <Text style={styles.overviewSubtext}>
        Monthly payments: {formatCurrency(liabilitiesData.monthlyPayments, 'INR')}
      </Text>
    </View>
  );

  const renderLiabilitiesBreakdown = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Liabilities Breakdown</Text>
      
      <View style={styles.breakdownCard}>
        <TouchableOpacity 
          style={styles.breakdownItem}
          onPress={() => router.push('/loans')}
        >
          <View style={styles.breakdownLeft}>
            <Feather name="home" size={20} color={Colors.info.main} />
            <View style={styles.breakdownDetails}>
              <Text style={styles.breakdownLabel}>Home Loans</Text>
              <Text style={styles.breakdownSubtext}>Mortgage & property loans</Text>
            </View>
          </View>
          <View style={styles.breakdownRight}>
            <Text style={[styles.breakdownAmount, { color: Colors.error.main }]}>
              {formatCurrency(liabilitiesData.homeLoans, 'INR')}
            </Text>
            <Feather name="chevron-right" size={16} color={Colors.text.secondary} />
          </View>
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity 
          style={styles.breakdownItem}
          onPress={() => router.push('/loans')}
        >
          <View style={styles.breakdownLeft}>
            <Feather name="trending-down" size={20} color={Colors.warning.main} />
            <View style={styles.breakdownDetails}>
              <Text style={styles.breakdownLabel}>Personal Loans</Text>
              <Text style={styles.breakdownSubtext}>Car, personal & business loans</Text>
            </View>
          </View>
          <View style={styles.breakdownRight}>
            <Text style={[styles.breakdownAmount, { color: Colors.error.main }]}>
              {formatCurrency(liabilitiesData.personalLoans, 'INR')}
            </Text>
            <Feather name="chevron-right" size={16} color={Colors.text.secondary} />
          </View>
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity 
          style={styles.breakdownItem}
          onPress={() => router.push('/credit-cards')}
        >
          <View style={styles.breakdownLeft}>
            <Feather name="credit-card" size={20} color={Colors.accent} />
            <View style={styles.breakdownDetails}>
              <Text style={styles.breakdownLabel}>Credit Cards</Text>
              <Text style={styles.breakdownSubtext}>Outstanding balances</Text>
            </View>
          </View>
          <View style={styles.breakdownRight}>
            <Text style={[styles.breakdownAmount, { color: Colors.error.main }]}>
              {formatCurrency(liabilitiesData.creditCards, 'INR')}
            </Text>
            <Feather name="chevron-right" size={16} color={Colors.text.secondary} />
          </View>
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity style={styles.breakdownItem}>
          <View style={styles.breakdownLeft}>
            <Feather name="more-horizontal" size={20} color={Colors.text.secondary} />
            <View style={styles.breakdownDetails}>
              <Text style={styles.breakdownLabel}>Other Debts</Text>
              <Text style={styles.breakdownSubtext}>Miscellaneous liabilities</Text>
            </View>
          </View>
          <View style={styles.breakdownRight}>
            <Text style={[styles.breakdownAmount, { color: Colors.error.main }]}>
              {formatCurrency(liabilitiesData.otherDebts, 'INR')}
            </Text>
            <Feather name="chevron-right" size={16} color={Colors.text.secondary} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUpcomingPayments = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Upcoming Payments</Text>
      
      <View style={styles.paymentsCard}>
        {upcomingPayments.map((payment) => (
          <View key={payment.id} style={styles.paymentItem}>
            <View style={styles.paymentLeft}>
              <Text style={styles.paymentName}>{payment.name}</Text>
              <Text style={styles.paymentDate}>
                {payment.date.toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <Text style={[styles.paymentAmount, { color: Colors.error.main }]}>
              {formatCurrency(payment.amount, 'INR')}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderDebtMetrics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Debt Analysis</Text>
      
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: Colors.error.main }]}>
            {(liabilitiesData.debtToIncomeRatio * 100).toFixed(1)}%
          </Text>
          <Text style={styles.metricLabel}>Debt-to-Income</Text>
          <Text style={[styles.metricStatus, { color: Colors.success.main }]}>Healthy</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: Colors.error.main }]}>
            {formatCurrency(liabilitiesData.monthlyPayments, 'INR')}
          </Text>
          <Text style={styles.metricLabel}>Monthly Payments</Text>
          <Text style={styles.metricStatus}>
            {((liabilitiesData.monthlyPayments / 245000) * 100).toFixed(0)}% of income
          </Text>
        </View>
      </View>

      <View style={styles.recommendationCard}>
        <Feather name="trending-up" size={20} color={Colors.success.main} />
        <View style={styles.recommendationText}>
          <Text style={styles.recommendationTitle}>Good Debt Management</Text>
          <Text style={styles.recommendationDescription}>
            Your debt-to-income ratio is healthy. Consider paying extra on high-interest debts to save on interest.
          </Text>
        </View>
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
        {renderLiabilitiesOverview()}
        {renderLiabilitiesBreakdown()}
        {renderUpcomingPayments()}
        {renderDebtMetrics()}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overviewCard: {
    backgroundColor: Colors.background.card,
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.base,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    ...Shadows.md,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  overviewTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  overviewAmount: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
  },
  overviewSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  section: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.base,
  },
  breakdownCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    ...Shadows.md,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breakdownDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  breakdownLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  breakdownSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  breakdownRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownAmount: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    marginRight: Spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.sm,
  },
  paymentsCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    ...Shadows.base,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  paymentLeft: {
    flex: 1,
  },
  paymentName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  paymentDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  paymentAmount: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  metricCard: {
    backgroundColor: Colors.background.card,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    width: '48%',
    alignItems: 'center',
    ...Shadows.md,
  },
  metricValue: {
    fontSize: Typography.fontSize['2xl'] + 4,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
  },
  metricLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  metricStatus: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.success.light,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success.main,
  },
  recommendationText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  recommendationTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.success.dark,
    marginBottom: Spacing.xs,
  },
  recommendationDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.success.dark,
    lineHeight: Typography.lineHeight.xs,
  },
  bottomSpacing: {
    height: 100, // Space for bottom menu
  },
});

export default LiabilitiesScreen;
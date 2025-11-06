// src/app/liabilities.tsx
import React, { useState, useMemo } from 'react';
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
import { useStorage } from '../services/storage/StorageProvider';
import { computeTotals } from '../selectors/totals';

interface UpcomingPayment {
  id: string;
  name: string;
  date: Date;
  amount: number;
  type: 'loan' | 'credit_card';
}

const LiabilitiesScreen: React.FC = () => {
  const router = useRouter();
  const { state } = useStorage();

  const {
    totalLoans,
    totalCreditCards,
  } = computeTotals(state ?? undefined);

  const totalLiabilities = totalLoans + totalCreditCards;

  // Loan breakdown by type with individual loan details
  const loanBreakdown = useMemo(() => {
    const entries = ((state?.loanEntries ?? []) as any[]);
    const group: Record<string, { total: number; count: number; items: any[] }> = {};

    const toDisplayLabel = (t: string) => {
      switch ((t || '').toLowerCase()) {
        case 'home': return 'Home Loan';
        case 'car': return 'Car Loan';
        case 'education': return 'Education Loan';
        case 'personal': return 'Personal Loan';
        case 'other': return 'Other Loans';
        default: return 'Other Loans';
      }
    };

    entries.forEach((loan: any) => {
      const typeKey = (loan?.type || 'other').toLowerCase();
      const amount = loan?.currentBalance?.amount ?? 0;
      if (!group[typeKey]) {
        group[typeKey] = { total: 0, count: 0, items: [] };
      }
      group[typeKey].total += amount;
      group[typeKey].count += 1;
      group[typeKey].items.push(loan);
    });

    return Object.entries(group)
      .sort(([, a], [, b]) => (b.total - a.total))
      .map(([typeKey, data]) => ({
        type: typeKey,
        label: toDisplayLabel(typeKey),
        total: data.total,
        count: data.count,
        items: data.items.sort((a, b) => ((b?.currentBalance?.amount ?? 0) - (a?.currentBalance?.amount ?? 0))),
      }));
  }, [state?.loanEntries]);

  // Credit card breakdown
  const creditCardBreakdown = useMemo(() => {
    const entries = ((state?.creditCardEntries ?? []) as any[]);
    return entries
      .map((cc: any) => {
        const bank = cc?.bank || 'Credit Card';
        const masked = String(cc?.cardNumber || '****XXXX');
        // extract last4 even if already masked; fall back to last digits in string
        const digits = masked.replace(/[^\d]/g, '');
        const last4 = digits.slice(-4) || 'XXXX';
        const amount = cc?.currentBalance?.amount ?? 0;
        return { id: cc?.id, bank, last4, amount };
      })
      .filter(cc => (cc.amount || 0) > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [state?.creditCardEntries]);


  // Calculate monthly payments from real data
  const monthlyPayments = useMemo(() => {
    const loanEMIs = loanBreakdown.reduce((sum, group) => {
      return sum + group.items.reduce((subSum, loan) => {
        return subSum + (loan?.emiAmount?.amount ?? 0);
      }, 0);
    }, 0);

    const creditCardMin = creditCardBreakdown.reduce((sum, cc) => {
      // Assume 5% minimum payment on outstanding balance
      return sum + Math.round(cc.amount * 0.05);
    }, 0);

    return loanEMIs + creditCardMin;
  }, [loanBreakdown, creditCardBreakdown]);

  // Debt-to-income placeholder (requires income data)
  const debtToIncomeRatio = useMemo(() => {
    // Placeholder: assume ₹2.5L monthly income for calculation
    const assumedMonthlyIncome = 250000;
    return monthlyPayments > 0 ? monthlyPayments / assumedMonthlyIncome : 0;
  }, [monthlyPayments]);

  // Enhanced upcoming payments for next 3 months
  const upcomingPayments = useMemo(() => {
    const payments: UpcomingPayment[] = [];
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    
    // Add loan EMIs for next 3 months
    loanBreakdown.forEach(group => {
      group.items.forEach((loan: any) => {
        const emiAmount = loan?.emiAmount?.amount ?? 0;
        if (emiAmount <= 0) return;

        // Generate EMI dates for next 3 months
        let currentDate = new Date(loan?.nextPaymentDate || today);
        let monthCount = 0;
        
        while (currentDate <= threeMonthsLater && monthCount < 3) {
          if (currentDate >= today) {
            const lenderName = loan?.bank || 'Lender';
            const last4 = String(loan?.loanNumber || '').slice(-4) || '';   
            
            payments.push({
              id: `loan-${loan.id}-${currentDate.getTime()}`,
              name: `${lenderName} ${loan.loanType || 'Loan'} ${last4 ? '****' + last4 : ''}`.trim(),
              date: new Date(currentDate),
              amount: emiAmount,
              type: 'loan',
            });
          }
          
          // Move to next month
          currentDate.setMonth(currentDate.getMonth() + 1);
          monthCount++;
        }
      });
    });

    // Add credit card minimum payments for next 3 months
    creditCardBreakdown.forEach((cc) => {
      if (cc.amount <= 0) return;

      for (let i = 0; i < 3; i++) {
        const paymentDate = new Date();
        paymentDate.setMonth(paymentDate.getMonth() + i + 1);
        paymentDate.setDate(15); // Assume 15th of each month for CC payments
        
        payments.push({
          id: `cc-${cc.id}-${paymentDate.getTime()}`,
          name: `${cc.bank} Card ****${cc.last4}`,
          date: paymentDate,
          amount: Math.round(cc.amount * 0.05), // 5% minimum payment
          type: 'credit_card',
        });
      }
    });

    return payments.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [loanBreakdown, creditCardBreakdown]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Add below: const [refreshing, setRefreshing] = useState(false);
  const loans = (state?.loanEntries ?? []) as Array<{
    id: string;
    type: 'home' | 'car' | 'personal' | 'education' | 'other';
    bank: string;
    loanNumber: string;
    currentBalance: { amount: number; currency: 'INR' };
  }>;

  const maskNumber = (raw: string) => {
    if (!raw) return '';
    const last = raw.slice(-4);
    return `****${last}`;
  };

  const formatFullINR = (value: number): string => {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }).format(Math.round(value));
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

  // Build grouped sections that mirror the "Personal Loan" card structure
  const loanTypeOrder: Array<'personal' | 'home' | 'car' | 'education' | 'other'> = [
    'personal', 'home', 'car', 'education', 'other'
  ];

  const loanTypeTitle: Record<string, string> = {
    personal: 'Personal Loan',
    home: 'Home Loan',
    car: 'Car Loan',
    education: 'Education Loan',
    other: 'Other Loans',
  };

  const loanTypeIcon: Record<string, keyof typeof Feather.glyphMap> = {
    personal: 'user',
    home: 'home',
    car: 'truck',
    education: 'book',
    other: 'more-horizontal',
  };

  const loanGroups = loanTypeOrder.map((typeKey) => {
    const list = loans.filter(l => l.type === typeKey);
    const total = list.reduce((s, l) => s + (l.currentBalance?.amount || 0), 0);
    return {
      key: typeKey,
      title: loanTypeTitle[typeKey],
      icon: loanTypeIcon[typeKey],
      count: list.length,
      total,
      rows: list.map(l => ({
        id: l.id,
        left: `${l.bank} ${maskNumber(l.loanNumber)}`,
        amount: l.currentBalance?.amount || 0,
      })),
    };
  }).filter(group => group.count > 0);

  const getLoanIcon = (loanType: string) => {
    const type = (loanType || '').toLowerCase();
    if (type === 'home') return 'home';
    if (type === 'car') return 'truck';
    if (type === 'education') return 'book-open';
    if (type === 'personal') return 'user';
    return 'trending-down';
  };


  const getLoanTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'home': return 'Home Loan';
      case 'car': return 'Car Loan';
      case 'education': return 'Education Loan';
      case 'personal': return 'Personal Loan';
      case 'other': return 'Other Loans';
      default: return 'Other Loans';
    }
  };



  const renderLiabilitiesOverview = () => (
    <View style={styles.overviewCard}>
      <View style={styles.overviewHeader}>
        <Feather name="alert-triangle" size={24} color={Colors.error.main} />
        <Text style={styles.overviewTitle}>Total Liabilities</Text>
      </View>
      <Text style={[styles.overviewAmount, { color: Colors.error.main }]}>
        {formatCurrency(totalLiabilities, 'INR')}
      </Text>
      <Text style={styles.overviewSubtext}>
        Monthly payments: {formatCurrency(monthlyPayments, 'INR')}
      </Text>
    </View>
  );

  const renderLiabilitiesBreakdown = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Liabilities Breakdown</Text>
      
      <View style={styles.breakdownCard}>
        {/* Individual loan types as separate rows */}
        {loanBreakdown.map((group, index) => (
          <React.Fragment key={group.type}>
            <TouchableOpacity 
              style={styles.breakdownItem}
              onPress={() => router.push('/loans')}
            >
              <View style={styles.breakdownLeft}>
                <Feather name={getLoanIcon(group.type) as any} size={20} color={Colors.warning.main} />
                <View style={styles.breakdownDetails}>
                  <Text style={styles.breakdownLabel}>{group.label}</Text>
                  <Text style={styles.breakdownSubtext}>
                    {group.count} {group.count === 1 ? 'account' : 'accounts'}
                  </Text>
                </View>
              </View>
              <View style={styles.breakdownRight}>
                <Text style={[styles.breakdownAmount, { color: Colors.error.main }]}>
                  {formatCurrency(group.total, 'INR')}
                </Text>
                <Feather name="chevron-right" size={16} color={Colors.text.secondary} />
              </View>
            </TouchableOpacity>

            {/* Individual loan details under each type */}
            {group.items.length > 0 && (
              <View style={styles.smallBreakdown}>
                {group.items.map((loan: any, idx: number) => {
                  const lenderName = loan?.bank || 'Lender';
                  const last4 = String(loan?.loanNumber || '').slice(-4) || 'XXXX';
                  const balance = loan?.currentBalance?.amount ?? 0;
                  return (
                    <View key={idx} style={styles.rowJustify}>
                      <Text style={styles.smallLeft}>
                        {lenderName} ****{last4}
                      </Text>
                      <Text style={styles.smallRight}>{formatCurrency(balance, 'INR')}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Add separator between loan types (but not after last) */}
            {index < loanBreakdown.length - 1 && <View style={styles.separator} />}
          </React.Fragment>
        ))}

        {/* Add separator before credit cards if loans exist */}
        {loanBreakdown.length > 0 && <View style={styles.separator} />}

        {/* Credit Cards */}
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
              {formatCurrency(totalCreditCards, 'INR')}
            </Text>
            <Feather name="chevron-right" size={16} color={Colors.text.secondary} />
          </View>
        </TouchableOpacity>

        {/* Credit card breakdown */}
        {creditCardBreakdown.length > 0 && (
          <View style={styles.smallBreakdown}>
            {creditCardBreakdown.map((cc, idx) => (
              <View key={idx} style={styles.rowJustify}>
                <Text style={styles.smallLeft}>{cc.bank} ****{cc.last4}</Text>
                <Text style={styles.smallRight}>{formatCurrency(cc.amount, 'INR')}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  const renderDebtMetrics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Debt Analysis</Text>
      
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: Colors.error.main }]}>
            {(debtToIncomeRatio * 100).toFixed(1)}%
          </Text>
          <Text style={styles.metricLabel}>Debt-to-Income</Text>
          <Text style={[styles.metricStatus, { 
            color: debtToIncomeRatio < 0.3 ? Colors.success.main : debtToIncomeRatio < 0.5 ? Colors.warning.main : Colors.error.main 
          }]}>
            {debtToIncomeRatio < 0.3 ? 'Healthy' : debtToIncomeRatio < 0.5 ? 'Moderate' : 'High'}
          </Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: Colors.error.main }]}>
            {formatCurrency(monthlyPayments, 'INR')}
          </Text>
          <Text style={styles.metricLabel}>Monthly Payments</Text>
          <Text style={styles.metricStatus}>
            EMIs + Min CC payments
          </Text>
        </View>
      </View>

      <View style={styles.recommendationCard}>
        <Feather name="trending-up" size={20} color={
          debtToIncomeRatio < 0.3 ? Colors.success.main : Colors.warning.main
        } />
        <View style={styles.recommendationText}>
          <Text style={styles.recommendationTitle}>
            {debtToIncomeRatio < 0.3 ? 'Good Debt Management' : 'Monitor Debt Levels'}
          </Text>
          <Text style={styles.recommendationDescription}>
            {debtToIncomeRatio < 0.3
              ? 'Your debt-to-income ratio is healthy. Consider paying extra on high-interest debts.'
              : 'Focus on reducing high-interest debt first. Consider debt consolidation if beneficial.'
            }
          </Text>
        </View>
      </View>
    </View>
  );

  const renderUpcomingPayments = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Upcoming Payments (Next 3 Months)</Text>
      
      <View style={styles.paymentsCard}>
        {upcomingPayments.length > 0 ? (
          upcomingPayments.map((payment, idx) => (
            <View key={payment.id} style={[
              styles.paymentItem,
              idx === upcomingPayments.length - 1 && { borderBottomWidth: 0 }
            ]}>
              <View style={styles.paymentLeft}>
                <View style={styles.paymentHeader}>
                  <Text style={styles.paymentName}>{payment.name}</Text>
                  <View style={[
                    styles.paymentTypeBadge, 
                    { backgroundColor: payment.type === 'loan' ? Colors.warning.light : Colors.accent + '20' }
                  ]}>
                    <Text style={[
                      styles.paymentTypeText,
                      { color: payment.type === 'loan' ? Colors.warning.dark : Colors.accent }
                    ]}>
                      {payment.type === 'loan' ? 'EMI' : 'CC'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.paymentDate}>
                  {payment.date.toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <Text style={[styles.paymentAmount, { color: Colors.error.main }]}>
                {formatCurrency(payment.amount, 'INR')}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.overviewSubtext, { textAlign: 'center', padding: 20 }]}>
            No upcoming payments scheduled
          </Text>
        )}
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
        {renderDebtMetrics()}
        {renderUpcomingPayments()}
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
  smallBreakdown: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border.light,
  },
  smallLeft: {
    fontSize: 11,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
    flex: 1,
  },
  smallRight: {
    fontSize: 11,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  rowJustify: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
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
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  paymentName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    flex: 1,
  },
  paymentTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  paymentTypeText: {
    fontSize: 9,
    fontWeight: '600',
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
    height: 100,
  },
});

export default LiabilitiesScreen;

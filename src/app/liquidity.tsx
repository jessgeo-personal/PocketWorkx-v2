// src/app/liquidity.tsx
import React, { useMemo, useState } from 'react';
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
import AppFooter from '../components/AppFooter';
import { useStorage } from '../services/storage/StorageProvider';
import { computeTotals } from '../selectors/totals';

const LiquidityScreen: React.FC = () => {
  const router = useRouter();
  const { state } = useStorage();

  const {
    totalCash,
    totalBankAccounts,
    totalLiquidity,
  } = computeTotals(state ?? undefined, { includeCryptoInLiquidity: false });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Cash breakdown by category
  const cashBreakdown = useMemo(() => {
    const entries = ((state?.cashEntries ?? []) as any[]);
    return entries.map((cash: any) => {
      const category = cash?.category || 'Cash';
      const amount = cash?.amount?.amount ?? 0;
      return { category, amount };
    });
  }, [state?.cashEntries]);

  // Bank accounts breakdown by account type and institution
  const bankBreakdown = useMemo(() => {
    const entries = ((state?.accounts ?? []) as any[]);
    const grouped: Record<string, { accounts: any[], total: number }> = {};

    entries.forEach((acc: any) => {
      const type = acc?.type || acc?.accountType || 'Savings';
      if (!grouped[type]) {
        grouped[type] = { accounts: [], total: 0 };
      }
      grouped[type].accounts.push(acc);
      grouped[type].total += acc?.balance?.amount ?? 0;
    });

    return grouped;
  }, [state?.accounts]);

  const renderLiquidityOverview = () => (
    <View style={styles.overviewCard}>
      <View style={styles.overviewHeader}>
        <Feather name="droplet" size={24} color={Colors.info.main} />
        <Text style={styles.overviewTitle}>Total Liquid Assets</Text>
      </View>
      <Text style={styles.overviewAmount}>
        {formatCurrency(totalLiquidity, 'INR')}
      </Text>
      <Text style={styles.overviewSubtext}>Cash + Bank accounts (immediate access)</Text>
    </View>
  );

  const renderLiquidityBreakdown = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Liquidity Breakdown</Text>
      
      {/* Cash */}
      <TouchableOpacity 
        style={styles.breakdownCard}
        onPress={() => router.push('/cash')}
        activeOpacity={0.9}
      >
        <View style={styles.breakdownItem}>
          <View style={styles.breakdownLeft}>
            <Feather name="dollar-sign" size={20} color={Colors.success.main} />
            <View style={styles.breakdownDetails}>
              <Text style={styles.breakdownLabel}>Cash</Text>
              <Text style={styles.breakdownSubtext}>Physical cash in hand</Text>
            </View>
          </View>
          <View style={styles.breakdownRight}>
            <Text style={styles.breakdownAmount}>
              {formatCurrency(totalCash, 'INR')}
            </Text>
            <Feather name="chevron-right" size={16} color={Colors.text.secondary} />
          </View>
        </View>
        
        {/* Cash category breakdown */}
        {cashBreakdown.length > 0 && (
          <View style={styles.smallBreakdown}>
            {cashBreakdown.map((item, idx) => (
              <Text key={idx} style={styles.smallBreakdownText}>
                {item.category}: {formatCurrency(item.amount, 'INR')}
              </Text>
            ))}
          </View>
        )}
      </TouchableOpacity>

      {/* Bank Accounts */}
      <TouchableOpacity 
        style={[styles.breakdownCard, { marginTop: Spacing.md }]}
        onPress={() => router.push('/accounts')}
        activeOpacity={0.9}
      >
        <View style={styles.breakdownItem}>
          <View style={styles.breakdownLeft}>
            <Feather name="credit-card" size={20} color={Colors.info.main} />
            <View style={styles.breakdownDetails}>
              <Text style={styles.breakdownLabel}>Bank Accounts</Text>
              <Text style={styles.breakdownSubtext}>Savings & checking accounts</Text>
            </View>
          </View>
          <View style={styles.breakdownRight}>
            <Text style={styles.breakdownAmount}>
              {formatCurrency(totalBankAccounts, 'INR')}
            </Text>
            <Feather name="chevron-right" size={16} color={Colors.text.secondary} />
          </View>
        </View>

        {/* Bank accounts breakdown by type */}
        <View style={styles.smallBreakdown}>
          {Object.entries(bankBreakdown).map(([accountType, group]) => (
            <View key={accountType} style={{ marginBottom: 4 }}>
              <Text style={[styles.smallBreakdownText, { fontWeight: '600', color: Colors.text.secondary }]}>
                {accountType} ({group.total > 0 ? formatCurrency(group.total, 'INR') : '₹0'})
              </Text>
              {group.accounts.map((acc: any, idx: number) => {
                const bank = acc?.bank || acc?.bankName || acc?.institution || 'Bank';
                const acctRaw = String(acc?.accountNumber || acc?.number || '');
                const last4 = acctRaw.replace(/\D/g, '').slice(-4) || 'XXXX';
                const balance = acc?.balance?.amount ?? 0;
                return (
                  <Text key={idx} style={[styles.smallBreakdownText, { marginLeft: 8 }]}>
                    {bank} ****{last4}: {formatCurrency(balance, 'INR')}
                  </Text>
                );
              })}
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderLiquidityMetrics = () => {
    // Calculate liquidity metrics from real data
    const liquidityRatio = useMemo(() => {
      // Simple ratio: how much liquid assets vs minimum recommended (₹1L)
      const minRecommended = 100000;
      return totalLiquidity > 0 ? (totalLiquidity / minRecommended).toFixed(1) : '0.0';
    }, [totalLiquidity]);

    const emergencyFundCoverage = useMemo(() => {
      // Approximate months of coverage assuming ₹50K monthly expenses
      const assumedMonthlyExpenses = 50000;
      return Math.max(0, Math.round(totalLiquidity / assumedMonthlyExpenses));
    }, [totalLiquidity]);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Liquidity Analysis</Text>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{liquidityRatio}x</Text>
            <Text style={styles.metricLabel}>Liquidity Ratio</Text>
            <Text style={[styles.metricStatus, { color: totalLiquidity > 100000 ? Colors.success.main : Colors.warning.main }]}>
              {totalLiquidity > 100000 ? 'Good' : 'Build up'}
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{emergencyFundCoverage}</Text>
            <Text style={styles.metricLabel}>Emergency Fund</Text>
            <Text style={styles.metricStatus}>
              {emergencyFundCoverage} months coverage
            </Text>
          </View>
        </View>

        <View style={styles.recommendationCard}>
          <Feather name="alert-circle" size={20} color={Colors.warning.main} />
          <View style={styles.recommendationText}>
            <Text style={styles.recommendationTitle}>Liquidity Recommendation</Text>
            <Text style={styles.recommendationDescription}>
              {totalLiquidity < 300000 
                ? 'Build emergency fund to 6 months of expenses. Keep liquid assets readily available.'
                : totalLiquidity > 1000000
                ? 'Strong liquidity position. Consider investing excess in market investments.'
                : 'Good liquidity balance. Monitor monthly expenses and adjust as needed.'
              }
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenLayout>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderLiquidityOverview()}
        {renderLiquidityBreakdown()}
        {renderLiquidityMetrics()}
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
    color: Colors.text.primary,
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
  breakdownAmount: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.info.main,
  },
  breakdownRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  smallBreakdown: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border.light,
  },
  smallBreakdownText: {
    fontSize: 11,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
    marginBottom: 2,
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
    color: Colors.info.main,
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
    backgroundColor: Colors.warning.light,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning.main,
  },
  recommendationText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  recommendationTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.warning.dark,
    marginBottom: Spacing.xs,
  },
  recommendationDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.warning.dark,
    lineHeight: Typography.lineHeight.xs,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default LiquidityScreen;

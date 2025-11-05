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

  // Cash grouped by cashCategory (Wallet, Home Safe, Loose change (car), etc.)
  const cashGrouped = useMemo(() => {
    const entries = ((state?.cashEntries ?? []) as any[]);
    const group: Record<string, number> = {};
    entries.forEach((c: any) => {
      const key = c?.cashCategory || 'Uncategorized';
      const amt = c?.amount?.amount ?? 0;
      group[key] = (group[key] ?? 0) + amt;
    });
    // Sort by category name alphabetically
    return Object.entries(group)
      .sort(([a], [b]) => a.localeCompare(b))
      .filter(([, amt]) => amt !== 0); // Only show categories with balance
  }, [state?.cashEntries]);

  // Bank accounts grouped by type, with each type listing right-justified accounts
  const bankGrouped = useMemo(() => {
    const accounts = ((state?.accounts ?? []) as any[]);
    const group: Record<string, { label: string; items: Array<{ bank: string; last4: string; amount: number }> }> = {};

    const toLast4 = (s: string) => (s || '').replace(/\D/g, '').slice(-4) || 'XXXX';

    accounts.forEach((acc: any) => {
      const type = acc?.type || acc?.accountType || 'Savings';
      const bank = acc?.bank || acc?.bankName || acc?.institution || 'Bank';
      const raw = String(acc?.accountNumber || acc?.number || acc?.iban || acc?.maskedNumber || '');
      const last4 = toLast4(raw);
      const amount = acc?.balance?.amount ?? 0;

      if (!group[type]) {
        group[type] = { label: type, items: [] };
      }
      group[type].items.push({ bank, last4, amount });
    });

    // Sort groups alphabetically; inside group sort amounts desc
    return Object.entries(group)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([type, data]) => ({
        type,
        label: data.label,
        total: data.items.reduce((s, x) => s + (x.amount || 0), 0),
        items: data.items.sort((a, b) => (b.amount || 0) - (a.amount || 0)),
      }))
      .filter(grp => grp.total !== 0); // Only show types with balance
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
        {cashGrouped.length > 0 && (
          <View style={styles.smallBreakdown}>
            {cashGrouped.map(([categoryName, amount]) => (
              <View key={categoryName} style={styles.rowJustify}>
                <Text style={styles.smallLeft}>{categoryName}</Text>
                <Text style={styles.smallRight}>{formatCurrency(amount, 'INR')}</Text>
              </View>
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

        {/* Bank grouped by type, with right-justified accounts */}
        {bankGrouped.length > 0 && (
          <View style={styles.smallBreakdown}>
            {bankGrouped.map((grp) => (
              <View key={grp.type} style={{ marginBottom: 6 }}>
                <View style={styles.rowJustify}>
                  <Text style={[styles.smallLeft, styles.groupHeading]}>{grp.label}</Text>
                  <Text style={[styles.smallRight, styles.groupHeading]}>{formatCurrency(grp.total, 'INR')}</Text>
                </View>
                {grp.items.map((acc, idx) => (
                  <View key={`${grp.type}-${idx}`} style={styles.rowJustify}>
                    <Text style={styles.smallLeft}>
                      {acc.bank} • ****{acc.last4}
                    </Text>
                    <Text style={styles.smallRight}>{formatCurrency(acc.amount, 'INR')}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderLiquidityMetrics = () => {
    // Data-driven liquidity metrics
    const liquidityRatio = useMemo(() => {
      const baseline = 100000; // ₹1 lakh reference
      return totalLiquidity > 0 ? (totalLiquidity / baseline).toFixed(1) : '0.0';
    }, [totalLiquidity]);

    const emergencyFundCoverage = useMemo(() => {
      // Assume ₹50K monthly expenses for indicative coverage
      const monthlyExpenseEstimate = 50000;
      return Math.max(0, Math.round(totalLiquidity / monthlyExpenseEstimate));
    }, [totalLiquidity]);

    const liquidityStatus = totalLiquidity >= 300000 ? 'Healthy' : totalLiquidity >= 150000 ? 'Fair' : 'Build buffer';
    const statusColor = totalLiquidity >= 300000 ? Colors.success.main : totalLiquidity >= 150000 ? Colors.warning.main : Colors.error.main;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Liquidity Analysis</Text>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{liquidityRatio}x</Text>
            <Text style={styles.metricLabel}>Liquidity Ratio</Text>
            <Text style={[styles.metricStatus, { color: statusColor }]}>
              {liquidityStatus}
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
              {totalLiquidity < 200000 
                ? 'Build emergency fund to 6 months of expenses in liquid assets (cash + bank).'
                : totalLiquidity > 800000
                ? 'Strong liquidity position. Consider time-bound deposits for excess funds.'
                : 'Good liquidity balance. Monitor monthly cash flow and adjust as needed.'
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
  groupHeading: {
    fontStyle: 'normal',
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  rowJustify: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

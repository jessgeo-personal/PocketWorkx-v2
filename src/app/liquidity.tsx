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
    totalFixedIncome,
    totalFixedIncomeByCurrency,
    totalMarketInvestments,
    totalLiquidity,
  } = computeTotals(state ?? undefined, { includeCryptoInLiquidity: false });

  // For now, treat "short-term investments" as Fixed Income INR (guaranteed deposits).
  // In a future phase, we can filter non-auto-renew FDs or liquid MFs separately.
  const shortTermInvestmentsINR = totalFixedIncome;
  const shortTermInvestmentsFX = Object.entries(totalFixedIncomeByCurrency)
    .filter(([c]) => c !== 'INR')
    .reduce((sum, [, amt]) => sum + (amt || 0), 0);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderLiquidityOverview = () => (
    <View style={styles.overviewCard}>
      <View style={styles.overviewHeader}>
        <Feather name="droplet" size={24} color={Colors.info.main} />
        <Text style={styles.overviewTitle}>Total Liquid Assets</Text>
      </View>
      <Text style={styles.overviewAmount}>
        {formatCurrency(totalLiquidity, 'INR')}
      </Text>
      <Text style={styles.overviewSubtext}>Ready for immediate use</Text>
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
      </TouchableOpacity>

      {/* Short-term Investments (Fixed Income) */}
      <TouchableOpacity 
        style={[styles.breakdownCard, { marginTop: Spacing.md }]}
        onPress={() => router.push('/fixed-income')}
        activeOpacity={0.9}
      >
        <View style={styles.breakdownItem}>
          <View style={styles.breakdownLeft}>
            <Feather name="trending-up" size={20} color={Colors.warning.main} />
            <View style={styles.breakdownDetails}>
              <Text style={styles.breakdownLabel}>Short-term Deposits</Text>
              <Text style={styles.breakdownSubtext}>
                INR FDs/RDs + NRE/FCNR + Company Deposits
              </Text>
            </View>
          </View>
          <View style={styles.breakdownRight}>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.breakdownAmount}>
                {formatCurrency(shortTermInvestmentsINR, 'INR')}
              </Text>
              {shortTermInvestmentsFX > 0 && (
                <Text style={[styles.breakdownSubtext, { marginTop: 2 }]}>
                  {Object.entries(totalFixedIncomeByCurrency)
                    .filter(([curr]) => curr !== 'INR')
                    .map(([curr, amount]) => {
                      const sym = curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr;
                      return `${sym} ${amount.toLocaleString()}`;
                    })
                    .join(' • ')}
                </Text>
              )}
            </View>
            <Feather name="chevron-right" size={16} color={Colors.text.secondary} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderLiquidityMetrics = () => {
    // Placeholder metrics until we compute from real expenses/income datasets
    const liquidityRatio = useMemo(() => {
      // Future: (Current Assets / Current Liabilities)
      // For now, approximate as (cash + bank + INR fixed income) / (1) to just display numbers
      const numerator = totalCash + totalBankAccounts + shortTermInvestmentsINR;
      return numerator > 0 ? (numerator / Math.max(1, numerator)).toFixed(1) : '0.0';
    }, [totalCash, totalBankAccounts, shortTermInvestmentsINR]);

    const emergencyFundCoverage = useMemo(() => {
      // Future: months of coverage = totalLiquidity / averageMonthlyExpenses
      // For now, show a placeholder based on scale
      const months = Math.max(1, Math.round((totalLiquidity || 0) / 100000));
      return months;
    }, [totalLiquidity]);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Liquidity Metrics</Text>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{liquidityRatio}</Text>
            <Text style={styles.metricLabel}>Liquidity Ratio</Text>
            <Text style={[styles.metricStatus, { color: Colors.success.main }]}>Indicative</Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{emergencyFundCoverage}</Text>
            <Text style={styles.metricLabel}>Emergency Fund</Text>
            <Text style={styles.metricStatus}>{emergencyFundCoverage} months coverage (approx)</Text>
          </View>
        </View>

        <View style={styles.recommendationCard}>
          <Feather name="alert-circle" size={20} color={Colors.warning.main} />
          <View style={styles.recommendationText}>
            <Text style={styles.recommendationTitle}>Recommendation</Text>
            <Text style={styles.recommendationDescription}>
              Keep at least 6 months of expenses in liquid assets. Shift excess into market investments for better returns.
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
    height: 100, // Space for bottom menu
  },
  breakdownRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});

export default LiquidityScreen;

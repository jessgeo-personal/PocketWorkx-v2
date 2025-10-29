// src/app/liquidity.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../utils/theme';
import { formatCurrency } from '../utils/currency';

interface LiquidityData {
  totalLiquidAssets: number;
  cash: number;
  bankAccounts: number;
  shortTermInvestments: number;
  liquidCrypto: number;
  liquidityRatio: number;
  emergencyFundCoverage: number;
}

const LiquidityScreen: React.FC = () => {
  const [liquidityData, setLiquidityData] = useState<LiquidityData>({
    totalLiquidAssets: 4567800,
    cash: 93500,
    bankAccounts: 2845600,
    shortTermInvestments: 1628700,
    liquidCrypto: 0, // Coming soon
    liquidityRatio: 2.8,
    emergencyFundCoverage: 8.5,
  });
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const renderLiquidityOverview = () => (
    <View style={styles.overviewCard}>
      <View style={styles.overviewHeader}>
        <Feather name="droplet" size={24} color={Colors.info.main} />
        <Text style={styles.overviewTitle}>Total Liquid Assets</Text>
      </View>
      <Text style={styles.overviewAmount}>
        {formatCurrency(liquidityData.totalLiquidAssets, 'INR')}
      </Text>
      <Text style={styles.overviewSubtext}>Ready for immediate use</Text>
    </View>
  );

  const renderLiquidityBreakdown = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Liquidity Breakdown</Text>
      
      <View style={styles.breakdownCard}>
        <View style={styles.breakdownItem}>
          <View style={styles.breakdownLeft}>
            <Feather name="dollar-sign" size={20} color={Colors.success.main} />
            <View style={styles.breakdownDetails}>
              <Text style={styles.breakdownLabel}>Cash</Text>
              <Text style={styles.breakdownSubtext}>Physical cash in hand</Text>
            </View>
          </View>
          <Text style={styles.breakdownAmount}>
            {formatCurrency(liquidityData.cash, 'INR')}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.breakdownItem}>
          <View style={styles.breakdownLeft}>
            <Feather name="credit-card" size={20} color={Colors.info.main} />
            <View style={styles.breakdownDetails}>
              <Text style={styles.breakdownLabel}>Bank Accounts</Text>
              <Text style={styles.breakdownSubtext}>Savings & checking accounts</Text>
            </View>
          </View>
          <Text style={styles.breakdownAmount}>
            {formatCurrency(liquidityData.bankAccounts, 'INR')}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.breakdownItem}>
          <View style={styles.breakdownLeft}>
            <Feather name="trending-up" size={20} color={Colors.warning.main} />
            <View style={styles.breakdownDetails}>
              <Text style={styles.breakdownLabel}>Short-term Investments</Text>
              <Text style={styles.breakdownSubtext}>Liquid mutual funds, FDs</Text>
            </View>
          </View>
          <Text style={styles.breakdownAmount}>
            {formatCurrency(liquidityData.shortTermInvestments, 'INR')}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderLiquidityMetrics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Liquidity Metrics</Text>
      
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{liquidityData.liquidityRatio}</Text>
          <Text style={styles.metricLabel}>Liquidity Ratio</Text>
          <Text style={[styles.metricStatus, { color: Colors.success.main }]}>Excellent</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{liquidityData.emergencyFundCoverage}</Text>
          <Text style={styles.metricLabel}>Emergency Fund</Text>
          <Text style={styles.metricStatus}>{liquidityData.emergencyFundCoverage} months coverage</Text>
        </View>
      </View>

      <View style={styles.recommendationCard}>
        <Feather name="alert-circle" size={20} color={Colors.warning.main} />
        <View style={styles.recommendationText}>
          <Text style={styles.recommendationTitle}>Recommendation</Text>
          <Text style={styles.recommendationDescription}>
            Your liquidity position is excellent. Consider investing excess cash in medium-term assets for better returns.
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
        {renderLiquidityOverview()}
        {renderLiquidityBreakdown()}
        {renderLiquidityMetrics()}
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
  separator: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.sm,
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
});

export default LiquidityScreen;
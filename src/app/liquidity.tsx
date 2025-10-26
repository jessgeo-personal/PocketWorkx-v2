// src/app/liquidity.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenLayout from '../components/ScreenLayout';

const LiquidityScreen: React.FC = () => {
  const liquidityData = {
    totalLiquidAssets: 4567800,
    cash: 93500,
    bankAccounts: 2845600,
    shortTermInvestments: 1628700,
    liquidityRatio: 2.8,
    emergencyFundCoverage: 8.5, // months
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Liquidity Analysis</Text>
      <MaterialIcons name="water-drop" size={24} color="#03DAC6" />
    </View>
  );

  const renderLiquidityOverview = () => (
    <LinearGradient
      colors={['#00BCD4', '#26C6DA']}
      style={styles.overviewCard}
    >
      <Text style={styles.overviewLabel}>Total Liquid Assets</Text>
      <Text style={styles.overviewAmount}>₹{(liquidityData.totalLiquidAssets / 100000).toFixed(2)} L</Text>
      <Text style={styles.overviewSubtext}>Ready for immediate use</Text>
    </LinearGradient>
  );

  const renderLiquidityBreakdown = () => (
    <View style={styles.breakdownContainer}>
      <Text style={styles.sectionTitle}>Liquidity Breakdown</Text>
      
      <View style={styles.breakdownItem}>
        <View style={styles.breakdownLeft}>
          <MaterialIcons name="account-balance-wallet" size={24} color="#4CAF50" />
          <View style={styles.breakdownDetails}>
            <Text style={styles.breakdownLabel}>Cash</Text>
            <Text style={styles.breakdownSubtext}>Physical cash in hand</Text>
          </View>
        </View>
        <Text style={styles.breakdownAmount}>₹{(liquidityData.cash / 1000).toFixed(0)}K</Text>
      </View>

      <View style={styles.breakdownItem}>
        <View style={styles.breakdownLeft}>
          <MaterialIcons name="account-balance" size={24} color="#2196F3" />
          <View style={styles.breakdownDetails}>
            <Text style={styles.breakdownLabel}>Bank Accounts</Text>
            <Text style={styles.breakdownSubtext}>Savings & checking accounts</Text>
          </View>
        </View>
        <Text style={styles.breakdownAmount}>₹{(liquidityData.bankAccounts / 100000).toFixed(2)} L</Text>
      </View>

      <View style={styles.breakdownItem}>
        <View style={styles.breakdownLeft}>
          <MaterialIcons name="timeline" size={24} color="#FF9800" />
          <View style={styles.breakdownDetails}>
            <Text style={styles.breakdownLabel}>Short-term Investments</Text>
            <Text style={styles.breakdownSubtext}>Liquid mutual funds, FDs</Text>
          </View>
        </View>
        <Text style={styles.breakdownAmount}>₹{(liquidityData.shortTermInvestments / 100000).toFixed(2)} L</Text>
      </View>
    </View>
  );

  const renderLiquidityMetrics = () => (
    <View style={styles.metricsContainer}>
      <Text style={styles.sectionTitle}>Liquidity Metrics</Text>
      
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{liquidityData.liquidityRatio}</Text>
          <Text style={styles.metricLabel}>Liquidity Ratio</Text>
          <Text style={styles.metricStatus}>Excellent</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{liquidityData.emergencyFundCoverage}</Text>
          <Text style={styles.metricLabel}>Emergency Fund</Text>
          <Text style={styles.metricStatus}>8.5 months coverage</Text>
        </View>
      </View>

      <View style={styles.recommendationCard}>
        <MaterialIcons name="lightbulb" size={20} color="#FF9800" />
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
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {renderHeader()}
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderLiquidityOverview()}
          {renderLiquidityBreakdown()}
          {renderLiquidityMetrics()}
        </ScrollView>
      </SafeAreaView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  overviewCard: {
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 24,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  overviewLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  overviewAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  overviewSubtext: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  breakdownContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breakdownDetails: {
    marginLeft: 12,
  },
  breakdownLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  breakdownSubtext: {
    fontSize: 12,
    color: '#666666',
  },
  breakdownAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00BCD4',
  },
  metricsContainer: {
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#00BCD4',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  metricStatus: {
    fontSize: 12,
    color: '#27AE60',
    fontWeight: '500',
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  recommendationText: {
    marginLeft: 12,
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 4,
  },
  recommendationDescription: {
    fontSize: 12,
    color: '#BF360C',
    lineHeight: 16,
  },
});

export default LiquidityScreen;
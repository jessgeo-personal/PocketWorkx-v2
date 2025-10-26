// src/app/liabilities.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenLayout from '../components/ScreenLayout';

const LiabilitiesScreen: React.FC = () => {
  const liabilitiesData = {
    totalLiabilities: 7500550,
    loans: 4225000,
    creditCards: 252000,
    mortgages: 3750000,
    otherDebts: 273550,
    debtToIncomeRatio: 0.28,
    monthlyPayments: 66500,
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Liabilities</Text>
      <MaterialIcons name="remove-circle" size={24} color="#E74C3C" />
    </View>
  );

  const renderLiabilitiesOverview = () => (
    <LinearGradient
      colors={['#E74C3C', '#C0392B']}
      style={styles.overviewCard}
    >
      <Text style={styles.overviewLabel}>Total Liabilities</Text>
      <Text style={styles.overviewAmount}>₹{(liabilitiesData.totalLiabilities / 100000).toFixed(2)} L</Text>
      <Text style={styles.overviewSubtext}>Monthly payments: ₹{(liabilitiesData.monthlyPayments / 1000).toFixed(0)}K</Text>
    </LinearGradient>
  );

  const renderLiabilitiesBreakdown = () => (
    <View style={styles.breakdownContainer}>
      <Text style={styles.sectionTitle}>Liabilities Breakdown</Text>
      
      <TouchableOpacity style={styles.breakdownItem}>
        <View style={styles.breakdownLeft}>
          <MaterialIcons name="home" size={24} color="#4CAF50" />
          <View style={styles.breakdownDetails}>
            <Text style={styles.breakdownLabel}>Home Loans</Text>
            <Text style={styles.breakdownSubtext}>Mortgage & property loans</Text>
          </View>
        </View>
        <View style={styles.breakdownRight}>
          <Text style={styles.breakdownAmount}>₹{(liabilitiesData.mortgages / 100000).toFixed(2)} L</Text>
          <MaterialIcons name="chevron-right" size={20} color="#666" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.breakdownItem}>
        <View style={styles.breakdownLeft}>
          <MaterialIcons name="trending-down" size={24} color="#FF9800" />
          <View style={styles.breakdownDetails}>
            <Text style={styles.breakdownLabel}>Personal Loans</Text>
            <Text style={styles.breakdownSubtext}>Car, personal & business loans</Text>
          </View>
        </View>
        <View style={styles.breakdownRight}>
          <Text style={styles.breakdownAmount}>₹{(liabilitiesData.loans / 100000).toFixed(2)} L</Text>
          <MaterialIcons name="chevron-right" size={20} color="#666" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.breakdownItem}>
        <View style={styles.breakdownLeft}>
          <MaterialIcons name="credit-card" size={24} color="#9C27B0" />
          <View style={styles.breakdownDetails}>
            <Text style={styles.breakdownLabel}>Credit Cards</Text>
            <Text style={styles.breakdownSubtext}>Outstanding balances</Text>
          </View>
        </View>
        <View style={styles.breakdownRight}>
          <Text style={styles.breakdownAmount}>₹{(liabilitiesData.creditCards / 1000).toFixed(0)}K</Text>
          <MaterialIcons name="chevron-right" size={20} color="#666" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.breakdownItem}>
        <View style={styles.breakdownLeft}>
          <MaterialIcons name="more-horiz" size={24} color="#607D8B" />
          <View style={styles.breakdownDetails}>
            <Text style={styles.breakdownLabel}>Other Debts</Text>
            <Text style={styles.breakdownSubtext}>Miscellaneous liabilities</Text>
          </View>
        </View>
        <View style={styles.breakdownRight}>
          <Text style={styles.breakdownAmount}>₹{(liabilitiesData.otherDebts / 1000).toFixed(0)}K</Text>
          <MaterialIcons name="chevron-right" size={20} color="#666" />
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderDebtMetrics = () => (
    <View style={styles.metricsContainer}>
      <Text style={styles.sectionTitle}>Debt Analysis</Text>
      
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{(liabilitiesData.debtToIncomeRatio * 100).toFixed(1)}%</Text>
          <Text style={styles.metricLabel}>Debt-to-Income</Text>
          <Text style={[styles.metricStatus, { color: '#27AE60' }]}>Healthy</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>₹{(liabilitiesData.monthlyPayments / 1000).toFixed(0)}K</Text>
          <Text style={styles.metricLabel}>Monthly Payments</Text>
          <Text style={styles.metricStatus}>{((liabilitiesData.monthlyPayments / 245000) * 100).toFixed(0)}% of income</Text>
        </View>
      </View>

      <View style={styles.recommendationCard}>
        <MaterialIcons name="trending-up" size={20} color="#27AE60" />
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
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {renderHeader()}
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderLiabilitiesOverview()}
          {renderLiabilitiesBreakdown()}
          {renderDebtMetrics()}
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
    flex: 1,
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
  breakdownRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E74C3C',
    marginRight: 8,
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
    color: '#E74C3C',
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
    color: '#666666',
    fontWeight: '500',
    textAlign: 'center',
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#27AE60',
  },
  recommendationText: {
    marginLeft: 12,
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 4,
  },
  recommendationDescription: {
    fontSize: 12,
    color: '#2E7D32',
    lineHeight: 16,
  },
});

export { LiabilitiesScreen as default };
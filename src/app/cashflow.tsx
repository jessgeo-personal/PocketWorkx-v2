// src/app/cashflow.tsx
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

const CashflowScreen: React.FC = () => {
  const cashflowData = {
    currentMonth: {
      income: 245000,
      expenses: 185000,
      netFlow: 60000,
    },
    previousMonth: {
      income: 240000,
      expenses: 192000,
      netFlow: 48000,
    },
    incomeStreams: [
      { source: 'Salary', amount: 220000, type: 'regular' },
      { source: 'Freelance', amount: 15000, type: 'variable' },
      { source: 'Investment Returns', amount: 8000, type: 'passive' },
      { source: 'Rental Income', amount: 2000, type: 'passive' },
    ],
    expenseStreams: [
      { category: 'Housing', amount: 65000, type: 'fixed' },
      { category: 'Food', amount: 28000, type: 'variable' },
      { category: 'Transportation', amount: 22000, type: 'variable' },
      { category: 'Utilities', amount: 18500, type: 'fixed' },
      { category: 'Entertainment', amount: 16000, type: 'discretionary' },
      { category: 'Others', amount: 35500, type: 'variable' },
    ],
  };

  const getFlowDirection = () => {
    return cashflowData.currentMonth.netFlow > 0 ? 'positive' : 'negative';
  };

  const getFlowColor = () => {
    return cashflowData.currentMonth.netFlow > 0 ? '#27AE60' : '#E74C3C';
  };

  const getStreamTypeColor = (type: string) => {
    const colors = {
      regular: '#4CAF50',
      variable: '#FF9800',
      passive: '#2196F3',
      fixed: '#9C27B0',
      discretionary: '#FF5722',
    };
    return colors[type as keyof typeof colors] || '#666666';
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Cash Flow</Text>
      <MaterialIcons name="swap-horiz" size={24} color="#FF6F00" />
    </View>
  );

  const renderCashflowOverview = () => (
    <LinearGradient
      colors={getFlowDirection() === 'positive' ? ['#27AE60', '#2ECC71'] : ['#E74C3C', '#C0392B']}
      style={styles.overviewCard}
    >
      <Text style={styles.overviewLabel}>Net Cash Flow</Text>
      <Text style={styles.overviewAmount}>
        {getFlowDirection() === 'positive' ? '+' : '-'}₹{Math.abs(cashflowData.currentMonth.netFlow / 1000).toFixed(0)}K
      </Text>
      <Text style={styles.overviewSubtext}>This month</Text>
    </LinearGradient>
  );

  const renderFlowComparison = () => (
    <View style={styles.comparisonContainer}>
      <Text style={styles.sectionTitle}>Monthly Comparison</Text>
      
      <View style={styles.comparisonCard}>
        <View style={styles.comparisonRow}>
          <Text style={styles.comparisonLabel}>Income</Text>
          <View style={styles.comparisonValues}>
            <Text style={styles.currentValue}>₹{(cashflowData.currentMonth.income / 1000).toFixed(0)}K</Text>
            <Text style={styles.changeValue}>
              +₹{((cashflowData.currentMonth.income - cashflowData.previousMonth.income) / 1000).toFixed(0)}K
            </Text>
          </View>
        </View>
        
        <View style={styles.comparisonRow}>
          <Text style={styles.comparisonLabel}>Expenses</Text>
          <View style={styles.comparisonValues}>
            <Text style={styles.currentValue}>₹{(cashflowData.currentMonth.expenses / 1000).toFixed(0)}K</Text>
            <Text style={[styles.changeValue, { color: '#E74C3C' }]}>
              -₹{((cashflowData.previousMonth.expenses - cashflowData.currentMonth.expenses) / 1000).toFixed(0)}K
            </Text>
          </View>
        </View>
        
        <View style={[styles.comparisonRow, styles.netFlowRow]}>
          <Text style={styles.comparisonLabel}>Net Flow</Text>
          <View style={styles.comparisonValues}>
            <Text style={[styles.currentValue, { color: getFlowColor() }]}>
              ₹{(cashflowData.currentMonth.netFlow / 1000).toFixed(0)}K
            </Text>
            <Text style={[styles.changeValue, { color: '#27AE60' }]}>
              +₹{((cashflowData.currentMonth.netFlow - cashflowData.previousMonth.netFlow) / 1000).toFixed(0)}K
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderIncomeStreams = () => (
    <View style={styles.streamsContainer}>
      <Text style={styles.sectionTitle}>Income Streams</Text>
      
      {cashflowData.incomeStreams.map((stream, index) => (
        <View key={index} style={styles.streamItem}>
          <View style={styles.streamInfo}>
            <View style={[styles.streamIndicator, { backgroundColor: getStreamTypeColor(stream.type) }]} />
            <View style={styles.streamDetails}>
              <Text style={styles.streamSource}>{stream.source}</Text>
              <Text style={styles.streamType}>{stream.type.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.streamAmount}>+₹{(stream.amount / 1000).toFixed(0)}K</Text>
        </View>
      ))}
    </View>
  );

  const renderExpenseStreams = () => (
    <View style={styles.streamsContainer}>
      <Text style={styles.sectionTitle}>Expense Categories</Text>
      
      {cashflowData.expenseStreams.map((stream, index) => (
        <View key={index} style={styles.streamItem}>
          <View style={styles.streamInfo}>
            <View style={[styles.streamIndicator, { backgroundColor: getStreamTypeColor(stream.type) }]} />
            <View style={styles.streamDetails}>
              <Text style={styles.streamSource}>{stream.category}</Text>
              <Text style={styles.streamType}>{stream.type.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={[styles.streamAmount, { color: '#E74C3C' }]}>
            -₹{(stream.amount / 1000).toFixed(0)}K
          </Text>
        </View>
      ))}
    </View>
  );

  const renderCashflowTips = () => (
    <View style={styles.tipsContainer}>
      <Text style={styles.sectionTitle}>Cash Flow Tips</Text>
      
      <View style={styles.tipCard}>
        <MaterialIcons name="trending-up" size={20} color="#27AE60" />
        <View style={styles.tipText}>
          <Text style={styles.tipTitle}>Positive Trend</Text>
          <Text style={styles.tipDescription}>
            Your cash flow improved by ₹12K this month. Keep monitoring expenses.
          </Text>
        </View>
      </View>

      <View style={styles.tipCard}>
        <MaterialIcons name="schedule" size={20} color="#FF9800" />
        <View style={styles.tipText}>
          <Text style={styles.tipTitle}>Upcoming Expenses</Text>
          <Text style={styles.tipDescription}>
            Large EMI payments due next week. Ensure sufficient liquidity.
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
          {renderCashflowOverview()}
          {renderFlowComparison()}
          {renderIncomeStreams()}
          {renderExpenseStreams()}
          {renderCashflowTips()}
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
  comparisonContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  comparisonCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  netFlowRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  comparisonLabel: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  comparisonValues: {
    alignItems: 'flex-end',
  },
  currentValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  changeValue: {
    fontSize: 12,
    color: '#27AE60',
    fontWeight: '500',
  },
  streamsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  streamItem: {
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
  streamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  streamIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  streamDetails: {
    flex: 1,
  },
  streamSource: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  streamType: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '500',
  },
  streamAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#27AE60',
  },
  tipsContainer: {
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipText: {
    marginLeft: 12,
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
});

export default CashflowScreen;

// src/app/investments-receivables.tsx
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
import { router } from 'expo-router';
import ScreenLayout from '../components/ScreenLayout';


const InvestmentsReceivablesScreen: React.FC = () => {
  const summaryData = {
    totalInvestments: 7330250,
    totalReceivables: 250000,
    combinedValue: 7580250,
    monthlyReturns: 45600,
    expectedReceivables: 125000,
  };

  const quickStats = [
    {
      title: 'Mutual Funds',
      value: '₹2.06 L',
      change: '+14.6%',
      color: '#FF9800',
    },
    {
      title: 'Stocks',
      value: '₹1.43 L',
      change: '+5.8%',
      color: '#2196F3',
    },
    {
      title: 'Fixed Deposits',
      value: '₹2.88 L',
      change: '+6.8%',
      color: '#4CAF50',
    },
    {
      title: 'Receivables',
      value: '₹2.50 L',
      change: 'Pending',
      color: '#009688',
    },
  ];

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Investments & Receivables</Text>
      <MaterialIcons name="pie-chart" size={24} color="#8BC34A" />
    </View>
  );

  const renderOverviewCard = () => (
    <LinearGradient
      colors={['#8BC34A', '#9CCC65']}
      style={styles.overviewCard}
    >
      <Text style={styles.overviewLabel}>Total Portfolio Value</Text>
      <Text style={styles.overviewAmount}>
        ₹{(summaryData.combinedValue / 100000).toFixed(2)} L
      </Text>
      <Text style={styles.overviewSubtext}>
        Investments + Receivables
      </Text>
    </LinearGradient>
  );

  const renderQuickStats = () => (
    <View style={styles.quickStatsContainer}>
      <Text style={styles.sectionTitle}>Quick Overview</Text>
      <View style={styles.statsGrid}>
        {quickStats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.statIndicator, { backgroundColor: stat.color }]} />
            <Text style={styles.statTitle}>{stat.title}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={[
              styles.statChange,
              { color: stat.change.includes('%') ? '#27AE60' : '#666666' }
            ]}>
              {stat.change}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.actionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      
      <View style={styles.actionGrid}>
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/investments')}
        >
          <MaterialIcons name="trending-up" size={32} color="#FF5722" />
          <Text style={styles.actionTitle}>View Investments</Text>
          <Text style={styles.actionSubtext}>Portfolio details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/receivables')}
        >
          <MaterialIcons name="receipt" size={32} color="#009688" />
          <Text style={styles.actionTitle}>View Receivables</Text>
          <Text style={styles.actionSubtext}>Money owed</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionGrid}>
        <TouchableOpacity style={styles.actionCard}>
          <MaterialIcons name="add-circle" size={32} color="#4CAF50" />
          <Text style={styles.actionTitle}>Add Investment</Text>
          <Text style={styles.actionSubtext}>New position</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard}>
          <MaterialIcons name="schedule" size={32} color="#FF9800" />
          <Text style={styles.actionTitle}>Set Reminder</Text>
          <Text style={styles.actionSubtext}>Payment due</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecentActivity = () => (
    <View style={styles.activityContainer}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      
      <View style={styles.activityItem}>
        <MaterialIcons name="trending-up" size={20} color="#27AE60" />
        <View style={styles.activityDetails}>
          <Text style={styles.activityTitle}>SBI Blue Chip Fund</Text>
          <Text style={styles.activitySubtext}>Investment return +₹8,250</Text>
        </View>
        <Text style={styles.activityTime}>2h ago</Text>
      </View>

      <View style={styles.activityItem}>
        <MaterialIcons name="receipt" size={20} color="#009688" />
        <View style={styles.activityDetails}>
          <Text style={styles.activityTitle}>Rajesh Kumar</Text>
          <Text style={styles.activitySubtext}>Receivable reminder sent</Text>
        </View>
        <Text style={styles.activityTime}>1d ago</Text>
      </View>

      <View style={styles.activityItem}>
        <MaterialIcons name="add-circle" size={20} color="#2196F3" />
        <View style={styles.activityDetails}>
          <Text style={styles.activityTitle}>New Investment</Text>
          <Text style={styles.activitySubtext}>Added Reliance shares</Text>
        </View>
        <Text style={styles.activityTime}>3d ago</Text>
      </View>
    </View>
  );

  return (
    <ScreenLayout>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {renderHeader()}
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderOverviewCard()}
          {renderQuickStats()}
          {renderQuickActions()}
          {renderRecentActivity()}
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
    fontSize: 20,
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
  quickStatsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
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
  statIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  statChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 20,
    borderRadius: 12,
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
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 8,
    marginBottom: 2,
    textAlign: 'center',
  },
  actionSubtext: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  activityContainer: {
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  activityDetails: {
    marginLeft: 12,
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  activitySubtext: {
    fontSize: 12,
    color: '#666666',
  },
  activityTime: {
    fontSize: 12,
    color: '#999999',
  },
});

export { InvestmentsReceivablesScreen as default };
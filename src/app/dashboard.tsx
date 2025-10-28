// src/app/dashboard.tsx
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ScreenLayout from '../components/ScreenLayout';
import { Colors } from '../utils/theme';
import { formatCompactCurrency } from '../utils/currency';

// Import dashboard widgets
import WelcomeHeader from '../components/dashboard/WelcomeHeader';
import SummaryCard from '../components/dashboard/SummaryCard';
import LatestTransactions, { Txn } from '../components/dashboard/LatestTransactions';
import QuickActions from '../components/dashboard/QuickActions';

export default function DashboardScreen() {
  // Demo financial data - replace with live calculations from services later
  const liquidCashINR = 2345300;       // ₹ 23,45,300
  const netWorthINR = 10325550;        // ₹ 1,03,25,550
  const liabilitiesINR = 7500550;      // ₹ 75,00,550
  const invAndRecvINR = 17832550;      // ₹ 1,78,32,550

  const summaryData = useMemo(() => [
    { 
      id: 's1', 
      label: 'Your liquid cash balance', 
      valueText: formatCompactCurrency(liquidCashINR, 'INR'), 
      accentColor: '#2F80ED' 
    },
    { 
      id: 's2', 
      label: 'Your total net worth', 
      valueText: formatCompactCurrency(netWorthINR, 'INR'), 
      accentColor: '#10B981' 
    },
    { 
      id: 's3', 
      label: 'Your total liabilities', 
      valueText: formatCompactCurrency(liabilitiesINR, 'INR'), 
      accentColor: '#EF4444' 
    },
    { 
      id: 's4', 
      label: 'Your Investments & receivables', 
      valueText: formatCompactCurrency(invAndRecvINR, 'INR'), 
      accentColor: '#8B5CF6' 
    },
  ], [liquidCashINR, netWorthINR, liabilitiesINR, invAndRecvINR]);

  const latestTxns: Txn[] = [
    { 
      id: 't1', 
      title: 'Borcelle Store', 
      date: 'Fri, 10 Sep 2026', 
      status: 'Success', 
      amount: -3500, 
      currency: 'INR' 
    },
    { 
      id: 't2', 
      title: 'Timmerman Industries', 
      date: 'Sat, 12 Jun 2026', 
      status: 'Success', 
      amount: -6500, 
      currency: 'INR' 
    },
  ];

  const quickActions = [
    { id: 'qa1', icon: 'document-scanner', label: 'Scan receipts' },
    { id: 'qa2', icon: 'upload-file', label: 'Upload Statements' },
    { id: 'qa3', icon: 'sms', label: 'Scan SMS' },
    { id: 'qa4', icon: 'email', label: 'Scan Emails' },
    { id: 'qa5', icon: 'add-circle', label: 'Add Cash' },
  ];

  return (
    <ScreenLayout>
      <StatusBar style="dark" backgroundColor={Colors.background.primary} />
      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <WelcomeHeader name="Donna" email="hello@reallygreatsite.com" />
        
        <View style={styles.summaryGrid}>
          {summaryData.map(item => (
            <SummaryCard
              key={item.id}
              label={item.label}
              valueText={item.valueText}
              accentColor={item.accentColor}
            />
          ))}
        </View>
        
        <LatestTransactions transactions={latestTxns} />
        
        <QuickActions actions={quickActions} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Extra space for persistent menu button
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 16,
    justifyContent: 'space-between',
  },
});

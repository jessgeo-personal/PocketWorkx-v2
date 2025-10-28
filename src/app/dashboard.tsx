// src/app/dashboard.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import ScreenLayout from '../components/ScreenLayout';
import { Colors } from '../utils/theme';
import { formatCurrency, formatCompactCurrency } from '../utils/currency';

type Txn = {
  id: string;
  title: string;
  date: string;
  status: 'Success' | 'Pending' | 'Failed';
  amount: number;
  currency: 'INR';
};

export default function DashboardScreen() {
  // Temporary demo numbers; replace with live calculations later (services/calculations)
  const liquidCashINR = 2332550;      // ₹ 23,32,550
  const netWorthINR = 10325550;       // ₹ 1,03,25,550
  const liabilitiesINR = 7500550;     // ₹ 75,00,550
  const invAndRecvINR = 17832550;     // ₹ 1,78,32,550

  const latestTxns: Txn[] = [
    { id: 't1', title: 'Borcelle Store', date: 'Fri, 10 Sep 2026', status: 'Success', amount: -3500, currency: 'INR' },
    { id: 't2', title: 'Timmerman Industries', date: 'Sat, 12 Jun 2026', status: 'Success', amount: -6500, currency: 'INR' },
  ];

  const quickActions = [
    { id: 'qa1', icon: 'document-scanner', label: 'Scan receipts' },
    { id: 'qa2', icon: 'upload-file', label: 'Upload Statements' },
    { id: 'qa3', icon: 'sms', label: 'Scan SMS' },
    { id: 'qa4', icon: 'email', label: 'Scan Emails' },
    { id: 'qa5', icon: 'add-circle', label: 'Add Cash' },
  ];

  const summaryCards = useMemo(
    () => [
      { id: 's1', label: 'Your liquid cash balance', value: liquidCashINR, colorA: '#2F80ED', colorB: '#56CCF2' },
      { id: 's2', label: 'Your total net worth', value: netWorthINR, colorA: '#10B981', colorB: '#34D399' },
      { id: 's3', label: 'Your total liabilities', value: liabilitiesINR, colorA: '#EF4444', colorB: '#F87171' },
      { id: 's4', label: 'Your Investments & receivables', value: invAndRecvINR, colorA: '#8B5CF6', colorB: '#A78BFA' },
    ],
    [liquidCashINR, netWorthINR, liabilitiesINR, invAndRecvINR]
  );

  return (
    <ScreenLayout>
      <StatusBar style="dark" backgroundColor={Colors.background.primary} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Welcome header */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Text style={styles.brandPrimary}>Pocket</Text>
            <Text style={styles.brandAccent}>Workx</Text>
          </View>
          <Text style={styles.welcomeTitle}>Welcome Back, Donna</Text>
          <Text style={styles.welcomeSubtitle}>hello@reallygreatsite.com</Text>
        </View>

        {/* Summary cards */}
        <View style={styles.summaryGrid}>
          {summaryCards.map(c => (
            <View key={c.id} style={styles.summaryWrapper}>
              <View style={styles.summaryCardShadow}>
                <View style={[styles.summaryCard, { backgroundColor: Colors.background.secondary }]}>
                  <Text style={styles.summaryValue}>{formatCompactCurrency(c.value, 'INR')}</Text>
                  <Text style={styles.summaryLabel}>{c.label}</Text>
                </View>
                <View style={[styles.summaryAccentBar, { backgroundColor: c.colorA }]} />
              </View>
            </View>
          ))}
        </View>

        {/* Latest Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Transactions</Text>
          <View style={styles.txnList}>
            {latestTxns.map(txn => (
              <View key={txn.id} style={styles.txnRow}>
                <View style={styles.txnLeft}>
                  <View style={styles.txnIcon}>
                    <MaterialIcons name="receipt-long" size={20} color={Colors.white} />
                  </View>
                  <View style={styles.txnDetails}>
                    <Text style={styles.txnTitle}>{txn.title}</Text>
                    <Text style={styles.txnMeta}>{txn.date} • {txn.status}</Text>
                  </View>
                </View>
                <Text style={[styles.txnAmount, txn.amount < 0 ? styles.txnDebit : styles.txnCredit]}>
                  {formatCurrency(Math.abs(txn.amount), 'INR')}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map(a => (
              <TouchableOpacity key={a.id} style={styles.actionButton} activeOpacity={0.85}>
                <MaterialIcons name={a.icon as any} size={24} color={Colors.accent} />
                <Text style={styles.actionText}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  headerCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  brandPrimary: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  brandAccent: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.accent,
    marginLeft: 4,
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 16,
    justifyContent: 'space-between',
  },
  summaryWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  summaryCardShadow: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  summaryCard: {
    padding: 16,
    borderRadius: 16,
  },
  summaryAccentBar: {
    height: 4,
    width: '100%',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
  },

  section: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },

  txnList: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    paddingVertical: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border.main,
  },
  txnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  txnIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  txnDetails: {
    flex: 1,
  },
  txnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  txnMeta: {
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  txnAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  txnDebit: {
    color: '#EF4444',
  },
  txnCredit: {
    color: '#10B981',
  },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.text.primary,
  },
});

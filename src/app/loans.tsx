// src/app/loans.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Loan,
} from '../types/finance';
import { formatCompactCurrency } from '../utils/currency';
import ScreenLayout from '../components/ScreenLayout';  // ← Added

const LoansScreen: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([
    {
      id: '1',
      type: 'home',
      bank: 'HDFC Bank',
      accountNumber: '****1234',
      loanNumber: 'LN001',
      principalAmount: { amount: 5000000, currency: 'INR' },
      currentBalance: { amount: 4225000, currency: 'INR' },
      interestRate: 7.2,
      tenure: 240,
      emi: { amount: 41439, currency: 'INR' },
      nextPaymentDate: new Date('2025-10-15'),
      startDate: new Date('2020-10-15'),
      endDate: new Date('2040-10-15'),
      isActive: true,
      encryptedData: {
        encryptionKey: '',
        encryptionAlgorithm: 'AES-256',
        lastEncrypted: new Date(),
        isEncrypted: false,
      },
      auditTrail: {
        createdBy: 'user',
        createdAt: new Date('2020-10-15'),
        updatedBy: 'user',
        updatedAt: new Date(),
        version: 1,
        changes: [],
      },
      linkedTransactions: [],
    },
    // ... more loan entries
  ]);

  const totalBalance = loans.reduce((sum, loan) => sum + loan.currentBalance.amount, 0);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Loans</Text>
      <TouchableOpacity style={styles.addButton}>
        <MaterialIcons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const renderSummary = () => (
    <LinearGradient
      colors={['#0288D1', '#26C6DA']}
      style={styles.summaryCard}
    >
      <Text style={styles.summaryLabel}>Total Loan Balance</Text>
      <Text style={styles.summaryAmount}>
        {formatCompactCurrency(totalBalance, 'INR')}
      </Text>
    </LinearGradient>
  );

  const renderLoanCard = (loan: Loan) => {
    const daysUntilDue = Math.ceil((loan.nextPaymentDate.getTime() - Date.now()) / (1000 * 86400));
    return (
      <View key={loan.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{loan.type.toUpperCase()} Loan</Text>
          <Text style={styles.bankText}>{loan.bank}</Text>
        </View>
        <Text style={styles.balanceText}>
          Balance: {formatCompactCurrency(loan.currentBalance.amount, loan.currentBalance.currency)}
        </Text>
        <Text style={styles.emiText}>
          EMI: {formatCompactCurrency(loan.emi.amount, loan.emi.currency)} • Due in {daysUntilDue} days
        </Text>
      </View>
    );
  };

  return (
    <ScreenLayout>  {/* ← Added */}
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {renderHeader()}
        <ScrollView contentContainerStyle={styles.scrollView}>
          {renderSummary()}
          {loans.map(renderLoanCard)}
        </ScrollView>
      </SafeAreaView>
    </ScreenLayout>  
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#0288D1' },
  headerTitle: { fontSize: 24, fontWeight: '600', color: '#FFFFFF' },
  addButton: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20 },
  summaryCard: { margin: 16, padding: 20, borderRadius: 12 },
  summaryLabel: { fontSize: 14, color: '#FFFFFF', opacity: 0.9 },
  summaryAmount: { fontSize: 28, color: '#FFFFFF', fontWeight: '700' },
  scrollView: { paddingHorizontal: 16, paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', marginVertical: 8, padding: 16, borderRadius: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  bankText: { fontSize: 12, color: '#666666' },
  balanceText: { fontSize: 14, fontWeight: '500', color: '#1A1A1A' },
  emiText: { fontSize: 12, color: '#666666' },
});

export { LoansScreen as default };


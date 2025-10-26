// src/app/credit-cards.tsx
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
  CreditCard,
} from '../types/finance';
import { formatCompactCurrency } from '../utils/currency';
import ScreenLayout from '../components/ScreenLayout';  // ← Added

const CreditCardsScreen: React.FC = () => {
  const [cards, setCards] = useState<CreditCard[]>([
    {
      id: '1',
      bank: 'HDFC Bank',
      cardNumber: '****4523',
      cardType: 'visa',
      cardName: 'MoneyBack+ Credit Card',
      creditLimit: { amount: 500000, currency: 'INR' },
      currentBalance: { amount: 125000, currency: 'INR' },
      availableCredit: { amount: 375000, currency: 'INR' },
      minimumPayment: { amount: 6250, currency: 'INR' },
      paymentDueDate: new Date('2025-11-15'),
      statementDate: new Date('2025-10-20'),
      interestRate: 3.5,
      isActive: true,
      encryptedData: {
        encryptionKey: '',
        encryptionAlgorithm: 'AES-256',
        lastEncrypted: new Date(),
        isEncrypted: false,
      },
      auditTrail: {
        createdBy: 'user',
        createdAt: new Date('2022-01-15'),
        updatedBy: 'user',
        updatedAt: new Date(),
        version: 1,
        changes: [],
      },
      linkedTransactions: [],
    },
    // ... more cards
  ]);

  const totalBalance = cards.reduce((sum, card) => sum + card.currentBalance.amount, 0);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Credit Cards</Text>
      <TouchableOpacity style={styles.addButton}>
        <MaterialIcons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const renderSummary = () => (
    <View style={styles.summaryContainer}>
      <LinearGradient
        colors={['#8E44AD', '#9B59B6']}
        style={styles.summaryCard}
      >
        <Text style={styles.summaryLabel}>Total Outstanding</Text>
        <Text style={styles.summaryAmount}>
          {formatCompactCurrency(totalBalance, 'INR')}
        </Text>
      </LinearGradient>
    </View>
  );

  const renderCard = (card: CreditCard) => {
    const daysUntilDue = Math.ceil((card.paymentDueDate.getTime() - Date.now()) / (1000 * 86400));
    return (
      <View key={card.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName}>{card.cardName}</Text>
          <Text style={styles.bankText}>{card.bank}</Text>
        </View>
        <Text style={styles.balanceText}>
          Balance: {formatCompactCurrency(card.currentBalance.amount, card.currentBalance.currency)}
        </Text>
        <Text style={styles.dueText}>
          Due in {daysUntilDue} days
        </Text>
      </View>
    );
  };

  return (
    <ScreenLayout>  {/* ← Added */}
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#8E44AD" />
        {renderHeader()}
        <ScrollView contentContainerStyle={styles.scrollView}>
          {renderSummary()}
          {cards.map(renderCard)}
        </ScrollView>
      </SafeAreaView>
    </ScreenLayout>  
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#8E44AD' },
  headerTitle: { fontSize: 24, fontWeight: '600', color: '#FFFFFF' },
  addButton: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20 },
  summaryContainer: { padding: 16 },
  summaryCard: { padding: 20, borderRadius: 12 },
  summaryLabel: { fontSize: 14, color: '#FFFFFF', opacity: 0.9 },
  summaryAmount: { fontSize: 28, color: '#FFFFFF', fontWeight: '700' },
  scrollView: { paddingHorizontal: 16, paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', marginVertical: 8, padding: 16, borderRadius: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  bankText: { fontSize: 12, color: '#666666' },
  balanceText: { fontSize: 14, color: '#333333', marginBottom: 4 },
  dueText: { fontSize: 12, color: '#E74C3C' },
});

export default CreditCardsScreen;

// src/app/investments.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Investment } from '../types/finance';
import { formatCurrency, formatCompactCurrency } from '../utils/currency';
import ScreenLayout from '../components/ScreenLayout';
import { Colors } from '../utils/theme';

const InvestmentsScreen: React.FC = () => {
  const [investments, setInvestments] = useState<Investment[]>([
    {
      id: '1',
      type: 'mutual_funds',
      name: 'SBI Blue Chip Fund',
      description: 'Large Cap Equity Fund',
      quantity: 2847.56,
      unitPrice: { amount: 72.45, currency: 'INR' },
      currentValue: { amount: 206325, currency: 'INR' },
      investedAmount: { amount: 180000, currency: 'INR' },
      broker: 'Zerodha',
      folioNumber: 'SBI123456',
      category: 'equity',
      riskLevel: 'medium',
      isActive: true,
      encryptedData: {
        encryptionKey: '',
        encryptionAlgorithm: 'AES-256',
        lastEncrypted: new Date(),
        isEncrypted: false,
      },
      auditTrail: {
        createdBy: 'user',
        createdAt: new Date('2023-01-15'),
        updatedBy: 'user',
        updatedAt: new Date(),
        version: 1,
        changes: [],
      },
      linkedTransactions: [],
    },
    {
      id: '2',
      type: 'stocks',
      name: 'Reliance Industries Ltd',
      description: 'Equity Shares',
      quantity: 50,
      unitPrice: { amount: 2856.75, currency: 'INR' },
      currentValue: { amount: 142837, currency: 'INR' },
      investedAmount: { amount: 135000, currency: 'INR' },
      broker: 'Zerodha',
      isin: 'INE002A01018',
      category: 'equity',
      riskLevel: 'medium',
      isActive: true,
      encryptedData: {
        encryptionKey: '',
        encryptionAlgorithm: 'AES-256',
        lastEncrypted: new Date(),
        isEncrypted: false,
      },
      auditTrail: {
        createdBy: 'user',
        createdAt: new Date('2022-06-10'),
        updatedBy: 'user',
        updatedAt: new Date(),
        version: 1,
        changes: [],
      },
      linkedTransactions: [],
    },
    {
      id: '3',
      type: 'fixed_deposit',
      name: 'HDFC Bank FD',
      description: '5-Year Fixed Deposit',
      quantity: 1,
      unitPrice: { amount: 250000, currency: 'INR' },
      currentValue: { amount: 287500, currency: 'INR' },
      investedAmount: { amount: 250000, currency: 'INR' },
      maturityDate: new Date('2027-03-15'),
      interestRate: 6.8,
      broker: 'HDFC Bank',
      category: 'debt',
      riskLevel: 'low',
      isActive: true,
      encryptedData: {
        encryptionKey: '',
        encryptionAlgorithm: 'AES-256',
        lastEncrypted: new Date(),
        isEncrypted: false,
      },
      auditTrail: {
        createdBy: 'user',
        createdAt: new Date('2022-03-15'),
        updatedBy: 'user',
        updatedAt: new Date(),
        version: 1,
        changes: [],
      },
      linkedTransactions: [],
    },
    {
      id: '4',
      type: 'gold',
      name: 'Digital Gold',
      description: '24K Gold',
      quantity: 15.5,
      unitPrice: { amount: 6245, currency: 'INR' },
      currentValue: { amount: 96798, currency: 'INR' },
      investedAmount: { amount: 85000, currency: 'INR' },
      weight: 15.5,
      broker: 'Paytm Gold',
      category: 'commodity',
      riskLevel: 'medium',
      isActive: true,
      encryptedData: {
        encryptionKey: '',
        encryptionAlgorithm: 'AES-256',
        lastEncrypted: new Date(),
        isEncrypted: false,
      },
      auditTrail: {
        createdBy: 'user',
        createdAt: new Date('2023-08-20'),
        updatedBy: 'user',
        updatedAt: new Date(),
        version: 1,
        changes: [],
      },
      linkedTransactions: [],
    },
  ]);

  const totalCurrentValue = investments.filter(i => i.isActive).reduce((s, i) => s + i.currentValue.amount, 0);
  const totalInvestedAmount = investments.filter(i => i.isActive).reduce((s, i) => s + i.investedAmount.amount, 0);
  const totalGains = totalCurrentValue - totalInvestedAmount;
  const gainPercentage = totalInvestedAmount > 0 ? (totalGains / totalInvestedAmount) * 100 : 0;

  const getInvestmentIcon = (type: string) => {
    const icons = {
      stocks: 'trending-up',
      mutual_funds: 'pie-chart',
      fixed_deposit: 'account-balance',
      gold: 'star',
      bonds: 'receipt',
      ppf: 'security',
      real_estate: 'home',
      sip: 'schedule',
    };
    return (icons as any)[type] || 'attach-money';
  };

  const getInvestmentColor = (type: string) => {
    const map = {
      stocks: '#2196F3',
      mutual_funds: '#FF9800',
      fixed_deposit: '#4CAF50',
      gold: '#FFD700',
      bonds: '#9C27B0',
      ppf: '#607D8B',
      real_estate: '#795548',
      sip: '#00BCD4',
    };
    return (map as any)[type] || '#666666';
  };

  const getRiskColor = (risk: string) => {
    const map = { low: '#4CAF50', medium: '#FF9800', high: '#F44336' };
    return (map as any)[risk] || '#666666';
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Investments</Text>
      <TouchableOpacity style={styles.addButton}>
        <MaterialIcons name="add" size={24} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  const renderSummaryCards = () => (
    <View style={styles.summaryContainer}>
      <LinearGradient colors={['#FF6B35', '#FF8E35']} style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Portfolio Value</Text>
        <Text style={styles.summaryAmount}>{formatCompactCurrency(totalCurrentValue, 'INR')}</Text>
        <Text style={styles.summarySubtext}>
          Invested: {formatCompactCurrency(totalInvestedAmount, 'INR')}
        </Text>
      </LinearGradient>

      <View style={[styles.gainsCard, totalGains >= 0 ? styles.gainPositive : styles.gainNegative]}>
        <Text style={styles.gainsLabel}>Total {totalGains >= 0 ? 'Gains' : 'Loss'}</Text>
        <Text style={styles.gainsAmount}>
          {totalGains >= 0 ? '+' : ''}{formatCompactCurrency(totalGains, 'INR')}
        </Text>
        <Text style={styles.gainsPercent}>
          {totalGains >= 0 ? '+' : ''}{gainPercentage.toFixed(2)}%
        </Text>
      </View>
    </View>
  );

  const renderInvestmentCard = (inv: Investment) => {
    const gains = inv.currentValue.amount - inv.investedAmount.amount;
    const gainPercent = inv.investedAmount.amount > 0 ? (gains / inv.investedAmount.amount) * 100 : 0;

    return (
      <TouchableOpacity key={inv.id} style={styles.investmentCard}>
        <View style={styles.investmentHeader}>
          <View style={styles.investmentLeft}>
            <View style={[styles.investmentIcon, { backgroundColor: getInvestmentColor(inv.type) }]}>
              <MaterialIcons name={getInvestmentIcon(inv.type) as any} size={24} color={Colors.white} />
            </View>
            <View style={styles.investmentDetails}>
              <Text style={styles.investmentName}>{inv.name}</Text>
              <Text style={styles.investmentDescription}>{inv.description}</Text>
              <View style={styles.investmentMeta}>
                <View style={[styles.riskBadge, { backgroundColor: getRiskColor(inv.riskLevel) }]}>
                  <Text style={styles.riskText}>{inv.riskLevel.toUpperCase()}</Text>
                </View>
                {inv.broker ? <Text style={styles.brokerText}>via {inv.broker}</Text> : null}
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <MaterialIcons name="more-vert" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.investmentValues}>
          <View style={styles.valueRow}>
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Current Value</Text>
              <Text style={styles.currentValue}>
                {formatCompactCurrency(inv.currentValue.amount, inv.currentValue.currency)}
              </Text>
            </View>
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Invested</Text>
              <Text style={styles.investedValue}>
                {formatCompactCurrency(inv.investedAmount.amount, inv.investedAmount.currency)}
              </Text>
            </View>
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Returns</Text>
              <Text style={[styles.returnsValue, gains >= 0 ? styles.positiveReturn : styles.negativeReturn]}>
                {gains >= 0 ? '+' : ''}{gainPercent.toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>

        {inv.type === 'stocks' && (
          <View style={styles.additionalInfo}>
            <Text style={styles.additionalText}>
              {inv.quantity} shares @ {formatCurrency(inv.unitPrice.amount, 'INR')}
            </Text>
          </View>
        )}

        {inv.type === 'mutual_funds' && (
          <View style={styles.additionalInfo}>
            <Text style={styles.additionalText}>
              {inv.quantity.toFixed(2)} units @ {formatCurrency(inv.unitPrice.amount, 'INR')}
            </Text>
          </View>
        )}

        {inv.type === 'fixed_deposit' && inv.maturityDate && (
          <View style={styles.additionalInfo}>
            <Text style={styles.additionalText}>
              Matures on {inv.maturityDate.toLocaleDateString()} • {inv.interestRate}% p.a.
            </Text>
          </View>
        )}

        {inv.type === 'gold' && inv.weight && (
          <View style={styles.additionalInfo}>
            <Text style={styles.additionalText}>
              {inv.weight}g @ {formatCurrency(inv.unitPrice.amount, 'INR')}/g
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionGrid}>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="add-circle" size={24} color="#FF6B35" />
          <Text style={styles.actionText}>Add Investment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="pie-chart" size={24} color="#FF6B35" />
          <Text style={styles.actionText}>Portfolio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="swap-horiz" size={24} color="#FF6B35" />
          <Text style={styles.actionText}>Buy/Sell</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="assessment" size={24} color="#FF6B35" />
          <Text style={styles.actionText}>Performance</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenLayout>
      <StatusBar style="dark" backgroundColor={Colors.background.primary} />
      {renderHeader()}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderSummaryCards()}
        {renderQuickActions()}
        <View style={styles.investmentsContainer}>
          <Text style={styles.sectionTitle}>Your Investments</Text>
          {investments.map(renderInvestmentCard)}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  addButton: {
    backgroundColor: Colors.accent,
    borderRadius: 20,
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  summaryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  gainsCard: {
    backgroundColor: Colors.background.secondary,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gainPositive: {
    borderLeftWidth: 4,
    borderLeftColor: '#27AE60',
  },
  gainNegative: {
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
  },
  gainsLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  gainsAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  gainsPercent: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    width: '47%',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    fontSize: 12,
    color: Colors.text.primary,
    marginTop: 8,
    textAlign: 'center',
  },
  investmentsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  investmentCard: {
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  investmentLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  investmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  investmentDetails: {
    flex: 1,
  },
  investmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  investmentDescription: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  investmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  riskText: {
    fontSize: 8,
    fontWeight: '600',
    color: Colors.white,
  },
  brokerText: {
    fontSize: 10,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
  moreButton: {
    padding: 4,
  },
  investmentValues: {
    marginBottom: 12,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  valueItem: {
    alignItems: 'center',
    flex: 1,
  },
  valueLabel: {
    fontSize: 10,
    color: Colors.text.tertiary,
    marginBottom: 4,
  },
  currentValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  investedValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  returnsValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  positiveReturn: {
    color: '#27AE60',
  },
  negativeReturn: {
    color: '#E74C3C',
  },
  additionalInfo: {
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border.main,
  },
  additionalText: {
    fontSize: 11,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

export { InvestmentsScreen as default };

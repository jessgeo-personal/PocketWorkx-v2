// src/app/investments.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Investment } from '../types/finance';
import { formatCurrency, formatCompactCurrency } from '../utils/currency';
import ScreenLayout from '../components/ScreenLayout';
import { Colors } from '../utils/theme';
import AppFooter from '../components/AppFooter';

//types

type DebtInstrument = {
  id: string;
  type: 'debt';
  name: string;
  issuer: string;
  isin?: string;
  faceValue?: number;
  couponRate?: number;
  yieldToMaturity?: number;
  bondType?: 'government' | 'corporate' | 'municipal';
  creditRating?: string;
  currentValue: { amount: number; currency: 'INR' };
  investedAmount: { amount: number; currency: 'INR' };
  maturityDate?: Date;
  isActive: boolean;
};

//UI-states

//Main

const InvestmentsScreen: React.FC = () => {
  
  //useStates
  
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

  //Modal states
  const [isDebtModalVisible, setIsDebtModalVisible] = useState(false);
  const [diName, setDiName] = useState('');
  const [diIssuer, setDiIssuer] = useState('');
  const [diInvested, setDiInvested] = useState('');
  const [diCurrent, setDiCurrent] = useState('');
  const [diISIN, setDiISIN] = useState('');
  const [diBondType, setDiBondType] = useState<'government' | 'corporate' | 'municipal'>('government');
  const [diRating, setDiRating] = useState('');
  const [diCoupon, setDiCoupon] = useState('');
  const [diYTM, setDiYTM] = useState('');
  const [diMaturityStr, setDiMaturityStr] = useState('');



  //Calculations

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
          <MaterialIcons name="trending-up" size={24} color="#FF6B35" />
          <Text style={styles.actionText}>Add Stocks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="pie-chart" size={24} color="#FF6B35" />
          <Text style={styles.actionText}>Add Mutual Funds</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            // reset fields and open modal
            setDiName('');
            setDiIssuer('');
            setDiInvested('');
            setDiCurrent('');
            setDiISIN('');
            setDiBondType('government');
            setDiRating('');
            setDiCoupon('');
            setDiYTM('');
            setDiMaturityStr('');
            setIsDebtModalVisible(true);
          }}
        >
          <MaterialIcons name="receipt-long" size={24} color="#FF6B35" />
          <Text style={styles.actionText}>Add Debt Instruments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="assessment" size={24} color="#FF6B35" />
          <Text style={styles.actionText}>Portfolio Analysis</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDebtModal = () => (
    <Modal
      visible={isDebtModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setIsDebtModalVisible(false)}
    >
      <View style={{
        flex: 1, backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'center', alignItems: 'center'
      }}>
        <View style={{
          backgroundColor: Colors.background.secondary,
          borderRadius: 16, width: '90%', maxWidth: 420, maxHeight: '85%', overflow: 'hidden'
        }}>
          <View style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            padding: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0'
          }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: Colors.text.primary }}>Add Debt Instrument</Text>
            <TouchableOpacity onPress={() => setIsDebtModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flexGrow: 1 }}>
            <View style={{ padding: 20 }}>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.text.primary, marginBottom: 8 }}>Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={diName}
                  onChangeText={setDiName}
                  placeholder="e.g., GOI 7.10% 2033"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.text.primary, marginBottom: 8 }}>Issuer *</Text>
                <TextInput
                  style={styles.textInput}
                  value={diIssuer}
                  onChangeText={setDiIssuer}
                  placeholder="Government of India / Reliance Industries"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.text.primary, marginBottom: 8 }}>Bond Type</Text>
                <View style={styles.pickerRow}>
                  {(['government','corporate','municipal'] as const).map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.pill, diBondType === type && styles.pillSelected]}
                      onPress={() => setDiBondType(type)}
                    >
                      <Text style={[styles.pillText, diBondType === type && styles.pillTextSelected]}>
                        {type.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.text.primary, marginBottom: 8 }}>Invested Amount (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={diInvested}
                  onChangeText={setDiInvested}
                  placeholder="100000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.text.primary, marginBottom: 8 }}>Current Value (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={diCurrent}
                  onChangeText={setDiCurrent}
                  placeholder="102500"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.text.primary, marginBottom: 8 }}>ISIN (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={diISIN}
                  onChangeText={setDiISIN}
                  placeholder="INE... code"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.text.primary, marginBottom: 8 }}>Coupon %</Text>
                  <TextInput
                    style={styles.textInput}
                    value={diCoupon}
                    onChangeText={setDiCoupon}
                    placeholder="7.10"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.text.primary, marginBottom: 8 }}>YTM %</Text>
                  <TextInput
                    style={styles.textInput}
                    value={diYTM}
                    onChangeText={setDiYTM}
                    placeholder="7.25"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.text.primary, marginBottom: 8 }}>Maturity (DD/MM/YYYY)</Text>
                <TextInput
                  style={styles.textInput}
                  value={diMaturityStr}
                  onChangeText={(t: string) => setDiMaturityStr(t)}
                  placeholder="15/08/2033"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

            </View>
          </ScrollView>

          <View style={{
            flexDirection: 'row', justifyContent: 'flex-end',
            padding: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E0E0E0'
          }}>
            <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 10, marginRight: 12, borderRadius: 10 }} onPress={() => setIsDebtModalVisible(false)}>
              <Text style={{ fontSize: 16, color: '#666666' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: '#8B5CF6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }} onPress={() => {
              // Validation
              if (!diName.trim() || !diIssuer.trim() || !diInvested.trim() || !diCurrent.trim()) {
                Alert.alert('Missing Info', 'Please fill name, issuer, invested and current values.');
                return;
              }
              const invested = Number(diInvested);
              const current = Number(diCurrent);
              if (!Number.isFinite(invested) || invested <= 0 || !Number.isFinite(current) || current <= 0) {
                Alert.alert('Invalid Amount', 'Please enter valid invested/current amounts.');
                return;
              }

              const newItem: any = {
                id: `${Date.now()}`,
                type: 'bonds',            // for icons/colors already present
                name: diName.trim(),
                description: diIssuer.trim(),
                investedAmount: { amount: Math.round(invested), currency: 'INR' },
                currentValue: { amount: Math.round(current), currency: 'INR' },
                isin: diISIN || undefined,
                interestRate: diCoupon ? Number(diCoupon) : undefined,
                maturityDate: diMaturityStr ? new Date(diMaturityStr.split('/').reverse().join('-')) : undefined,
                riskLevel: 'low',
                isActive: true,
                encryptedData: { encryptionKey: '', encryptionAlgorithm: 'AES-256', lastEncrypted: new Date(), isEncrypted: false },
                auditTrail: { createdBy: 'user', createdAt: new Date(), updatedBy: 'user', updatedAt: new Date(), version: 1, changes: [] },
                linkedTransactions: [],
              };

              setInvestments(prev => [newItem, ...prev]);
              setIsDebtModalVisible(false);
            }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.white }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  
  
  // render end
  
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
        {renderDebtModal()}
        <AppFooter />
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
  // Add pill-based picker styles to match other screens
  pickerRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    // If 'gap' unsupported, rely on pill margins
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: Colors.background.secondary,
    marginRight: 8,
    marginBottom: 8,
  },
  pillSelected: { 
    backgroundColor: '#8B5CF6', 
    borderColor: '#8B5CF6' 
  },
  pillText: { 
    fontSize: 13, 
    color: Colors.text.primary 
  },
  pillTextSelected: { 
    color: Colors.white, 
    fontWeight: '600' 
  },
  textInput: {
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16, 
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
  },

});

export { InvestmentsScreen as default };

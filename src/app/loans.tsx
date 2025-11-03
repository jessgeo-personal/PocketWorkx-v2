// src/app/loans.tsx
import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenLayout from '../components/ScreenLayout';
import AppFooter from '../components/AppFooter';
import { Colors } from '../utils/theme';
import TransactionsModal from '../components/modals/TransactionsModal';
import type { FilterCriteria } from '../types/transactions';

// Use shared storage
import { useStorage, type AppModel, type LoanEntry as SPLoanEntry } from '../services/storage/StorageProvider';

type Currency = 'INR';
type Money = { amount: number; currency: Currency };

// Use storage provider types
type LoanEntry = SPLoanEntry;

const formatFullINR = (value: number): string => {
  try {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });
    return formatter.format(Math.round(value));
  } catch {
    const abs = Math.abs(Math.round(value));
    const sign = value < 0 ? '-' : '';
    const str = abs.toString();
    const lastThree = str.substring(str.length - 3);
    const otherNumbers = str.substring(0, str.length - 3);
    const result = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + (otherNumbers ? ',' : '') + lastThree;
    return `${sign}₹${result}`;
  }
};

const getLoanTypeIcon = (t: string) => {
  switch (t.toLowerCase()) {
    case 'home': return 'home';
    case 'car': return 'directions-car';
    case 'personal': return 'person';
    case 'education': return 'school';
    default: return 'trending-up';
  }
};

const getLoanAccent = (t: string) => {
  switch (t.toLowerCase()) {
    case 'home': return '#D32F2F';
    case 'car': return '#F57C00';
    case 'personal': return '#E64A19';
    case 'education': return '#C2185B';
    default: return '#D32F2F';
  }
};

const LoansScreen: React.FC = () => {
  // Hook into global storage
  const { state, loading, save } = useStorage();

  // Modal states
  const [isAddLoanModalVisible, setIsAddLoanModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Add Loan form states
  const [newLoanBank, setNewLoanBank] = useState('');
  const [newLoanNumber, setNewLoanNumber] = useState('');
  const [newLoanType, setNewLoanType] = useState<'home' | 'car' | 'personal' | 'education' | 'other'>('home');
  const [newPrincipalAmount, setNewPrincipalAmount] = useState('');
  const [newCurrentBalance, setNewCurrentBalance] = useState('');
  const [newInterestRate, setNewInterestRate] = useState('');
  const [newTenureMonths, setNewTenureMonths] = useState('');
  const [newEmiAmount, setNewEmiAmount] = useState('');

  // TransactionsModal states
  const [txModalVisible, setTxModalVisible] = useState(false);
  const [txFilter, setTxFilter] = useState<FilterCriteria | null>(null);

  // Read from storage
  const loans: LoanEntry[] = (state?.loanEntries as LoanEntry[] | undefined) ?? [];

  const totalOutstanding = useMemo(
    () => loans.reduce((sum, l) => sum + (l.currentBalance?.amount || 0), 0),
    [loans]
  );

  const handleAddLoan = async () => {
    if (isProcessing) return;
    
    if (!newLoanBank.trim() || !newLoanNumber.trim() || !newPrincipalAmount.trim() || 
        !newCurrentBalance.trim() || !newInterestRate.trim() || !newTenureMonths.trim() || 
        !newEmiAmount.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const principal = parseFloat(newPrincipalAmount);
    const balance = parseFloat(newCurrentBalance);
    const rate = parseFloat(newInterestRate);
    const tenure = parseInt(newTenureMonths);
    const emi = parseFloat(newEmiAmount);

    if (isNaN(principal) || principal <= 0) {
      Alert.alert('Error', 'Please enter a valid principal amount');
      return;
    }
    if (isNaN(balance) || balance < 0) {
      Alert.alert('Error', 'Please enter a valid current balance');
      return;
    }
    if (isNaN(rate) || rate <= 0 || rate > 50) {
      Alert.alert('Error', 'Please enter a valid interest rate (0-50%)');
      return;
    }
    if (isNaN(tenure) || tenure <= 0 || tenure > 600) {
      Alert.alert('Error', 'Please enter a valid tenure (1-600 months)');
      return;
    }
    if (isNaN(emi) || emi <= 0) {
      Alert.alert('Error', 'Please enter a valid EMI amount');
      return;
    }

    setIsProcessing(true);
    try {
      const now = new Date();
      const startDate = new Date(now.getTime() - (tenure * 0.1 * 30 * 24 * 60 * 60 * 1000)); // approx start
      const endDate = new Date(now.getTime() + (tenure * 0.9 * 30 * 24 * 60 * 60 * 1000)); // approx end
      const nextEMI = new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000)); // 5 days from now

      const newLoan: LoanEntry = {
        id: Date.now().toString(),
        type: newLoanType,
        bank: newLoanBank.trim(),
        loanNumber: newLoanNumber.trim(),
        principalAmount: { amount: Math.round(principal), currency: 'INR' },
        currentBalance: { amount: Math.round(balance), currency: 'INR' },
        interestRate: rate,
        tenureMonths: tenure,
        emiAmount: { amount: Math.round(emi), currency: 'INR' },
        nextPaymentDate: nextEMI,
        startDate: startDate,
        endDate: endDate,
        isActive: true,
        timestamp: now,
        encryptedData: {
          encryptionKey: '',
          encryptionAlgorithm: 'AES-256',
          lastEncrypted: now,
          isEncrypted: false,
        },
        auditTrail: {
          createdBy: 'user',
          createdAt: now,
          updatedBy: 'user',
          updatedAt: now,
          version: 1,
          changes: [{
            action: 'ADD_LOAN',
            timestamp: now,
            loanType: newLoanType,
            bank: newLoanBank.trim(),
            principalAmount: Math.round(principal),
          }],
        },
        linkedTransactions: [],
      };

      await save((draft: AppModel) => {
        const nextLoans: LoanEntry[] = draft.loanEntries ? [...draft.loanEntries] as LoanEntry[] : [];
        nextLoans.push(newLoan as LoanEntry);
        return { ...draft, loanEntries: nextLoans };
      });

      // Reset form and close modal
      setNewLoanBank('');
      setNewLoanNumber('');
      setNewLoanType('home');
      setNewPrincipalAmount('');
      setNewCurrentBalance('');
      setNewInterestRate('');
      setNewTenureMonths('');
      setNewEmiAmount('');
      setIsAddLoanModalVisible(false);

      Alert.alert('Success', 'Loan added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add loan. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Loans & Liabilities</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setIsAddLoanModalVisible(true)}
      >
        <MaterialIcons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const openAllLoansTransactions = () => {
    setTxFilter({
      assetType: 'loan',
      filterType: 'all',
      assetLabel: 'All Loans',
    });
    setTxModalVisible(true);
  };

  const renderTotalCard = () => (
    <TouchableOpacity activeOpacity={0.9} onPress={openAllLoansTransactions}>
      <LinearGradient colors={['#D32F2F', '#E64A19']} style={styles.totalCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.totalLabel}>Total Outstanding Loans</Text>
          <MaterialIcons name="chevron-right" size={20} color="#FFFFFF" />
        </View>
        <Text style={styles.totalAmount}>{formatFullINR(totalOutstanding)}</Text>
        <Text style={styles.entriesCount}>{loans.length} Active {loans.length === 1 ? 'Loan' : 'Loans'}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionGrid}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setIsAddLoanModalVisible(true)}
        >
          <MaterialIcons name="add-circle" size={24} color="#8B5CF6" />
          <Text style={styles.actionText}>Add Loan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Coming Soon', 'Record EMI will be implemented next.')}
        >
          <MaterialIcons name="receipt" size={24} color="#8B5CF6" />
          <Text style={styles.actionText}>Record EMI</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Coming Soon', 'Prepay Loan will be implemented next.')}
        >
          <MaterialIcons name="payment" size={24} color="#8B5CF6" />
          <Text style={styles.actionText}>Prepay Loan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Coming Soon', 'Loan Trends will be implemented next.')}
        >
          <MaterialIcons name="trending-up" size={24} color="#8B5CF6" />
          <Text style={styles.actionText}>View Trends</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLoanCard = (loan: LoanEntry) => {
    const daysUntilDue = Math.ceil((loan.nextPaymentDate.getTime() - Date.now()) / (1000 * 86400));
    const isOverdue = daysUntilDue < 0;

    const onOpenLoanTransactions = () => {
      setTxFilter({
        assetType: 'loan',
        filterType: 'category',
        assetLabel: `${loan.bank} • ${loan.type.toUpperCase()}`,
        assetId: loan.id,
      });
      setTxModalVisible(true);
    };

    return (
      <TouchableOpacity
        key={loan.id}
        style={styles.card}
        activeOpacity={0.9}
        onPress={onOpenLoanTransactions}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <View style={[styles.typeIcon, { backgroundColor: getLoanAccent(loan.type) }]}>
              <MaterialIcons name={getLoanTypeIcon(loan.type) as any} size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{loan.type.toUpperCase()} Loan</Text>
              <Text style={styles.bankText}>{loan.bank} • {loan.loanNumber}</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={Colors.text.secondary} />
        </View>

        <View style={styles.balanceSection}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Outstanding Balance</Text>
            <Text style={styles.balanceAmount}>{formatFullINR(loan.currentBalance.amount)}</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>EMI</Text>
            <Text style={styles.emiAmount}>{formatFullINR(loan.emiAmount.amount)}</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={[styles.dueLabel, isOverdue && styles.overdueText]}>
              {isOverdue ? `Overdue by ${Math.abs(daysUntilDue)} days` : `Due in ${daysUntilDue} days`}
            </Text>
            <Text style={styles.rateLabel}>{loan.interestRate.toFixed(2)}% p.a.</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderAddLoanModal = () => (
    <Modal
      visible={isAddLoanModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setIsAddLoanModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Loan</Text>
            <TouchableOpacity onPress={() => setIsAddLoanModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Bank/Lender Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newLoanBank}
                  onChangeText={setNewLoanBank}
                  placeholder="e.g., HDFC Bank, ICICI Bank"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Loan Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newLoanNumber}
                  onChangeText={setNewLoanNumber}
                  placeholder="e.g., HL001, CAR-8921"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Loan Type *</Text>
                <View style={styles.pickerRow}>
                  {(['home', 'car', 'personal', 'education', 'other'] as const).map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.pickerPill, newLoanType === type && styles.pickerPillSelected]}
                      onPress={() => setNewLoanType(type)}
                    >
                      <Text style={[styles.pickerPillText, newLoanType === type && styles.pickerPillTextSelected]}>
                        {type.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Principal Amount (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newPrincipalAmount}
                  onChangeText={setNewPrincipalAmount}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Current Outstanding Balance (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newCurrentBalance}
                  onChangeText={setNewCurrentBalance}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Interest Rate (% p.a.) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newInterestRate}
                  onChangeText={setNewInterestRate}
                  placeholder="e.g., 7.35"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Tenure (Months) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newTenureMonths}
                  onChangeText={setNewTenureMonths}
                  placeholder="e.g., 240 (20 years)"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>EMI Amount (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newEmiAmount}
                  onChangeText={setNewEmiAmount}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAddLoanModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, isProcessing && styles.disabledButton]}
              onPress={handleAddLoan}
              disabled={isProcessing}
            >
              <Text style={styles.primaryButtonText}>{isProcessing ? 'Adding...' : 'Add Loan'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <ScreenLayout>
        <View style={{ padding: 16 }}>
          <Text>Loading loans data…</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <StatusBar style="dark" backgroundColor={Colors.background.primary} />
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {renderHeader()}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderTotalCard()}
        {renderQuickActions()}

        <View style={styles.cardsContainer}>
          <Text style={styles.sectionTitle}>Your Loans</Text>
          {loans.length > 0 ? (
            loans.map(renderLoanCard)
          ) : (
            <View style={styles.emptyCards}>
              <MaterialIcons name="trending-up" size={64} color="#E0E0E0" />
              <Text style={styles.emptyText}>No loans yet</Text>
              <Text style={styles.emptySubtext}>Add your first loan to get started</Text>
            </View>
          )}
        </View>

        <AppFooter />
      </ScrollView>

      {renderAddLoanModal()}

      {/* TransactionsModal integration placeholder */}
      {txFilter && (
        <TransactionsModal
          visible={txModalVisible}
          onClose={() => setTxModalVisible(false)}
          params={{ filterCriteria: txFilter }}
        />
      )}
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
    backgroundColor: '#8B5CF6',
    borderRadius: 20,
    padding: 8,
  },
  logoContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
  },
  logo: {
    width: 200,
    height: 100,
  },
  scrollView: { flex: 1 },
  totalCard: {
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 24,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  entriesCount: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
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
  cardsContainer: {
    paddingHorizontal: 16,
    marginBottom: 100,
  },
  card: {
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 10,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  bankText: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  balanceSection: { gap: 8 },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D32F2F',
  },
  emiAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F57C00',
  },
  dueLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  rateLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  overdueText: {
    color: '#E74C3C',
    fontWeight: '700',
  },
  emptyCards: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginTop: 16,
    marginBottom: 4,
    textAlign: 'center',
    padding: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    width: '90%',
    maxWidth: 420,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  modalScrollView: { flexGrow: 1 },
  modalBody: { padding: 20 },
  inputContainer: { marginBottom: 16 },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 8,
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
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: Colors.background.secondary,
  },
  pickerPillSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  pickerPillText: {
    fontSize: 13,
    color: Colors.text.primary,
  },
  pickerPillTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 10,
  },
  cancelButtonText: { 
    fontSize: 16, 
    color: '#666666' 
  },
  primaryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  disabledButton: {
    backgroundColor: '#C7B8F7',
  },
});

export default LoansScreen;

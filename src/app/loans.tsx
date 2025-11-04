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
  FlatList,
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
import { useStorage, type AppModel, type LoanEntry as SPLoanEntry, type LoanScheduleItem } from '../services/storage/StorageProvider';

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

const buildFullSchedule = (loan: LoanEntry): LoanScheduleItem[] => {
  const items: LoanScheduleItem[] = [];
  const start = new Date(loan.startDate);
  for (let i = 0; i < loan.tenureMonths; i++) {
    const dueDate = new Date(start.getFullYear(), start.getMonth() + i + 1, start.getDate());
    const id = `${loan.id}-${dueDate.getFullYear()}${String(dueDate.getMonth()+1).padStart(2,'0')}`;
    items.push({
      id,
      dueDate,
      amount: { amount: loan.emiAmount.amount, currency: 'INR' },
      status: dueDate < new Date() ? 'overdue' : 'due',
    });
  }
  return items;
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
  const [newInterestRate, setNewInterestRate] = useState('');
  const [newTenureMonths, setNewTenureMonths] = useState('');
  const [newEmiAmount, setNewEmiAmount] = useState('');

  // Enhanced fields
  const [startDay, setStartDay] = useState<string>('');
  const [startMonth, setStartMonth] = useState<string>('');
  const [startYear, setStartYear] = useState<string>('');
  const [emisPaidSoFar, setEmisPaidSoFar] = useState<string>('0');
  const [monthlyDueDay, setMonthlyDueDay] = useState<string>('1');  // 1-31
  const [preferredAccountId, setPreferredAccountId] = useState<string>('');

  // TransactionsModal states
  const [txModalVisible, setTxModalVisible] = useState(false);
  const [txFilter, setTxFilter] = useState<FilterCriteria | null>(null);

  // EMI Schedule modal states
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [selectedLoanForSchedule, setSelectedLoanForSchedule] = useState<LoanEntry | null>(null);

  // EMI Payment account selection states
  const [paymentAccountModalVisible, setPaymentAccountModalVisible] = useState(false);
  const [selectedEmiItem, setSelectedEmiItem] = useState<{dueDate: Date, amount: number} | null>(null);
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState<string>('');

  // Read from storage
  const loans: LoanEntry[] = (state?.loanEntries as LoanEntry[] | undefined) ?? [];

  const totalOutstanding = useMemo(
    () => loans.reduce((sum, l) => sum + (l.currentBalance?.amount || 0), 0),
    [loans]
  );

  const handleAddLoan = async () => {
    if (isProcessing) return;
    
      if (!newLoanBank.trim() || !newLoanNumber.trim() || !newPrincipalAmount.trim() || 
          !newInterestRate.trim() || !newTenureMonths.trim() || !newEmiAmount.trim()) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

    const principal = parseFloat(newPrincipalAmount);
    const rate = parseFloat(newInterestRate);
    const tenure = parseInt(newTenureMonths);
    const emi = parseFloat(newEmiAmount);
    const paidCount = parseInt(emisPaidSoFar);
    const dueDay = parseInt(monthlyDueDay);

    if (isNaN(principal) || principal <= 0) {
      Alert.alert('Error', 'Please enter a valid principal amount');
      return;
    }
    if (isNaN(paidCount) || paidCount < 0 || paidCount >= tenure) {
      Alert.alert('Error', `Please enter EMIs paid (0-${tenure - 1})`);
      return;
    }
    if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
      Alert.alert('Error', 'Please enter a valid due day (1-31)');
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

    const sd = parseInt(startDay);
    const sm = parseInt(startMonth);
    const sy = parseInt(startYear);
    if (Number.isNaN(sd) || Number.isNaN(sm) || Number.isNaN(sy) ||
        sd < 1 || sd > 31 || sm < 1 || sm > 12 || sy < 1900 || sy > 2100) {
      Alert.alert('Error', 'Please enter a valid start date (DD/MM/YYYY)');
      return;
    }

    // Calculate current outstanding balance based on EMIs paid
    // Simplified: currentBalance = principal - (emisPaid * emi)
    // Future enhancement: proper amortization with principal/interest split
    const calculatedBalance = Math.max(0, principal - (paidCount * emi));

    setIsProcessing(true);
    try {
      const now = new Date();
      
      // Build start date from user input
      const startDate = new Date(sy, sm - 1, sd);
      // Use the specified due day for EMI dates instead of start date day
      const nextEMI = new Date(startDate.getFullYear(), startDate.getMonth() + paidCount + 1, dueDay);
      // Compute end date approximately using tenure months from start date
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + tenure, dueDay);

      // Generate full initial schedule with pre-paid EMIs marked
      const initialSchedule: LoanScheduleItem[] = [];
      for (let i = 0; i < tenure; i++) {
        const emiDate = new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, dueDay);
        const scheduleId = `${Date.now()}-${emiDate.getFullYear()}${String(emiDate.getMonth()+1).padStart(2,'0')}`;
        initialSchedule.push({
          id: scheduleId,
          dueDate: emiDate,
          amount: { amount: Math.round(emi), currency: 'INR' },
          status: i < paidCount ? 'paid' : (emiDate < new Date() ? 'overdue' : 'due'),
          paidOn: i < paidCount ? new Date(emiDate.getTime() - (7 * 24 * 60 * 60 * 1000)) : undefined, // assume paid 1 week before due
          notes: i < paidCount ? 'Pre-existing payment' : undefined,
        });
      }

      const newLoan: LoanEntry = {
        id: Date.now().toString(),
        type: newLoanType,
        bank: newLoanBank.trim(),
        loanNumber: newLoanNumber.trim(),
        principalAmount: { amount: Math.round(principal), currency: 'INR' },
        currentBalance: { amount: Math.round(calculatedBalance), currency: 'INR' },
        interestRate: rate,
        tenureMonths: tenure,
        emiAmount: { amount: Math.round(emi), currency: 'INR' },
        nextPaymentDate: nextEMI,
        startDate: startDate,
        endDate: endDate,
        isActive: true,
        preferredAccountId: preferredAccountId || '',
        monthlyDueDay: dueDay,
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
        schedule: initialSchedule,
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
      setNewInterestRate('');
      setNewTenureMonths('');
      setNewEmiAmount('');
      setStartDay('');
      setStartMonth('');
      setStartYear('');
      setEmisPaidSoFar('0');
      setMonthlyDueDay('1');
      setPreferredAccountId('');
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

  // Update the renderLoanCard function - Add these calculations before the return statement

  const renderLoanCard = (loan: LoanEntry) => {
    const daysUntilDue = Math.ceil((loan.nextPaymentDate.getTime() - Date.now()) / (1000 * 86400));
    const isOverdue = daysUntilDue < 0;

    // NEW: Calculate EMI paid/pending counts from schedule
    const schedule = loan.schedule ?? buildFullSchedule(loan);
    const emiCounts = {
      total: schedule.length,
      paid: schedule.filter(item => item.status === 'paid').length,
      pending: schedule.filter(item => item.status === 'due' || item.status === 'overdue').length,
      overdue: schedule.filter(item => item.status === 'overdue').length,
    };

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
          
          {/* NEW: EMI Progress Row */}
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>EMI Progress</Text>
            <View style={styles.emiProgressContainer}>
              <Text style={styles.emiProgressText}>
                {emiCounts.paid}/{emiCounts.total}
              </Text>
              {emiCounts.overdue > 0 && (
                <View style={styles.overdueChip}>
                  <Text style={styles.overdueChipText}>{emiCounts.overdue} overdue</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.balanceRow}>
            <Text style={[styles.dueLabel, isOverdue && styles.overdueText]}>
              {isOverdue ? `Overdue by ${Math.abs(daysUntilDue)} days` : `Due in ${daysUntilDue} days`}
            </Text>
            <Text style={styles.rateLabel}>{loan.interestRate.toFixed(2)}% p.a.</Text>
          </View>
          
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.scheduleButton}
              onPress={async () => {
                // Ensure persisted schedule exists
                if (!loan.schedule || loan.schedule.length === 0) {
                  await save((draft: AppModel) => {
                    const nextLoans = (draft.loanEntries ?? []).map((l: any) => {
                      if (l.id !== loan.id) return l;
                      return {
                        ...l,
                        schedule: buildFullSchedule(l as LoanEntry),
                      };
                    });
                    return { ...draft, loanEntries: nextLoans };
                  });
                  // Get refreshed loan with schedule
                  const refreshed = (state?.loanEntries ?? []).find((l: any) => l.id === loan.id) as LoanEntry | undefined;
                  setSelectedLoanForSchedule(refreshed ?? loan);
                } else {
                  setSelectedLoanForSchedule(loan);
                }
                setScheduleModalVisible(true);
              }}
            >
              <MaterialIcons name="calendar-today" size={16} color="#8B5CF6" />
              <Text style={styles.scheduleButtonText}>View Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };


  const renderAddLoanModal = () => {
    // Get available accounts for preferred account picker
    const accounts = (state?.accounts ?? []) as Array<{
      id: string;
      nickname: string;
      bankName: string;
      balance: { amount: number; currency: string };
    }>;

    return (
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
                {/* Basic Information Section */}
                <View style={styles.sectionDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.sectionDividerText}>Basic Information</Text>
                </View>

                
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
                  <Text style={styles.inputLabel}>Loan Start Date (DD/MM/YYYY) *</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={[styles.textInput, { flex: 1 }]}
                      value={startDay}
                      onChangeText={setStartDay}
                      placeholder="DD"
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <TextInput
                      style={[styles.textInput, { flex: 1 }]}
                      value={startMonth}
                      onChangeText={setStartMonth}
                      placeholder="MM"
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <TextInput
                      style={[styles.textInput, { flex: 2 }]}
                      value={startYear}
                      onChangeText={setStartYear}
                      placeholder="YYYY"
                      keyboardType="number-pad"
                      maxLength={4}
                    />
                  </View>
                </View>

                {/* Loan Terms Section */}
                <View style={styles.sectionDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.sectionDividerText}>Loan Terms</Text>
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

               {/* Payment Settings Section */}
                <View style={[styles.sectionDivider, { marginTop: 20 }]}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.sectionDividerText}>Payment Settings</Text>
                </View>


                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Monthly Due Day *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={monthlyDueDay}
                    onChangeText={setMonthlyDueDay}
                    placeholder="e.g., 15 (15th of every month)"
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>EMIs Already Paid *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={emisPaidSoFar}
                    onChangeText={setEmisPaidSoFar}
                    placeholder="0"
                    keyboardType="number-pad"
                  />
                  <Text style={styles.helpText}>Enter 0 for new loans, or number of EMIs already paid</Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Preferred Payment Account</Text>
                  {accounts.length > 0 ? (
                    <View style={styles.accountPickerContainer}>
                      {accounts.map((account) => (
                        <TouchableOpacity
                          key={account.id}
                          style={[
                            styles.accountPickerOption,
                            preferredAccountId === account.id && styles.accountPickerOptionSelected
                          ]}
                          onPress={() => setPreferredAccountId(account.id)}
                        >
                          <View style={styles.accountPickerLeft}>
                            <Text style={styles.accountPickerName}>{account.nickname}</Text>
                            <Text style={styles.accountPickerBank}>{account.bankName}</Text>
                          </View>
                          <View style={styles.accountPickerRight}>
                            <MaterialIcons 
                              name={preferredAccountId === account.id ? 'radio-button-checked' : 'radio-button-unchecked'} 
                              size={20} 
                              color={preferredAccountId === account.id ? '#8B5CF6' : '#999'} 
                            />
                          </View>
                        </TouchableOpacity>
                      ))}
                      {preferredAccountId && (
                        <TouchableOpacity
                          style={styles.clearSelectionButton}
                          onPress={() => setPreferredAccountId('')}
                        >
                          <Text style={styles.clearSelectionText}>Clear Selection</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.noAccountsText}>No bank accounts available. Add accounts first for EMI auto-debit setup.</Text>
                  )}
                </View>

                {/* Calculated Balance Display */}
                {newPrincipalAmount && newEmiAmount && emisPaidSoFar && (
                  <View style={styles.calculatedSection}>
                    <Text style={styles.calculatedLabel}>Calculated Current Outstanding:</Text>
                    <Text style={styles.calculatedAmount}>
                      {formatFullINR(Math.max(0, parseFloat(newPrincipalAmount || '0') - (parseInt(emisPaidSoFar || '0') * parseFloat(newEmiAmount || '0'))))}
                    </Text>
                    <Text style={styles.calculatedFormula}>
                      Principal - (EMIs Paid × EMI Amount)
                    </Text>
                  </View>
                )}
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
  };


  if (loading) {
    return (
      <ScreenLayout>
        <View style={{ padding: 16 }}>
          <Text>Loading loans data…</Text>
        </View>
      </ScreenLayout>
    );
  }

// Enhanced dual-entry EMI payment processing 
const markEmiAsPaid = async (loan: LoanEntry, dueDate: Date, amount: number) => {
  const accounts = (state?.accounts ?? []) as Array<{
    id: string;
    nickname: string;
    balance: { amount: number; currency: string };
  }>;

  if (accounts.length === 0) {
    Alert.alert('No Accounts', 'Please add a bank account first to process EMI payment.');
    return;
  }

  // For now, use first available account. Future: store preferred account in loan.
  const sourceAccount = accounts[0];

  // Optional: Check balance before processing
  if (sourceAccount.balance.amount < amount) {
    Alert.alert(
      'Insufficient Balance',
      `Account: ${formatFullINR(sourceAccount.balance.amount)}\nEMI: ${formatFullINR(amount)}\n\nThis will result in negative balance. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => processEmiPayment(loan, dueDate, amount, sourceAccount) }
      ]
    );
    return;
  }

  processEmiPayment(loan, dueDate, amount, sourceAccount);
};

const processEmiPayment = async (loan: LoanEntry, dueDate: Date, amount: number, sourceAccount: any) => {
  const now = new Date();
  const roundedAmount = Math.round(amount);

  try {
    await save((draft: AppModel) => {
      // 1. Update loan: persist to both schedule AND linkedTransactions
      const nextLoans: LoanEntry[] = (draft.loanEntries ?? []).map((l: any) => {
        if (l.id !== loan.id) return l as LoanEntry;

        // Update linkedTransactions
        const txs = Array.isArray(l.linkedTransactions) ? [...l.linkedTransactions] : [];
        const exists = txs.some((t: any) => 
          t?.type === 'EMI_PAYMENT' &&
          t?.dueDate &&
          new Date(t.dueDate).getFullYear() === dueDate.getFullYear() &&
          new Date(t.dueDate).getMonth() === dueDate.getMonth()
        );

        if (!exists) {
          txs.push({
            id: `${Date.now()}-emi`,
            type: 'EMI_PAYMENT',
            amount: { amount: roundedAmount, currency: 'INR' },
            dueDate: dueDate,
            paidOn: now,
            notes: `EMI paid from ${sourceAccount.nickname}`,
            sourceAccountId: sourceAccount.id,
            status: 'completed',
          });
        }

        // Update persisted schedule item to paid (PRIMARY STATUS SOURCE)
        const schedule: LoanScheduleItem[] = Array.isArray(l.schedule) ? [...l.schedule] : buildFullSchedule(l as LoanEntry);
        const scheduleIdx = schedule.findIndex((it) => 
          it.dueDate.getFullYear() === dueDate.getFullYear() && 
          it.dueDate.getMonth() === dueDate.getMonth()
        );
        
        if (scheduleIdx >= 0) {
          schedule[scheduleIdx] = {
            ...schedule[scheduleIdx],
            status: 'paid',
            paidOn: now,
            sourceAccountId: sourceAccount.id,
            notes: `Paid from ${sourceAccount.nickname}`,
          };
        }

        // Reduce loan balance and advance nextPaymentDate
        const newBalance = Math.max(0, l.currentBalance.amount - roundedAmount);
        const nextDue = new Date(l.nextPaymentDate);
        nextDue.setMonth(nextDue.getMonth() + 1);

        return {
          ...l,
          linkedTransactions: txs,
          schedule: schedule,
          currentBalance: { ...l.currentBalance, amount: newBalance },
          nextPaymentDate: nextDue,
          auditTrail: l.auditTrail ? {
            ...l.auditTrail,
            updatedAt: now,
            version: (l.auditTrail.version ?? 1) + 1,
            changes: [
              ...(l.auditTrail.changes ?? []),
              {
                action: 'EMI_PAYMENT_PROCESSED',
                timestamp: now,
                dueDate,
                amount: roundedAmount,
                sourceAccountId: sourceAccount.id,
                newBalance,
              }
            ],
          } : undefined,
        } as LoanEntry;
      });

      // 2. Update bank account: add withdrawal transaction and reduce balance
      const nextAccounts = (draft.accounts ?? []).map((account: any) => {
        if (account.id === sourceAccount.id) {
          const existingTransactions = account.transactions ?? [];
          const emiWithdrawal = {
            id: `${Date.now()}-emi-withdrawal`,
            datetime: now,
            amount: { amount: -roundedAmount, currency: 'INR' },
            description: `EMI Payment - ${loan.bank} ${loan.type.toUpperCase()}`,
            type: 'withdrawal',
            notes: `EMI for ${dueDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`,
            source: 'manual',
            status: 'completed',
          };

          return {
            ...account,
            transactions: [...existingTransactions, emiWithdrawal],
            balance: {
              ...account.balance,
              amount: account.balance.amount - roundedAmount
            },
            lastSynced: now,
          };
        }
        return account;
      });

      return {
        ...draft,
        loanEntries: nextLoans,
        accounts: nextAccounts,
      };
    });

    // Success: Close and reopen modal with fresh data (no more hooks in handlers)
    setScheduleModalVisible(false);
    
    //setTimeout(() => {
    //  const updatedLoan = (state?.loanEntries ?? []).find((l: any) => l.id === loan.id) as LoanEntry | undefined;
    //  if (updatedLoan) {
    //    setSelectedLoanForSchedule(updatedLoan);
    //    setScheduleModalVisible(true);
    //  }
    //}, 200);

    Alert.alert(
      'EMI Payment Confirmed',
      `EMI for ${dueDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} processed successfully.

    BANK ACCOUNT:
    ${sourceAccount.nickname}
    Previous Balance: ${formatFullINR(sourceAccount.balance.amount)}
    Amount Debited: ${formatFullINR(roundedAmount)}
    New Balance: ${formatFullINR(sourceAccount.balance.amount - roundedAmount)}

    LOAN DETAILS:
    Previous Outstanding: ${formatFullINR(loan.currentBalance.amount)}
    EMI Amount: ${formatFullINR(roundedAmount)}
    New Outstanding: ${formatFullINR(Math.max(0, loan.currentBalance.amount - roundedAmount))}

    Use "View Schedule" on the loan card to see updated payment status.`,
      [{ text: 'OK', style: 'default' }]
    );

  } catch (e) {
    console.error('EMI payment error:', e);
    Alert.alert('Error', 'Failed to process EMI payment. Please try again.');
  }
};





  // EMI Schedule modal renderer - must be inside LoansScreen to access state
const renderScheduleModal = () => {
  if (!selectedLoanForSchedule) return null;

  // Use persisted schedule; if missing, derive once (fallback)
  const persistedSchedule = selectedLoanForSchedule.schedule ?? buildFullSchedule(selectedLoanForSchedule);

  // Find index to scroll to: first upcoming or last overdue
  const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const scrollToIndex = Math.max(0, persistedSchedule.findIndex(s => s.dueDate >= currentMonthStart));

  return (
    <Modal
      visible={scheduleModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setScheduleModalVisible(false)}
      key={selectedLoanForSchedule?.id ?? 'no-loan'}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              EMI Schedule - {selectedLoanForSchedule.type.toUpperCase()}
            </Text>
            <TouchableOpacity onPress={() => setScheduleModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.scheduleSubtitle}>
              {selectedLoanForSchedule.bank} • {selectedLoanForSchedule.loanNumber}
            </Text>
            <Text style={[styles.scheduleSubtitle, { fontSize: 12, marginBottom: 8 }]}>
              {persistedSchedule.length} EMIs • Showing full tenure
            </Text>

            {/* Auto-scrolling list from start→end */}
            <FlatList
              data={persistedSchedule}
              keyExtractor={(item) => item.id}
              initialScrollIndex={scrollToIndex}
              getItemLayout={(data, index) => ({ length: 56, offset: 56 * index, index })}
              showsVerticalScrollIndicator={true}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <View style={styles.scheduleRow}>
                  <View style={styles.scheduleLeft}>
                    <Text style={styles.scheduleMonth}>
                      {item.dueDate.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
                    </Text>
                    <Text style={styles.scheduleDate}>
                      Due: {item.dueDate.getDate()}/{item.dueDate.getMonth() + 1}
                    </Text>
                  </View>

                  <View style={styles.scheduleCenter}>
                    <Text style={styles.scheduleAmount}>
                      {formatFullINR(item.amount.amount)}
                    </Text>
                  </View>

                  <View style={styles.scheduleRight}>
                    <TouchableOpacity 
                      style={[
                        styles.statusButton, 
                        item.status === 'paid' && styles.statusButtonPaid,
                        item.status === 'overdue' && styles.statusButtonOverdue
                      ]}
                      onPress={() => {
                        if (!selectedLoanForSchedule) return;
                        if (item.status === 'paid') {
                          Alert.alert('Already Paid', 'This EMI is already marked as paid.');
                          return;
                        }
                        setSelectedEmiItem({ dueDate: item.dueDate, amount: item.amount.amount });
                        setPaymentAccountModalVisible(true);
                      }}
                    >
                      <MaterialIcons 
                        name={item.status === 'paid' ? 'check-circle' : 'radio-button-unchecked'} 
                        size={20} 
                        color={item.status === 'paid' ? '#27AE60' : '#999'} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};


  // Account selection modal for EMI payments
  const renderPaymentAccountModal = () => {
    const accounts = (state?.accounts ?? []) as Array<{
      id: string;
      nickname: string;
      bankName: string;
      balance: { amount: number; currency: string };
    }>;

    if (!selectedEmiItem) return null;

    return (
      <Modal
        visible={paymentAccountModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentAccountModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '60%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Payment Account</Text>
              <TouchableOpacity onPress={() => setPaymentAccountModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>
                EMI Amount: {formatFullINR(selectedEmiItem.amount)}
              </Text>
              <Text style={[styles.inputLabel, { marginBottom: 16 }]}>
                Due: {selectedEmiItem.dueDate.toLocaleDateString('en-IN')}
              </Text>

              {accounts.length > 0 ? accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.accountOption,
                    selectedPaymentAccount === account.id && styles.accountOptionSelected
                  ]}
                  onPress={() => setSelectedPaymentAccount(account.id)}
                >
                  <View style={styles.accountOptionLeft}>
                    <Text style={styles.accountOptionName}>{account.nickname}</Text>
                    <Text style={styles.accountOptionBank}>{account.bankName}</Text>
                  </View>
                  <View style={styles.accountOptionRight}>
                    <Text style={[
                      styles.accountOptionBalance,
                      account.balance.amount < selectedEmiItem.amount && styles.insufficientBalance
                    ]}>
                      {formatFullINR(account.balance.amount)}
                    </Text>
                    {account.balance.amount < selectedEmiItem.amount && (
                      <Text style={styles.warningText}>Insufficient</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )) : (
                <Text style={styles.emptyText}>No accounts available</Text>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setPaymentAccountModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!selectedPaymentAccount || !selectedLoanForSchedule) && styles.disabledButton
                ]}
                onPress={async () => {
                  if (!selectedPaymentAccount || !selectedLoanForSchedule || !selectedEmiItem) return;
                  
                  const account = accounts.find(a => a.id === selectedPaymentAccount);
                  if (!account) return;

                 setPaymentAccountModalVisible(false);
                  // Reset selection to avoid stale value on next open
                  setSelectedPaymentAccount('');
                  await processEmiPayment(selectedLoanForSchedule, selectedEmiItem.dueDate, selectedEmiItem.amount, account);

                }}
                disabled={!selectedPaymentAccount || !selectedLoanForSchedule}
              >
                <Text style={styles.primaryButtonText}>Process EMI Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };


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
      {renderScheduleModal()}
      {renderPaymentAccountModal()}
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6' + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  scheduleButtonText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  scheduleSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  scheduleLeft: {
    flex: 2,
  },
  scheduleCenter: {
    flex: 2,
    alignItems: 'center',
  },
  scheduleRight: {
    flex: 1,
    alignItems: 'center',
  },
  scheduleMonth: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  scheduleDate: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  scheduleAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
  },
  statusButton: {
    padding: 4,
  },
  statusButtonPaid: {
    backgroundColor: '#27AE60' + '15',
    borderRadius: 12,
  },
  statusButtonOverdue: {
    backgroundColor: '#E74C3C' + '15',
    borderRadius: 12,
  },
  accountOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: Colors.background.secondary,
  },
  accountOptionSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#8B5CF6' + '10',
  },
  accountOptionLeft: {
    flex: 1,
  },
  accountOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  accountOptionBank: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  accountOptionRight: {
    alignItems: 'flex-end',
  },
  accountOptionBalance: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  insufficientBalance: {
    color: '#E74C3C',
  },
  warningText: {
    fontSize: 10,
    color: '#E74C3C',
    fontWeight: '600',
    marginTop: 2,
  },
  helpText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  accountPickerContainer: {
    marginTop: 8,
  },
  accountPickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: Colors.background.secondary,
  },
  accountPickerOptionSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#8B5CF6' + '10',
  },
  accountPickerLeft: {
    flex: 1,
  },
  accountPickerName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  accountPickerBank: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  accountPickerRight: {
    paddingLeft: 8,
  },
  clearSelectionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  clearSelectionText: {
    fontSize: 12,
    color: '#666',
    textDecorationLine: 'underline',
  },
  noAccountsText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    padding: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  calculatedSection: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  calculatedLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  calculatedAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 4,
  },
  calculatedFormula: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E0E0E0',
  },
  sectionDividerText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginLeft: 12,
    paddingHorizontal: 8,
    backgroundColor: Colors.background.secondary,
  },
  emiProgressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    emiProgressText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#4CAF50', // Green for progress
    },
    overdueChip: {
      backgroundColor: '#E74C3C',
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    overdueChipText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#FFFFFF',
    },
});

export default LoansScreen;

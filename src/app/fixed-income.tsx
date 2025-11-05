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
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenLayout from '../components/ScreenLayout';
import { Colors } from '../utils/theme';
import { useStorage, type AppModel, type FixedIncomeEntry } from '../services/storage/StorageProvider';
import TransactionsModal from '../components/modals/TransactionsModal';
import type { FilterCriteria } from '../types/transactions';
import AppFooter from '../components/AppFooter';

type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'SGD' | 'CHF';

const instrumentTypes = [
  { key: 'fd', label: 'Fixed Deposit' },
  { key: 'rd', label: 'Recurring Deposit' },
  { key: 'nre', label: 'NRE Deposit' },
  { key: 'nro', label: 'NRO Deposit' },        // ADD this line
  { key: 'fcnr', label: 'FCNR Deposit' },
  { key: 'company_deposit', label: 'Company Deposit' },
  { key: 'debt', label: 'Debt Instrument' },
  // Remove 'other' option to match the interface
] as const;


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
    const result = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + 
                  (otherNumbers ? ',' : '') + lastThree;
    return `${sign}₹${result}`;
  }
};

const FixedIncomeScreen: React.FC = () => {
  const router = useRouter();
  const { state, save, loading } = useStorage();

  const entries: FixedIncomeEntry[] = (state?.fixedIncomeEntries as FixedIncomeEntry[] | undefined) ?? [];

  const totalFixedIncome = useMemo(
    () => entries.reduce((sum, fi) => sum + (fi.currentValue?.amount ?? 0), 0),
    [entries]
  );
  // NEW: Specialized modal states
  const [isBankDepositModalVisible, setIsBankDepositModalVisible] = useState(false);
  const [isCompanyDepositModalVisible, setIsCompanyDepositModalVisible] = useState(false);
  const [isFCNRModalVisible, setIsFCNRModalVisible] = useState(false);
  const [isDebtModalVisible, setIsDebtModalVisible] = useState(false);

  // Add form state
    const [instrumentType, setInstrumentType] = useState<'fd' | 'rd' | 'nre' | 'nro' | 'fcnr' | 'company_deposit' | 'debt'>('fd');
    const [bankOrIssuer, setBankOrIssuer] = useState('');
    const [instrumentName, setInstrumentName] = useState('');
    const [principalAmount, setPrincipalAmount] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [compoundingFrequency, setCompoundingFrequency] = useState<'annually' | 'monthly' | 'quarterly' | 'daily'>('annually');
    const [startDateStr, setStartDateStr] = useState('');
    const [maturityDateStr, setMaturityDateStr] = useState('');
    const [autoRenew, setAutoRenew] = useState(false);
    const [notes, setNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // ADD: New form fields for specialized modals
    const [interestPayout, setInterestPayout] = useState<'monthly' | 'quarterly' | 'annually' | 'cumulative' | 'maturity'>('maturity');
    const [payoutAccountId, setPayoutAccountId] = useState('');
    const [currency, setCurrency] = useState('INR');

    // RD-specific fields
    const [recurringDepositDay, setRecurringDepositDay] = useState<number>(1);
    const [sourceAccountId, setSourceAccountId] = useState('');
    const [installmentAmount, setInstallmentAmount] = useState('');

    // Company-specific fields
    const [companyName, setCompanyName] = useState('');

    // Debt-specific fields
    const [bondType, setBondType] = useState<'government' | 'corporate' | 'municipal'>('government');
    const [creditRating, setCreditRating] = useState('');
    const [isinCode, setIsinCode] = useState('');
    const [faceValueStr, setFaceValueStr] = useState('');
    const [couponRate, setCouponRate] = useState('');
    const [yieldToMaturity, setYieldToMaturity] = useState('');
    const [hasCallOption, setHasCallOption] = useState(false);
    const [hasPutOption, setHasPutOption] = useState(false);


  // TransactionsModal
  const [txModalVisible, setTxModalVisible] = useState(false);
  const [txFilter, setTxFilter] = useState<FilterCriteria | null>(null);

  const formatDateLabel = (d: Date) => {
    try {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const onOpenAllTransactions = () => {
    setTxFilter({
      assetType: 'investment', // future: a dedicated type if needed; we will still use the modal framework
      filterType: 'all',
      assetLabel: 'All Fixed Income',
    });
    setTxModalVisible(true);
  };

  const onOpenInstrumentTransactions = (fi: FixedIncomeEntry) => {
    setTxFilter({
      assetType: 'investment', // future granular type mapping can be added to TransactionsModal
      filterType: 'category',
      assetLabel: `${fi.instrumentName} • ${fi.bankOrIssuer}`,
      assetId: fi.id,
    });
    setTxModalVisible(true);
  };

  // REPLACE the handleAddFixedIncome function with these 4 handlers:

    const saveBankDeposit = async () => {
    if (isProcessing) return;

    // Validation
    if (!bankOrIssuer.trim() || !principalAmount.trim()) {
        Alert.alert('Missing Info', 'Please fill bank name and principal amount.');
        return;
    }
    const principal = Number(principalAmount);
    if (!Number.isFinite(principal) || principal <= 0) {
        Alert.alert('Invalid Principal', 'Please enter a valid principal amount.');
        return;
    }

    setIsProcessing(true);
    try {
        const now = new Date();
        const start = startDateStr ? new Date(startDateStr) : now;
        const maturity = maturityDateStr ? new Date(maturityDateStr) : new Date(now.getTime() + 365 * 24 * 3600 * 1000);

        const entry: FixedIncomeEntry = {
        id: `${Date.now()}`,
        instrumentType,
        bankOrIssuer: bankOrIssuer.trim(),
        bankName: bankOrIssuer.trim(),
        instrumentName: instrumentName.trim() || `${instrumentType.toUpperCase()} - ${bankOrIssuer.trim()}`,
        principalAmount: { amount: Math.round(principal), currency: 'INR' },
        currentValue: { amount: Math.round(principal), currency: 'INR' },
        interestRate: Number(interestRate) || 0,
        compoundingFrequency,
        interestPayout,
        startDate: start,
        maturityDate: maturity,
        autoRenew,
        isActive: true,
        nomineeDetails: undefined,
        jointHolders: undefined,
        notes: notes?.trim() || undefined,
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
            action: 'ADD_FIXED_INCOME',
            timestamp: now,
            principal: Math.round(principal),
            bankOrIssuer: bankOrIssuer.trim(),
            instrumentType,
            }],
        },
        linkedTransactions: [],
        };

        await save((draft: AppModel) => {
        const next = draft.fixedIncomeEntries ? [...draft.fixedIncomeEntries] as FixedIncomeEntry[] : [];
        next.push(entry);
        return { ...draft, fixedIncomeEntries: next };
        });

        // Reset and close
        resetFormFields();
        setIsBankDepositModalVisible(false);

    } catch (e) {
        Alert.alert('Error', 'Failed to add bank deposit. Please try again.');
    } finally {
        setIsProcessing(false);
    }
    };

    const saveCompanyDeposit = async () => {
    if (isProcessing) return;

    if (!companyName.trim() || !principalAmount.trim()) {
        Alert.alert('Missing Info', 'Please fill company name and principal amount.');
        return;
    }
    const principal = Number(principalAmount);
    if (!Number.isFinite(principal) || principal <= 0) {
        Alert.alert('Invalid Principal', 'Please enter a valid principal amount.');
        return;
    }

    setIsProcessing(true);
    try {
        const now = new Date();
        const start = startDateStr ? new Date(startDateStr) : now;
        const maturity = maturityDateStr ? new Date(maturityDateStr) : new Date(now.getTime() + 365 * 24 * 3600 * 1000);

        const entry: FixedIncomeEntry = {
        id: `${Date.now()}`,
        instrumentType: 'company_deposit',
        bankOrIssuer: companyName.trim(),
        bankName: companyName.trim(),
        instrumentName: instrumentName.trim() || `Company Deposit - ${companyName.trim()}`,
        principalAmount: { amount: Math.round(principal), currency: 'INR' },
        currentValue: { amount: Math.round(principal), currency: 'INR' },
        interestRate: Number(interestRate) || 0,
        compoundingFrequency,
        interestPayout,
        startDate: start,
        maturityDate: maturity,
        autoRenew,
        isActive: true,
        nomineeDetails: undefined,
        jointHolders: undefined,
        notes: notes?.trim() || undefined,
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
            action: 'ADD_FIXED_INCOME',
            timestamp: now,
            principal: Math.round(principal),
            bankOrIssuer: companyName.trim(),
            instrumentType: 'company_deposit',
            }],
        },
        linkedTransactions: [],
        };

        await save((draft: AppModel) => {
        const next = draft.fixedIncomeEntries ? [...draft.fixedIncomeEntries] as FixedIncomeEntry[] : [];
        next.push(entry);
        return { ...draft, fixedIncomeEntries: next };
        });

        resetFormFields();
        setIsCompanyDepositModalVisible(false);

    } catch (e) {
        Alert.alert('Error', 'Failed to add company deposit. Please try again.');
    } finally {
        setIsProcessing(false);
    }
    };

    const saveFCNRDeposit = async () => {
    if (isProcessing) return;

    if (!bankOrIssuer.trim() || !principalAmount.trim()) {
        Alert.alert('Missing Info', 'Please fill bank name and principal amount.');
        return;
    }
    const principal = Number(principalAmount);
    if (!Number.isFinite(principal) || principal <= 0) {
        Alert.alert('Invalid Principal', 'Please enter a valid principal amount.');
        return;
    }

    setIsProcessing(true);
    try {
        const now = new Date();
        const start = startDateStr ? new Date(startDateStr) : now;
        const maturity = maturityDateStr ? new Date(maturityDateStr) : new Date(now.getTime() + 365 * 24 * 3600 * 1000);

        const entry: FixedIncomeEntry = {
        id: `${Date.now()}`,
        instrumentType: 'fcnr',
        bankOrIssuer: bankOrIssuer.trim(),
        bankName: bankOrIssuer.trim(),
        instrumentName: instrumentName.trim() || `FCNR ${currency} - ${bankOrIssuer.trim()}`,
        principalAmount: { amount: Math.round(principal), currency: currency as Currency },
        currentValue: { amount: Math.round(principal), currency: currency as Currency },
        interestRate: Number(interestRate) || 0,
        compoundingFrequency,
        interestPayout,
        startDate: start,
        maturityDate: maturity,
        autoRenew,
        isActive: true,
        nomineeDetails: undefined,
        jointHolders: undefined,
        notes: notes?.trim() || undefined,
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
            action: 'ADD_FIXED_INCOME',
            timestamp: now,
            principal: Math.round(principal),
            bankOrIssuer: bankOrIssuer.trim(),
            instrumentType: 'fcnr',
            }],
        },
        linkedTransactions: [],
        };

        await save((draft: AppModel) => {
        const next = draft.fixedIncomeEntries ? [...draft.fixedIncomeEntries] as FixedIncomeEntry[] : [];
        next.push(entry);
        return { ...draft, fixedIncomeEntries: next };
        });

        resetFormFields();
        setIsFCNRModalVisible(false);

    } catch (e) {
        Alert.alert('Error', 'Failed to add FCNR deposit. Please try again.');
    } finally {
        setIsProcessing(false);
    }
    };

    const saveDebtInstrument = async () => {
    if (isProcessing) return;

    if (!bankOrIssuer.trim() || !principalAmount.trim()) {
        Alert.alert('Missing Info', 'Please fill issuer name and principal amount.');
        return;
    }
    const principal = Number(principalAmount);
    if (!Number.isFinite(principal) || principal <= 0) {
        Alert.alert('Invalid Principal', 'Please enter a valid principal amount.');
        return;
    }

    setIsProcessing(true);
    try {
        const now = new Date();
        const start = startDateStr ? new Date(startDateStr) : now;
        const maturity = maturityDateStr ? new Date(maturityDateStr) : new Date(now.getTime() + 365 * 24 * 3600 * 1000);

        const entry: FixedIncomeEntry = {
        id: `${Date.now()}`,
        instrumentType: 'debt',
        bankOrIssuer: bankOrIssuer.trim(),
        bankName: bankOrIssuer.trim(),
        instrumentName: instrumentName.trim() || `${bondType.toUpperCase()} Bond - ${bankOrIssuer.trim()}`,
        principalAmount: { amount: Math.round(principal), currency: 'INR' },
        currentValue: { amount: Math.round(principal), currency: 'INR' },
        interestRate: Number(interestRate) || 0,
        compoundingFrequency,
        interestPayout,
        startDate: start,
        maturityDate: maturity,
        autoRenew,
        isActive: true,
        nomineeDetails: undefined,
        jointHolders: undefined,
        notes: notes?.trim() || undefined,
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
            action: 'ADD_FIXED_INCOME',
            timestamp: now,
            principal: Math.round(principal),
            bankOrIssuer: bankOrIssuer.trim(),
            instrumentType: 'debt',
            }],
        },
        linkedTransactions: [],
        };

        await save((draft: AppModel) => {
        const next = draft.fixedIncomeEntries ? [...draft.fixedIncomeEntries] as FixedIncomeEntry[] : [];
        next.push(entry);
        return { ...draft, fixedIncomeEntries: next };
        });

        resetFormFields();
        setIsDebtModalVisible(false);

    } catch (e) {
        Alert.alert('Error', 'Failed to add debt instrument. Please try again.');
    } finally {
        setIsProcessing(false);
    }
    };

    // ADD this helper function for form reset:
    const resetFormFields = () => {
    setInstrumentType('fd');
    setBankOrIssuer('');
    setInstrumentName('');
    setPrincipalAmount('');
    setInterestRate('');
    setCompoundingFrequency('annually');
    setStartDateStr('');
    setMaturityDateStr('');
    setAutoRenew(false);
    setNotes('');
    setInterestPayout('maturity');
    setPayoutAccountId('');
    setCurrency('INR');
    setRecurringDepositDay(1);
    setSourceAccountId('');
    setInstallmentAmount('');
    setCompanyName('');
    setBondType('government');
    setCreditRating('');
    setIsinCode('');
    setFaceValueStr('');
    setCouponRate('');
    setYieldToMaturity('');
    setHasCallOption(false);
    setHasPutOption(false);
    };


  const renderHeader = () => (
    <View style={styles.header}>
        <Text style={styles.headerTitle}>Fixed Income</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setIsBankDepositModalVisible(true)}>
        <MaterialIcons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
    </View>
  );


  const renderTotalCard = () => (
    <TouchableOpacity activeOpacity={0.9} onPress={onOpenAllTransactions}>
      <LinearGradient colors={['#1976D2', '#1565C0']} style={styles.totalCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.totalLabel}>Total Fixed Income</Text>
          <MaterialIcons name="chevron-right" size={20} color="#FFFFFF" />
        </View>
        <Text style={styles.totalAmount}>
          {formatFullINR(totalFixedIncome)}
        </Text>
        <Text style={styles.entriesCount}>
          {entries.length} {entries.length === 1 ? 'Instrument' : 'Instruments'}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderInstrumentCard = (fi: FixedIncomeEntry) => (
    <TouchableOpacity
      key={fi.id}
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => onOpenInstrumentTransactions(fi)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconCircle, { backgroundColor: '#1976D2' }]}>
            <MaterialIcons name="savings" size={22} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{fi.instrumentName}</Text>
            <Text style={styles.cardSubtitle}>{fi.bankOrIssuer} • {fi.instrumentType.toUpperCase()}</Text>
            <Text style={styles.cardSubtle}>
              {`Start: ${formatDateLabel(fi.startDate)} • Maturity: ${formatDateLabel(fi.maturityDate)}`}
            </Text>
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={Colors.text.secondary} />
      </View>

      <View style={styles.balanceRow}>
        <View>
          <Text style={styles.balanceLabel}>Principal</Text>
          <Text style={styles.balanceAmountSecondary}>{formatFullINR(fi.principalAmount.amount)}</Text>
        </View>
        <View>
          <Text style={styles.balanceLabel}>Current Value</Text>
          <Text style={styles.balanceAmountPrimary}>{formatFullINR(fi.currentValue.amount)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  
    const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionGrid}>
        <TouchableOpacity style={styles.actionButton} onPress={() => setIsBankDepositModalVisible(true)}>
            <MaterialIcons name="account-balance" size={24} color="#1976D2" />
            <Text style={styles.actionText}>Add Bank Deposits</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => setIsCompanyDepositModalVisible(true)}>
            <MaterialIcons name="domain" size={24} color="#1976D2" />
            <Text style={styles.actionText}>Add Company Deposit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => setIsFCNRModalVisible(true)}>
            <MaterialIcons name="currency-exchange" size={24} color="#1976D2" />
            <Text style={styles.actionText}>Add FCNR Deposits</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => setIsDebtModalVisible(true)}>
            <MaterialIcons name="receipt-long" size={24} color="#1976D2" />
            <Text style={styles.actionText}>Add Debt Instruments</Text>
        </TouchableOpacity>
        </View>
    </View>
    );


  // REMOVE the existing renderAddModal function entirely

// ADD: Bank Deposit Modal (FD/RD/NRE/NRO)
const renderBankDepositModal = () => (
  <Modal
    visible={isBankDepositModalVisible}
    transparent
    animationType="slide"
    onRequestClose={() => setIsBankDepositModalVisible(false)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Bank Deposits</Text>
          <TouchableOpacity onPress={() => setIsBankDepositModalVisible(false)}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.modalBody}>
            {/* Instrument Type */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Deposit Type *</Text>
              <View style={styles.pickerRow}>
                {[
                  { key: 'fd', label: 'Fixed Deposit' },
                  { key: 'rd', label: 'Recurring Deposit' },
                  { key: 'nre', label: 'NRE Deposit' },
                  { key: 'nro', label: 'NRO Deposit' },
                ].map(t => (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.pill, instrumentType === t.key && styles.pillSelected]}
                    onPress={() => setInstrumentType(t.key as any)}
                  >
                    <Text style={[styles.pillText, instrumentType === t.key && styles.pillTextSelected]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bank Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Bank Name *</Text>
              <TextInput
                style={styles.textInput}
                value={bankOrIssuer}
                onChangeText={setBankOrIssuer}
                placeholder="e.g., HDFC Bank, SBI"
              />
            </View>

            {/* Basic Fields - Principal, Interest Rate, Dates */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Principal Amount (₹) *</Text>
              <TextInput
                style={styles.textInput}
                value={principalAmount}
                onChangeText={setPrincipalAmount}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>

            {/* Interest Payout */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Interest Payout</Text>
              <View style={styles.pickerRow}>
                {(['monthly','quarterly','annually','cumulative','maturity'] as const).map(payout => (
                  <TouchableOpacity
                    key={payout}
                    style={[styles.pill, interestPayout === payout && styles.pillSelected]}
                    onPress={() => setInterestPayout(payout)}
                  >
                    <Text style={[styles.pillText, interestPayout === payout && styles.pillTextSelected]}>
                      {payout.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* RD-specific fields */}
            {instrumentType === 'rd' && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Monthly Deposit Day (1-31)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={recurringDepositDay.toString()}
                    onChangeText={(val) => setRecurringDepositDay(parseInt(val) || 1)}
                    placeholder="15"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Monthly Installment (₹)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={installmentAmount}
                    onChangeText={setInstallmentAmount}
                    placeholder="5000"
                    keyboardType="numeric"
                  />
                </View>
              </>
            )}

            {/* Placeholder for other common fields */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 60 }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Additional details"
                multiline
              />
            </View>
          </View>
        </ScrollView>
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setIsBankDepositModalVisible(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={saveBankDeposit}>
            <Text style={styles.primaryButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// ADD: Company Deposit Modal
const renderCompanyDepositModal = () => (
  <Modal
    visible={isCompanyDepositModalVisible}
    transparent
    animationType="slide"
    onRequestClose={() => setIsCompanyDepositModalVisible(false)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Company Deposit</Text>
          <TouchableOpacity onPress={() => setIsCompanyDepositModalVisible(false)}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.modalBody}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Company Name *</Text>
              <TextInput
                style={styles.textInput}
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="e.g., Mahindra Finance, Bajaj Finserv"
              />
            </View>
            {/* TODO: Add other fields */}
            <Text style={styles.inputLabel}>More fields coming soon...</Text>
          </View>
        </ScrollView>
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setIsCompanyDepositModalVisible(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={saveCompanyDeposit}>
            <Text style={styles.primaryButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// ADD: FCNR Modal
const renderFCNRModal = () => (
  <Modal
    visible={isFCNRModalVisible}
    transparent
    animationType="slide"
    onRequestClose={() => setIsFCNRModalVisible(false)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>FCNR Deposit</Text>
          <TouchableOpacity onPress={() => setIsFCNRModalVisible(false)}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.modalBody}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Currency *</Text>
              <View style={styles.pickerRow}>
                {['USD','EUR','GBP','JPY','AUD','CAD','SGD','CHF'].map(curr => (
                  <TouchableOpacity
                    key={curr}
                    style={[styles.pill, currency === curr && styles.pillSelected]}
                    onPress={() => setCurrency(curr)}
                  >
                    <Text style={[styles.pillText, currency === curr && styles.pillTextSelected]}>
                      {curr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {/* TODO: Add other fields */}
            <Text style={styles.inputLabel}>More fields coming soon...</Text>
          </View>
        </ScrollView>
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setIsFCNRModalVisible(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={saveFCNRDeposit}>
            <Text style={styles.primaryButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// ADD: Debt Instruments Modal
const renderDebtModal = () => (
  <Modal
    visible={isDebtModalVisible}
    transparent
    animationType="slide"
    onRequestClose={() => setIsDebtModalVisible(false)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Debt Instruments</Text>
          <TouchableOpacity onPress={() => setIsDebtModalVisible(false)}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.modalBody}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Bond Type *</Text>
              <View style={styles.pickerRow}>
                {(['government','corporate','municipal'] as const).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.pill, bondType === type && styles.pillSelected]}
                    onPress={() => setBondType(type)}
                  >
                    <Text style={[styles.pillText, bondType === type && styles.pillTextSelected]}>
                      {type.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {/* TODO: Add other fields */}
            <Text style={styles.inputLabel}>More fields coming soon...</Text>
          </View>
        </ScrollView>
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setIsDebtModalVisible(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={saveDebtInstrument}>
            <Text style={styles.primaryButtonText}>Save</Text>
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
          <Text>Loading fixed income data…</Text>
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
        <View style={styles.containerPad}>
          <Text style={styles.sectionTitle}>Your Fixed Income Instruments</Text>
          {entries.length > 0 ? (
            entries.map(renderInstrumentCard)
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="savings" size={64} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>No fixed income instruments</Text>
              <Text style={styles.emptySubtitle}>Add your first FD/RD/NRE/FCNR or company deposit</Text>
            </View>
          )}
        </View>
        <AppFooter />
      </ScrollView>

      {renderBankDepositModal()}
      {renderCompanyDepositModal()}
      {renderFCNRModal()}
      {renderDebtModal()}

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
  scrollView: { flex: 1 },
  containerPad: { paddingHorizontal: 16, marginBottom: 100 },
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  headerTitle: { fontSize: 24, fontWeight: '600', color: Colors.text.primary },
  addButton: { backgroundColor: '#8B5CF6', borderRadius: 20, padding: 8 },
  totalCard: {
    marginHorizontal: 16, marginVertical: 16, padding: 24, borderRadius: 16,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8,
  },
  totalLabel: { fontSize: 14, color: '#FFFFFF', opacity: 0.9, marginBottom: 8 },
  totalAmount: { fontSize: 32, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  entriesCount: { fontSize: 12, color: '#FFFFFF', opacity: 0.8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.text.primary, marginBottom: 12 },
  card: {
    backgroundColor: Colors.background.secondary, padding: 16, borderRadius: 12, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: Colors.text.primary, marginBottom: 2 },
  cardSubtitle: { fontSize: 14, color: Colors.text.secondary, marginBottom: 4 },
  cardSubtle: { fontSize: 12, color: Colors.text.tertiary },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  balanceLabel: { fontSize: 12, color: Colors.text.secondary, marginBottom: 2 },
  balanceAmountSecondary: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  balanceAmountPrimary: { fontSize: 18, fontWeight: '700', color: '#1976D2' },
  quickActionsContainer: { paddingHorizontal: 16, marginBottom: 24 },
  quickActionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionButton: {
    alignItems: 'center', backgroundColor: Colors.background.secondary, padding: 16, borderRadius: 12,
    width: '47%', marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  actionText: { fontSize: 12, color: Colors.text.primary, marginTop: 8, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: Colors.background.secondary, borderRadius: 16, width: '90%', maxWidth: 420, maxHeight: '85%', overflow: 'hidden' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0',
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: Colors.text.primary },
  modalScrollView: { flexGrow: 1 },
  modalBody: { padding: 20 },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 18, fontWeight: '500', color: Colors.text.primary, marginBottom: 8 },
  textInput: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, fontSize: 18, color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
  },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#E0E0E0',
    backgroundColor: Colors.background.secondary,
  },
  pillSelected: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  pillText: { fontSize: 13, color: Colors.text.primary },
  pillTextSelected: { color: Colors.white, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', padding: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E0E0E0' },
  cancelButton: { paddingHorizontal: 16, paddingVertical: 10, marginRight: 12, borderRadius: 10 },
  cancelButtonText: { fontSize: 16, color: '#666666' },
  primaryButton: { backgroundColor: '#8B5CF6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  disabledButton: { backgroundColor: '#C7B8F7' },
  logoContainer: { alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 0 },
  logo: { width: 200, height: 100 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.text.secondary, marginTop: 16, marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: Colors.text.tertiary, textAlign: 'center' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
});
export { FixedIncomeScreen as default };

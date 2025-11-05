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

  // Derive SourceBankAccounts for RD source account picker
  // This intentionally uses a distinct name to avoid confusion with the main Bank Accounts domain.
  // Update the extraction logic when the bank accounts domain is finalized.
  const SourceBankAccounts = useMemo(() => {
    // Preferred: state.bankAccounts (when implemented)
    // For now: try to leverage accounts.tsx shape if present in AppModel
    const entries = (state as any)?.accounts ?? [];
    if (!Array.isArray(entries)) return [];
    // Normalize into id + label
    return entries.map((a: any) => {
      const id = a?.id ?? `${a?.bank ?? 'Bank'}-${a?.accountNumber ?? 'XXXX'}`;
      const label = [a?.bank, a?.accountNumber].filter(Boolean).join(' • ') || 'Account';
      return { id, label };
    });
  }, [state]);


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
  const [isRecurringModalVisible, setIsRecurringModalVisible] = useState(false);

  // Add form state
    const [instrumentType, setInstrumentType] = useState<'fd' | 'rd' | 'nre' | 'nro' | 'fcnr' | 'company_deposit' | 'debt'>('fd');
    const [bankOrIssuer, setBankOrIssuer] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
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
    const [maturityAmountStr, setMaturityAmountStr] = useState('');


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

    // Enhanced Validation
    if (!bankOrIssuer.trim() || !principalAmount.trim()) {
      Alert.alert('Missing Info', 'Please fill bank name and principal amount.');
      return;
    }
    
    const principal = Number(principalAmount);
    if (!Number.isFinite(principal) || principal <= 0) {
      Alert.alert('Invalid Principal', 'Please enter a valid principal amount.');
      return;
    }

    // Maturity Amount validation
    if (!maturityAmountStr.trim()) {
      Alert.alert('Missing Info', 'Please enter maturity amount.');
      return;
    }
    const maturityAmountNum = Number(maturityAmountStr);
    if (!Number.isFinite(maturityAmountNum) || maturityAmountNum <= 0) {
      Alert.alert('Invalid Maturity Amount', 'Please enter a valid maturity amount.');
      return;
    }

    // RD-specific validation
    if (instrumentType === 'rd') {
      if (!installmentAmount.trim()) {
        Alert.alert('Missing Info', 'Please enter monthly installment amount for RD.');
        return;
      }
      const installment = Number(installmentAmount);
      if (!Number.isFinite(installment) || installment <= 0) {
        Alert.alert('Invalid Installment', 'Please enter a valid installment amount.');
        return;
      }
      if (recurringDepositDay < 1 || recurringDepositDay > 31) {
        Alert.alert('Invalid Date', 'Please enter a valid deposit day (1-31).');
        return;
      }
    }

    // Date validation with ordering
    let start = new Date();
    let maturity = new Date(start.getTime() + 365 * 24 * 3600 * 1000);

    if (startDateStr.trim()) {
      const parsedStart = new Date(startDateStr);
      if (isNaN(parsedStart.getTime())) {
        Alert.alert('Invalid Date', 'Please enter a valid start date.');
        return;
      }
      start = parsedStart;
    }

    if (maturityDateStr.trim()) {
      const parsedMaturity = new Date(maturityDateStr);
      if (isNaN(parsedMaturity.getTime())) {
        Alert.alert('Invalid Date', 'Please enter a valid maturity date.');
        return;
      }
      if (parsedMaturity <= start) {
        Alert.alert('Invalid Date', 'Maturity date must be after start date.');
        return;
      }
      maturity = parsedMaturity;
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
        maturityAmount: { amount: Math.round(maturityAmountNum), currency: 'INR' },
        accountNumber: accountNumber.trim() as any,
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

  const saveRecurringDeposit = async () => {
    if (isProcessing) return;

    // Validation
    if (!bankOrIssuer.trim() || !accountNumber.trim()) {
      Alert.alert('Missing Info', 'Please fill bank name and account number.');
      return;
    }
    if (!installmentAmount.trim()) {
      Alert.alert('Missing Info', 'Please enter monthly installment amount for RD.');
      return;
    }
    const installment = Number(installmentAmount);
    if (!Number.isFinite(installment) || installment <= 0) {
      Alert.alert('Invalid Installment', 'Please enter a valid installment amount.');
      return;
    }
    if (recurringDepositDay < 1 || recurringDepositDay > 31) {
      Alert.alert('Invalid Date', 'Please enter a valid deposit day (1-31).');
      return;
    }
    // Mandatory Source Account (RD)
    if (!sourceAccountId.trim()) {
      Alert.alert('Missing Info', 'Please select a source account for the RD auto-debit.');
      return;
    }

    // Date validation (past allowed; maturity must be after start)
    let start = new Date();
    let maturity = new Date(start.getTime() + 365 * 24 * 3600 * 1000);

    if (startDateStr.trim()) {
      const parsedStart = new Date(startDateStr);
      if (isNaN(parsedStart.getTime())) {
        Alert.alert('Invalid Date', 'Please enter a valid start date.');
        return;
      }
      start = parsedStart;
    }

    if (maturityDateStr.trim()) {
      const parsedMaturity = new Date(maturityDateStr);
      if (isNaN(parsedMaturity.getTime())) {
        Alert.alert('Invalid Date', 'Please enter a valid maturity date.');
        return;
      }
      if (parsedMaturity <= start) {
        Alert.alert('Invalid Date', 'Maturity date must be after start date.');
        return;
      }
      maturity = parsedMaturity;
    }

    setIsProcessing(true);
    try {
      const now = new Date();

      const entry: FixedIncomeEntry = {
        id: `${Date.now()}`,
        instrumentType: 'rd',
        bankOrIssuer: bankOrIssuer.trim(),
        bankName: bankOrIssuer.trim(),
        instrumentName: instrumentName.trim() || `RD - ${bankOrIssuer.trim()}`,
        // RD does not have a single principal; store currentValue as 0 for now; future accrual can compute balance
        principalAmount: { amount: 0, currency: 'INR' },
        currentValue: { amount: 0, currency: 'INR' },
        interestRate: Number(interestRate) || 0,
        compoundingFrequency: 'monthly',
        interestPayout: 'maturity',
        startDate: start,
        maturityDate: maturity,
        autoRenew: false,
        isActive: true,
        nomineeDetails: undefined,
        jointHolders: undefined,
        notes: notes?.trim() || undefined,
        timestamp: now,
        // NEW metadata additions:
        accountNumber: accountNumber.trim() as any,            // saved for reference
        rdMonthlyInstallment: Number(installmentAmount) as any,
        rdDayOfMonth: recurringDepositDay as any,
        rdSourceAccountId: sourceAccountId.trim() as any,
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
            principal: 0,
            bankOrIssuer: bankOrIssuer.trim(),
            instrumentType: 'rd',
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
      setIsRecurringModalVisible(false);

    } catch (e) {
      Alert.alert('Error', 'Failed to add Recurring Deposit. Please try again.');
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

    // Maturity Amount validation
    if (!maturityAmountStr.trim()) {
      Alert.alert('Missing Info', 'Please enter maturity amount.');
      return;
    }
    const maturityAmountNum = Number(maturityAmountStr);
    if (!Number.isFinite(maturityAmountNum) || maturityAmountNum <= 0) {
      Alert.alert('Invalid Maturity Amount', 'Please enter a valid maturity amount.');
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
        maturityAmount: { amount: Math.round(maturityAmountNum), currency: 'INR' },
        accountNumber: accountNumber.trim() as any,
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

    // Maturity Amount validation
    if (!maturityAmountStr.trim()) {
      Alert.alert('Missing Info', 'Please enter maturity amount.');
      return;
    }
    const maturityAmountNum = Number(maturityAmountStr);
    if (!Number.isFinite(maturityAmountNum) || maturityAmountNum <= 0) {
      Alert.alert('Invalid Maturity Amount', 'Please enter a valid maturity amount.');
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
        maturityAmount: { amount: Math.round(maturityAmountNum), currency: currency as Currency },
        accountNumber: accountNumber.trim() as any,
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
    // Maturity Amount validation
    if (!maturityAmountStr.trim()) {
      Alert.alert('Missing Info', 'Please enter maturity amount.');
      return;
    }
    const maturityAmountNum = Number(maturityAmountStr);
    if (!Number.isFinite(maturityAmountNum) || maturityAmountNum <= 0) {
      Alert.alert('Invalid Maturity Amount', 'Please enter a valid maturity amount.');
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
        maturityAmount: { amount: Math.round(maturityAmountNum), currency: 'INR' },
        accountNumber: accountNumber.trim() as any,
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
      setAccountNumber('');
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
      setMaturityAmountStr('');
      setSourceAccountId('');
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
          <Text style={styles.balanceAmountSecondary}>
            {fi.principalAmount?.currency === 'INR' 
              ? formatFullINR(fi.principalAmount.amount) 
              : `${fi.principalAmount.currency} ${fi.principalAmount.amount.toLocaleString()}`}
          </Text>
        </View>

        <View>
          <Text style={styles.balanceLabel}>Maturity Amount</Text>
          <Text style={styles.balanceAmountSecondary}>
            {fi.maturityAmount
              ? (fi.maturityAmount.currency === 'INR'
                  ? formatFullINR(fi.maturityAmount.amount)
                  : `${fi.maturityAmount.currency} ${fi.maturityAmount.amount.toLocaleString()}`)
              : '—'}
          </Text>
        </View>

        <View>
          <Text style={styles.balanceLabel}>Current Value</Text>
          <Text style={styles.balanceAmountPrimary}>
            {fi.currentValue?.currency === 'INR' 
              ? formatFullINR(fi.currentValue.amount) 
              : `${fi.currentValue.currency} ${fi.currentValue.amount.toLocaleString()}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionGrid}>
        <TouchableOpacity style={styles.actionButton} onPress={() => { resetFormFields(); setInstrumentType('fd'); setIsBankDepositModalVisible(true); }}>
          <MaterialIcons name="account-balance" size={24} color="#1976D2" />
          <Text style={styles.actionText}>Add Bank Deposit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => { resetFormFields(); setIsRecurringModalVisible(true); }}>
          <MaterialIcons name="repeat" size={24} color="#1976D2" />
          <Text style={styles.actionText}>Add Recurring Deposit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => { resetFormFields(); setIsFCNRModalVisible(true); }}>
          <MaterialIcons name="currency-exchange" size={24} color="#1976D2" />
          <Text style={styles.actionText}>Add FCNR Deposit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => { resetFormFields(); setIsCompanyDepositModalVisible(true); }}>
          <MaterialIcons name="domain" size={24} color="#1976D2" />
          <Text style={styles.actionText}>Add Company Deposit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => { resetFormFields(); setIsDebtModalVisible(true); }}>
          <MaterialIcons name="receipt-long" size={24} color="#1976D2" />
          <Text style={styles.actionText}>Add Debt Instruments</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Coming Soon', 'More deposit types and features will be added soon.')}>
          <MaterialIcons name="rocket-launch" size={24} color="#1976D2" />
          <Text style={styles.actionText}>Coming Soon</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

// ADD: Bank Deposit Modal (FD/RD/NRE/NRO) - ENHANCED VERSION
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
                {/* Deposit Type */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Deposit Type *</Text>
                  <View style={styles.pickerRow}>
                    {[
                      { key: 'fd', label: 'Fixed Deposit' },
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
                    placeholder="e.g., HDFC Bank, SBI, ICICI Bank"
                  />
                </View>

                {/* Account Number */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Account Number *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    placeholder="Enter linked deposit account number"
                  />
                </View>

                {/* Instrument Name */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Deposit Name (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={instrumentName}
                    onChangeText={setInstrumentName}
                    placeholder={`${instrumentType.toUpperCase()} - ${bankOrIssuer || 'Bank Name'}`}
                  />
                </View>

                {/* Principal Amount */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Principal Amount (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={principalAmount}
                    onChangeText={setPrincipalAmount}
                    placeholder="100000"
                    keyboardType="numeric"
                  />
                </View>

                {/* Interest Rate */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Interest Rate (% p.a.)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={interestRate}
                    onChangeText={setInterestRate}
                    placeholder="7.5"
                    keyboardType="decimal-pad"
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

                {/* Maturity Amount */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Maturity Amount (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={maturityAmountStr}
                    onChangeText={setMaturityAmountStr}
                    placeholder="110000"
                    keyboardType="numeric"
                  />
                </View>

                {/* Dates Row */}
                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={styles.inputLabel}>Start Date</Text>
                    <TextInput
                      style={styles.textInput}
                      value={startDateStr}
                      onChangeText={setStartDateStr}
                      placeholder="DD/MM/YYYY"
                    />
                  </View>
                  <View style={styles.half}>
                    <Text style={styles.inputLabel}>Maturity Date</Text>
                    <TextInput
                      style={styles.textInput}
                      value={maturityDateStr}
                      onChangeText={setMaturityDateStr}
                      placeholder="DD/MM/YYYY"
                    />
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
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Source Account (for installments)</Text>
                      <TextInput
                        style={styles.textInput}
                        value={sourceAccountId}
                        onChangeText={setSourceAccountId}
                        placeholder="Select account for auto-debit"
                      />
                    </View>
                  </>
                )}

                {/* Auto-Renewal */}
                <View style={styles.inputContainer}>
                  <TouchableOpacity 
                    style={styles.checkboxRow} 
                    onPress={() => setAutoRenew(!autoRenew)}
                  >
                    <MaterialIcons 
                      name={autoRenew ? "check-box" : "check-box-outline-blank"} 
                      size={24} 
                      color="#8B5CF6" 
                    />
                    <Text style={styles.checkboxText}>Auto-renew on maturity</Text>
                  </TouchableOpacity>
                </View>

                {/* Notes */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Notes (Optional)</Text>
                  <TextInput
                    style={[styles.textInput, { minHeight: 80 }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Additional details, nominee information, etc."
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  resetFormFields();
                  setIsBankDepositModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.primaryButton, isProcessing && styles.disabledButton]} 
                onPress={saveBankDeposit}
                disabled={isProcessing}
              >
                <Text style={styles.primaryButtonText}>
                  {isProcessing ? 'Saving...' : 'Save Deposit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
     );

  const renderRecurringDepositModal = () => (
    <Modal
      visible={isRecurringModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => { resetFormFields(); setIsRecurringModalVisible(false); }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Recurring Deposit</Text>
            <TouchableOpacity onPress={() => { resetFormFields(); setIsRecurringModalVisible(false); }}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.modalBody}>
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

              {/* Account Number */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Account Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder="Enter linked deposit account number"
                />
              </View>

              {/* Deposit Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Deposit Name (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={instrumentName}
                  onChangeText={setInstrumentName}
                  placeholder={`RD - ${bankOrIssuer || 'Bank Name'}`}
                />
              </View>

              {/* Installment and Day */}
              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.inputLabel}>Monthly Installment (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={installmentAmount}
                    onChangeText={setInstallmentAmount}
                    placeholder="5000"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.inputLabel}>Deposit Day (1–31) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={recurringDepositDay.toString()}
                    onChangeText={(val) => setRecurringDepositDay(parseInt(val) || 1)}
                    placeholder="15"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Source Account (mandatory picker) */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Source Account (Auto-debit) *</Text>
                <View style={[styles.textInput, { paddingVertical: 6 }]}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {SourceBankAccounts.length === 0 ? (
                      <Text style={{ color: Colors.text.tertiary }}>No accounts found. Add bank accounts first.</Text>
                    ) : (
                      SourceBankAccounts.map(acc => (
                        <TouchableOpacity
                          key={acc.id}
                          style={[styles.pill, sourceAccountId === acc.id && styles.pillSelected]}
                          onPress={() => setSourceAccountId(acc.id)}
                        >
                          <Text style={[styles.pillText, sourceAccountId === acc.id && styles.pillTextSelected]}>
                            {acc.label}
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              </View>

              {/* Dates */}
              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.inputLabel}>Start Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={startDateStr}
                    onChangeText={setStartDateStr}
                    placeholder="DD/MM/YYYY"
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.inputLabel}>Maturity Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={maturityDateStr}
                    onChangeText={setMaturityDateStr}
                    placeholder="DD/MM/YYYY"
                  />
                </View>
              </View>

              {/* Notes */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { minHeight: 80 }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Additional details"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => { resetFormFields(); setIsRecurringModalVisible(false); }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, isProcessing && styles.disabledButton]}
              onPress={saveRecurringDeposit}
              disabled={isProcessing}
            >
              <Text style={styles.primaryButtonText}>{isProcessing ? 'Saving...' : 'Save RD'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );



  // ADD: FCNR Modal - ENHANCED VERSION
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
              {/* Currency Selection */}
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

              {/* Bank Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Bank Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={bankOrIssuer}
                  onChangeText={setBankOrIssuer}
                  placeholder="e.g., SBI, HDFC Bank, ICICI Bank"
                />
              </View>

              {/* Account Number */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Account Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder="Enter linked deposit account number"
                />
              </View>

              {/* Deposit Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Deposit Name (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={instrumentName}
                  onChangeText={setInstrumentName}
                  placeholder={`FCNR ${currency} - ${bankOrIssuer || 'Bank Name'}`}
                />
              </View>

              {/* Principal Amount with Currency Symbol */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Principal Amount ({currency}) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={principalAmount}
                  onChangeText={setPrincipalAmount}
                  placeholder={currency === 'USD' ? '10000' : currency === 'EUR' ? '8500' : '5000'}
                  keyboardType="numeric"
                />
              </View>

              {/* Interest Rate */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Interest Rate (% p.a.)</Text>
                <TextInput
                  style={styles.textInput}
                  value={interestRate}
                  onChangeText={setInterestRate}
                  placeholder="2.5"
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Interest Payout */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Interest Payout</Text>
                <View style={styles.pickerRow}>
                  {(['quarterly','annually','maturity'] as const).map(payout => (
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

              {/* Maturity Amount */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Maturity Amount ({currency}) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={maturityAmountStr}
                  onChangeText={setMaturityAmountStr}
                  placeholder={currency === 'USD' ? '11000' : currency === 'EUR' ? '9000' : '6000'}
                  keyboardType="numeric"
                />
              </View>

              {/* Dates Row */}
              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.inputLabel}>Start Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={startDateStr}
                    onChangeText={setStartDateStr}
                    placeholder="DD/MM/YYYY"
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.inputLabel}>Maturity Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={maturityDateStr}
                    onChangeText={setMaturityDateStr}
                    placeholder="DD/MM/YYYY"
                  />
                </View>
              </View>

              {/* Auto-Renewal */}
              <View style={styles.inputContainer}>
                <TouchableOpacity 
                  style={styles.checkboxRow} 
                  onPress={() => setAutoRenew(!autoRenew)}
                >
                  <MaterialIcons 
                    name={autoRenew ? "check-box" : "check-box-outline-blank"} 
                    size={24} 
                    color="#8B5CF6" 
                  />
                  <Text style={styles.checkboxText}>Auto-renew on maturity</Text>
                </TouchableOpacity>
              </View>

              {/* Notes */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { minHeight: 80 }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Exchange rate at opening, repatriation details, etc."
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                resetFormFields();
                setIsFCNRModalVisible(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.primaryButton, isProcessing && styles.disabledButton]} 
              onPress={saveFCNRDeposit}
              disabled={isProcessing}
            >
              <Text style={styles.primaryButtonText}>
                {isProcessing ? 'Saving...' : 'Save FCNR'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );


  // ADD: Company Deposit Modal - ENHANCED VERSION
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
              {/* Company Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Company Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholder="e.g., Mahindra Finance, Bajaj Finserv"
                />
              </View>

              {/* Account Number */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Account Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder="Enter linked deposit account number"
                />
              </View>

              {/* Deposit Scheme Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Deposit Scheme Name (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={instrumentName}
                  onChangeText={setInstrumentName}
                  placeholder={`Company Deposit - ${companyName || 'Company Name'}`}
                />
              </View>

              {/* Principal Amount */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Principal Amount (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={principalAmount}
                  onChangeText={setPrincipalAmount}
                  placeholder="500000"
                  keyboardType="numeric"
                />
              </View>

              {/* Maturity Amount */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Maturity Amount (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={maturityAmountStr}
                  onChangeText={setMaturityAmountStr}
                  placeholder="550000"
                  keyboardType="numeric"
                />
              </View>

              {/* Interest Rate */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Interest Rate (% p.a.)</Text>
                <TextInput
                  style={styles.textInput}
                  value={interestRate}
                  onChangeText={setInterestRate}
                  placeholder="9.5"
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Dates Row */}
              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.inputLabel}>Start Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={startDateStr}
                    onChangeText={setStartDateStr}
                    placeholder="DD/MM/YYYY"
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.inputLabel}>Maturity Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={maturityDateStr}
                    onChangeText={setMaturityDateStr}
                    placeholder="DD/MM/YYYY"
                  />
                </View>
              </View>

              {/* Notes */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { minHeight: 80 }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Credit rating, deposit insurance, special terms, etc."
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                resetFormFields();
                setIsCompanyDepositModalVisible(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.primaryButton, isProcessing && styles.disabledButton]} 
              onPress={saveCompanyDeposit}
              disabled={isProcessing}
            >
              <Text style={styles.primaryButtonText}>
                {isProcessing ? 'Saving...' : 'Save Deposit'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );


  // ADD: Debt Instruments Modal - ENHANCED VERSION
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
              {/* Bond Type */}
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

              {/* Issuer Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Issuer Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={bankOrIssuer}
                  onChangeText={setBankOrIssuer}
                  placeholder={
                    bondType === 'government' ? 'Government of India' :
                    bondType === 'corporate' ? 'e.g., Reliance Industries, Tata Motors' :
                    'Municipal Corporation Name'
                  }
                />
              </View>

              {/* Bond Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Bond Name (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={instrumentName}
                  onChangeText={setInstrumentName}
                  placeholder={`${bondType.toUpperCase()} Bond - ${bankOrIssuer || 'Issuer'}`}
                />
              </View>

              {/* ISIN Code */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>ISIN / Bond ID</Text>
                <TextInput
                  style={styles.textInput}
                  value={isinCode}
                  onChangeText={setIsinCode}
                  placeholder="INE000A01036"
                />
              </View>

              {/* Face Value and Investment Amount */}
              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.inputLabel}>Face Value (₹)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={faceValueStr}
                    onChangeText={setFaceValueStr}
                    placeholder="1000"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.inputLabel}>Investment Amount (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={principalAmount}
                    onChangeText={setPrincipalAmount}
                    placeholder="100000"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Coupon Rate and Yield */}
              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.inputLabel}>Coupon Rate (% p.a.)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={couponRate}
                    onChangeText={setCouponRate}
                    placeholder="7.75"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.inputLabel}>Yield to Maturity (%)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={yieldToMaturity}
                    onChangeText={setYieldToMaturity}
                    placeholder="8.25"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {/* Credit Rating */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Credit Rating</Text>
                <TextInput
                  style={styles.textInput}
                  value={creditRating}
                  onChangeText={setCreditRating}
                  placeholder="AAA, AA, A, BBB, etc."
                />
              </View>

              {/* Dates Row */}
              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.inputLabel}>Issue Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={startDateStr}
                    onChangeText={setStartDateStr}
                    placeholder="DD/MM/YYYY"
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.inputLabel}>Maturity Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={maturityDateStr}
                    onChangeText={setMaturityDateStr}
                    placeholder="DD/MM/YYYY"
                  />
                </View>
              </View>

              {/* Options */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Special Features</Text>
                <View style={styles.checkboxColumn}>
                  <TouchableOpacity 
                    style={styles.checkboxRow} 
                    onPress={() => setHasCallOption(!hasCallOption)}
                  >
                    <MaterialIcons 
                      name={hasCallOption ? "check-box" : "check-box-outline-blank"} 
                      size={24} 
                      color="#8B5CF6" 
                    />
                    <Text style={styles.checkboxText}>Has Call Option (early redemption by issuer)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.checkboxRow} 
                    onPress={() => setHasPutOption(!hasPutOption)}
                  >
                    <MaterialIcons 
                      name={hasPutOption ? "check-box" : "check-box-outline-blank"} 
                      size={24} 
                      color="#8B5CF6" 
                    />
                    <Text style={styles.checkboxText}>Has Put Option (early sale by investor)</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Notes */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { minHeight: 80 }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Trading details, broker information, tax implications, etc."
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                resetFormFields();
                setIsBankDepositModalVisible(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.primaryButton, isProcessing && styles.disabledButton]} 
              onPress={saveDebtInstrument}
              disabled={isProcessing}
            >
              <Text style={styles.primaryButtonText}>
                {isProcessing ? 'Saving...' : 'Save Bond'}
              </Text>
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
      {renderRecurringDepositModal()}
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
  balanceRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 8
  },
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

  checkboxRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  checkboxColumn: { 
    gap: 8 
  },
  checkboxText: { 
    fontSize: 14, 
    color: Colors.text.primary, 
    marginLeft: 8, 
    flex: 1 
  },

});
export { FixedIncomeScreen as default };

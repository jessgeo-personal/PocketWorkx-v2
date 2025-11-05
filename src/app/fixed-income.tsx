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

type Currency = 'INR';

const instrumentTypes = [
  { key: 'fd', label: 'Fixed Deposit' },
  { key: 'rd', label: 'Recurring Deposit' },
  { key: 'nre', label: 'NRE Deposit' },
  { key: 'fcnr', label: 'FCNR Deposit' },
  { key: 'company_deposit', label: 'Company Deposit' },
  { key: 'debt', label: 'Debt Instrument' },
  { key: 'other', label: 'Other' },
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

  // Modal state
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  // Add form state
  const [instrumentType, setInstrumentType] = useState<'fd' | 'rd' | 'nre' | 'fcnr' | 'company_deposit' | 'debt' | 'other'>('fd');
  const [bankOrIssuer, setBankOrIssuer] = useState('');
  const [instrumentName, setInstrumentName] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [compoundingFrequency, setCompoundingFrequency] = useState<'annually' | 'monthly' | 'quarterly' | 'daily'>('annually');
  const [startDateStr, setStartDateStr] = useState('');   // YYYY-MM-DD
  const [maturityDateStr, setMaturityDateStr] = useState(''); // YYYY-MM-DD
  const [autoRenew, setAutoRenew] = useState(false);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleAddFixedIncome = async () => {
    if (isProcessing) return;

    // Validation
    if (!bankOrIssuer.trim() || !instrumentName.trim() || !principalAmount.trim()) {
      Alert.alert('Missing Info', 'Please fill bank/issuer, instrument name, and principal.');
      return;
    }
    const principal = Number(principalAmount);
    if (!Number.isFinite(principal) || principal <= 0) {
      Alert.alert('Invalid Principal', 'Please enter a valid principal amount.');
      return;
    }
    const rate = interestRate.trim() ? Number(interestRate) : 0;
    if (interestRate.trim() && (!Number.isFinite(rate) || rate < 0)) {
      Alert.alert('Invalid Rate', 'Please enter a valid interest rate.');
      return;
    }

    // Dates
    const now = new Date();
    const start = startDateStr ? new Date(startDateStr) : now;
    const maturity = maturityDateStr ? new Date(maturityDateStr) : new Date(now.getTime() + 365 * 24 * 3600 * 1000);

    // For v1, currentValue = principal (no accrual); future can compute accrued interest
    const currentValue = principal;

    setIsProcessing(true);
    try {
      const entry: FixedIncomeEntry = {
        id: `${Date.now()}`,
        instrumentType,
        bankOrIssuer: bankOrIssuer.trim(),
        instrumentName: instrumentName.trim(),
        principalAmount: { amount: Math.round(principal), currency: 'INR' },
        currentValue: { amount: Math.round(currentValue), currency: 'INR' },
        interestRate: rate,
        compoundingFrequency,
        interestPayout: 'maturity',
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
      setIsAddModalVisible(false);

    } catch (e) {
      Alert.alert('Error', 'Failed to add Fixed Income entry. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Fixed Income</Text>
      <TouchableOpacity style={styles.addButton} onPress={() => setIsAddModalVisible(true)}>
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
        <TouchableOpacity style={styles.actionButton} onPress={() => setIsAddModalVisible(true)}>
          <MaterialIcons name="add-circle" size={24} color="#1976D2" />
          <Text style={styles.actionText}>Add Instrument</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => setIsAddModalVisible(true)}>
          <MaterialIcons name="account-balance" size={24} color="#1976D2" />
          <Text style={styles.actionText}>Add FD</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => setIsAddModalVisible(true)}>
          <MaterialIcons name="autorenew" size={24} color="#1976D2" />
          <Text style={styles.actionText}>Add RD/NRE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => setIsAddModalVisible(true)}>
          <MaterialIcons name="domain" size={24} color="#1976D2" />
          <Text style={styles.actionText}>Company Deposit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAddModal = () => (
    <Modal
      visible={isAddModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setIsAddModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Fixed Income</Text>
            <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.modalBody}>

              {/* Instrument Type */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Instrument Type *</Text>
                <View style={styles.pickerRow}>
                  {instrumentTypes.map(t => (
                    <TouchableOpacity
                      key={t.key}
                      style={[styles.pill, instrumentType === t.key && styles.pillSelected]}
                      onPress={() => setInstrumentType(t.key)}
                    >
                      <Text style={[styles.pillText, instrumentType === t.key && styles.pillTextSelected]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Bank/Issuer */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Bank / Issuer *</Text>
                <TextInput
                  style={styles.textInput}
                  value={bankOrIssuer}
                  onChangeText={setBankOrIssuer}
                  placeholder="e.g., HDFC, SBI, Company Name"
                />
              </View>

              {/* Instrument Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Instrument Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={instrumentName}
                  onChangeText={setInstrumentName}
                  placeholder="e.g., HDFC 5-Year FD"
                />
              </View>

              {/* Principal Amount */}
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

              {/* Interest Rate */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Interest Rate (%)</Text>
                <TextInput
                  style={styles.textInput}
                  value={interestRate}
                  onChangeText={setInterestRate}
                  placeholder="e.g., 7.25"
                  keyboardType="numeric"
                />
              </View>

              {/* Compounding */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Compounding Frequency</Text>
                <View style={styles.pickerRow}>
                  {(['annually','quarterly','monthly','daily'] as const).map(freq => (
                    <TouchableOpacity
                      key={freq}
                      style={[styles.pill, compoundingFrequency === freq && styles.pillSelected]}
                      onPress={() => setCompoundingFrequency(freq)}
                    >
                      <Text style={[styles.pillText, compoundingFrequency === freq && styles.pillTextSelected]}>
                        {freq.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Dates */}
              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.half]}>
                  <Text style={styles.inputLabel}>Start Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={startDateStr}
                    onChangeText={setStartDateStr}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
                <View style={[styles.inputContainer, styles.half]}>
                  <Text style={styles.inputLabel}>Maturity Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={maturityDateStr}
                    onChangeText={setMaturityDateStr}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>

              {/* Auto Renew */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Auto Renew</Text>
                <View style={styles.pickerRow}>
                  <TouchableOpacity
                    style={[styles.pill, autoRenew && styles.pillSelected]}
                    onPress={() => setAutoRenew(true)}
                  >
                    <Text style={[styles.pillText, autoRenew && styles.pillTextSelected]}>
                      YES
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pill, !autoRenew && styles.pillSelected]}
                    onPress={() => setAutoRenew(false)}
                  >
                    <Text style={[styles.pillText, !autoRenew && styles.pillTextSelected]}>
                      NO
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Notes */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { minHeight: 60 }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any additional details"
                  multiline
                />
              </View>

            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAddModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, isProcessing && styles.disabledButton]}
              onPress={handleAddFixedIncome}
              disabled={isProcessing}
            >
              <Text style={styles.primaryButtonText}>{isProcessing ? 'Saving...' : 'Save'}</Text>
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

      {renderAddModal()}

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

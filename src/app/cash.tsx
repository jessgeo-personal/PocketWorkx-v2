// src/app/cash.tsx
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
import { CashEntry } from '../types/finance';
import { formatCurrency, formatCompactCurrency } from '../utils/currency';
import ScreenLayout from '../components/ScreenLayout';
import { Colors } from '../utils/theme';

const CashScreen: React.FC = () => {
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([
    {
      id: '1',
      description: 'Wallet Cash',
      amount: { amount: 15500, currency: 'INR' },
      location: 'Personal Wallet',
      encryptedData: {
        encryptionKey: '',
        encryptionAlgorithm: 'AES-256',
        lastEncrypted: new Date(),
        isEncrypted: false,
      },
      auditTrail: {
        createdBy: 'user',
        createdAt: new Date('2025-10-01'),
        updatedBy: 'user',
        updatedAt: new Date(),
        version: 1,
        changes: [],
      },
      linkedTransactions: [],
    },
    {
      id: '2',
      description: 'Home Safe',
      amount: { amount: 45000, currency: 'INR' },
      location: 'Home - Bedroom Safe',
      encryptedData: {
        encryptionKey: '',
        encryptionAlgorithm: 'AES-256',
        lastEncrypted: new Date(),
        isEncrypted: false,
      },
      auditTrail: {
        createdBy: 'user',
        createdAt: new Date('2025-09-15'),
        updatedBy: 'user',
        updatedAt: new Date(),
        version: 1,
        changes: [],
      },
      linkedTransactions: [],
    },
    {
      id: '3',
      description: 'Emergency Cash',
      amount: { amount: 25000, currency: 'INR' },
      location: 'Car Dashboard',
      encryptedData: {
        encryptionKey: '',
        encryptionAlgorithm: 'AES-256',
        lastEncrypted: new Date(),
        isEncrypted: false,
      },
      auditTrail: {
        createdBy: 'user',
        createdAt: new Date('2025-08-20'),
        updatedBy: 'user',
        updatedAt: new Date(),
        version: 1,
        changes: [],
      },
      linkedTransactions: [],
    },
    {
      id: '4',
      description: 'Office Petty Cash',
      amount: { amount: 8000, currency: 'INR' },
      location: 'Office Desk',
      encryptedData: {
        encryptionKey: '',
        encryptionAlgorithm: 'AES-256',
        lastEncrypted: new Date(),
        isEncrypted: false,
      },
      auditTrail: {
        createdBy: 'user',
        createdAt: new Date('2025-10-03'),
        updatedBy: 'user',
        updatedAt: new Date(),
        version: 1,
        changes: [],
      },
      linkedTransactions: [],
    },
  ]);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newCashDescription, setNewCashDescription] = useState('');
  const [newCashAmount, setNewCashAmount] = useState('');
  const [newCashLocation, setNewCashLocation] = useState('');

  const totalCash = cashEntries.reduce((sum, entry) => sum + entry.amount.amount, 0);

  const getLocationIcon = (location: string) => {
    const l = location?.toLowerCase() || '';
    if (l.includes('wallet')) return 'account-balance-wallet';
    if (l.includes('home')) return 'home';
    if (l.includes('car')) return 'directions-car';
    if (l.includes('office')) return 'work';
    if (l.includes('safe')) return 'security';
    return 'place';
  };

  const getLocationColor = (location: string) => {
    const l = location?.toLowerCase() || '';
    if (l.includes('wallet')) return '#4CAF50';
    if (l.includes('home')) return '#2196F3';
    if (l.includes('car')) return '#FF9800';
    if (l.includes('office')) return '#9C27B0';
    if (l.includes('safe')) return '#795548';
    return '#666666';
  };

  const handleAddCash = () => {
    if (!newCashDescription.trim() || !newCashAmount.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    const amount = parseFloat(newCashAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    const newEntry: CashEntry = {
      id: Date.now().toString(),
      description: newCashDescription.trim(),
      amount: { amount, currency: 'INR' },
      location: newCashLocation.trim() || 'Not specified',
      encryptedData: {
        encryptionKey: '',
        encryptionAlgorithm: 'AES-256',
        lastEncrypted: new Date(),
        isEncrypted: false,
      },
      auditTrail: {
        createdBy: 'user',
        createdAt: new Date(),
        updatedBy: 'user',
        updatedAt: new Date(),
        version: 1,
        changes: [],
      },
      linkedTransactions: [],
    };
    setCashEntries(prev => [...prev, newEntry]);
    setNewCashDescription('');
    setNewCashAmount('');
    setNewCashLocation('');
    setIsAddModalVisible(false);
  };

  const handleDeleteCash = (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to remove this cash entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setCashEntries(prev => prev.filter(e => e.id !== id)) },
    ]);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Physical Cash</Text>
      <TouchableOpacity style={styles.addButton} onPress={() => setIsAddModalVisible(true)}>
        <MaterialIcons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const renderTotalCard = () => (
    <LinearGradient colors={['#27AE60', '#2ECC71']} style={styles.totalCard}>
      <Text style={styles.totalLabel}>Total Physical Cash</Text>
      <Text style={styles.totalAmount}>{formatCompactCurrency(totalCash, 'INR')}</Text>
      <Text style={styles.entriesCount}>
        {cashEntries.length} Cash {cashEntries.length === 1 ? 'Entry' : 'Entries'}
      </Text>
    </LinearGradient>
  );

  const renderCashEntry = (entry: CashEntry) => (
    <TouchableOpacity key={entry.id} style={styles.cashCard}>
      <View style={styles.cashHeader}>
        <View style={styles.cashLeft}>
          <View style={[styles.locationIcon, { backgroundColor: getLocationColor(entry.location || '') }]}>
            <MaterialIcons name={getLocationIcon(entry.location || '') as any} size={24} color="#FFFFFF" />
          </View>
          <View style={styles.cashDetails}>
            <Text style={styles.cashDescription}>{entry.description}</Text>
            <Text style={styles.cashLocation}>{entry.location}</Text>
            <Text style={styles.cashDate}>Added on {entry.auditTrail.createdAt.toLocaleDateString()}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteCash(entry.id)}>
          <MaterialIcons name="delete" size={20} color="#E74C3C" />
        </TouchableOpacity>
      </View>
      <View style={styles.cashAmount}>
        <Text style={styles.amountLabel}>Amount</Text>
        <Text style={styles.amountValue}>{formatCompactCurrency(entry.amount.amount, entry.amount.currency)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionGrid}>
        <TouchableOpacity style={styles.actionButton} onPress={() => setIsAddModalVisible(true)}>
          <MaterialIcons name="add-circle" size={24} color="#27AE60" />
          <Text style={styles.actionText}>Add Cash</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="swap-horiz" size={24} color="#27AE60" />
          <Text style={styles.actionText}>Move Cash</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="receipt" size={24} color="#27AE60" />
          <Text style={styles.actionText}>Record Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="account-balance" size={24} color="#27AE60" />
          <Text style={styles.actionText}>Deposit to Bank</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAddCashModal = () => (
    <Modal visible={isAddModalVisible} animationType="slide" transparent onRequestClose={() => setIsAddModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Cash Entry</Text>
            <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput style={styles.textInput} value={newCashDescription} onChangeText={setNewCashDescription} placeholder="e.g., Wallet Cash, Home Safe" />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount (₹) *</Text>
              <TextInput style={styles.textInput} value={newCashAmount} onChangeText={setNewCashAmount} placeholder="0" keyboardType="numeric" />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput style={styles.textInput} value={newCashLocation} onChangeText={setNewCashLocation} placeholder="e.g., Personal Wallet, Home Safe" />
            </View>
          </View>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAddModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addCashButton} onPress={handleAddCash}>
              <Text style={styles.addButtonText}>Add Cash</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScreenLayout>
      <StatusBar style="dark" backgroundColor={Colors.background.primary} />
      {renderHeader()}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderTotalCard()}
        {renderQuickActions()}
        <View style={styles.cashContainer}>
          <Text style={styles.sectionTitle}>Your Cash Entries</Text>
          {cashEntries.length > 0 ? cashEntries.map(renderCashEntry) : (
            <View style={styles.emptyCash}>
              <MaterialIcons name="account-balance-wallet" size={64} color="#E0E0E0" />
              <Text style={styles.emptyText}>No cash entries yet</Text>
              <Text style={styles.emptySubtext}>Add your first cash entry to get started</Text>
            </View>
          )}
        </View>
      </ScrollView>
      {renderAddCashModal()}
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
  cashContainer: {
    paddingHorizontal: 16,
    marginBottom: 100,
  },
  cashCard: {
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
  cashHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cashLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cashDetails: {
    flex: 1,
  },
  cashDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  cashLocation: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  cashDate: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  deleteButton: {
    padding: 4,
  },
  cashAmount: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#27AE60',
  },
  emptyCash: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.background.modal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.main,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  modalBody: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border.main,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border.main,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  addCashButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});

export { CashScreen as default };

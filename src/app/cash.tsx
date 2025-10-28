// src/app/cash.tsx - Original Format with Enhanced Backend
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  FlatList,
  RefreshControl,
  Image
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useStorage } from '../services/storage/StorageProvider';

// Enhanced data structure (backend)
interface CashCategory {
  id: string;
  name: string;
  balance: number;
  color: string;
}

interface CashEntry {
  id: string;
  description: string;
  amount: { amount: number; currency: 'INR' };
  location: string;
  timestamp: Date;
}

// PocketWorkx Design System - Imported from Theme
const Colors = {
  primary: '#F7D94C',           // Golden yellow background
  secondary: '#FFF8DC',         // Light cream for cards  
  surface: '#FFFFFF',           // Pure white for overlays
  accent: '#8B5CF6',            // Purple for primary buttons
  accentLight: '#A78BFA',       // Light purple for hover states
  accentDark: '#7C3AED',        // Dark purple for pressed states
  success: '#10B981',           // Green for positive values
  error: '#EF4444',             // Red for negative values/debts
  warning: '#F59E0B',           // Amber for alerts
  info: '#3B82F6',              // Blue for information
  textPrimary: '#1F2937',       // Dark gray for primary text
  textSecondary: '#6B7280',     // Medium gray for secondary text
  textLight: '#9CA3AF',         // Light gray for hints/disabled
  textInverted: '#FFFFFF',      // White text on dark backgrounds
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
} as const;

const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System-Medium',
    semibold: 'System-Semibold',
    bold: 'System-Bold',
  },
  fontSize: {
    xs: 12,    // Small labels, captions
    sm: 14,    // Secondary text, body small
    md: 16,    // Body text, default
    lg: 18,    // Subheadings
    xl: 20,    // Page titles
    '2xl': 24, // Section headers
    '3xl': 30, // Large amounts
    '4xl': 36, // Feature amounts
    '5xl': 48, // Hero display
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

const Spacing = {
  xs: 4,     // Tiny gaps
  sm: 8,     // Small spacing
  md: 16,    // Standard spacing (base unit)
  lg: 24,    // Large spacing
  xl: 32,    // Extra large spacing
  '2xl': 48, // Section spacing
  '3xl': 64, // Page spacing
  // Component-specific spacing
  cardPadding: 16,
  screenPadding: 20,
  buttonPadding: 12,
  inputPadding: 14,
} as const;

const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
} as const;

// Indian Rupee Formatting (lakhs/crores format)
const formatIndianCurrency = (amount: number): string => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  // Convert to Indian numbering system (lakhs/crores)
  if (absAmount >= 10000000) { // 1 crore
    const crores = absAmount / 10000000;
    return `${isNegative ? '-' : ''}₹${crores.toFixed(2)} Cr`;
  } else if (absAmount >= 100000) { // 1 lakh  
    const lakhs = absAmount / 100000;
    return `${isNegative ? '-' : ''}₹${lakhs.toFixed(2)} L`;
  } else {
    return `${isNegative ? '-' : ''}₹${absAmount.toLocaleString('en-IN')}`;
  }
};

export default function CashScreen() {
  const { state, dispatch } = useStorage();
  
  // State management
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [categories, setCategories] = useState<CashCategory[]>([
    { id: '1', name: 'Wallet', balance: 0, color: Colors.accent },
    { id: '2', name: 'Loose Change (Car)', balance: 0, color: Colors.success },
    { id: '3', name: 'Loose Change (Home)', balance: 0, color: Colors.warning },
    { id: '4', name: 'Safe', balance: 0, color: Colors.error },
  ]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [addCashModalVisible, setAddCashModalVisible] = useState(false);
  const [moveCashModalVisible, setMoveCashModalVisible] = useState(false);
  const [recordExpenseModalVisible, setRecordExpenseModalVisible] = useState(false);
  const [accountDepositModalVisible, setAccountDepositModalVisible] = useState(false);
  
  // Form states
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [location, setLocation] = useState('Wallet');
  const [fromCategory, setFromCategory] = useState('');
  const [toCategory, setToCategory] = useState('');

  useEffect(() => {
    loadData();
  }, [state]);

  const loadData = () => {
    if (state.cashEntries) {
      setCashEntries(state.cashEntries);
      updateCategoryBalances(state.cashEntries);
    }
  };

  const updateCategoryBalances = (entries: CashEntry[]) => {
    const updatedCategories = categories.map(cat => ({
      ...cat,
      balance: entries
        .filter(entry => entry.location === cat.name)
        .reduce((sum, entry) => sum + entry.amount.amount, 0)
    }));
    setCategories(updatedCategories);
  };

  const getTotalCash = (): number => {
    return categories.reduce((total, cat) => total + cat.balance, 0);
  };

  const handleAddCash = () => {
    if (!description.trim() || !amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter valid description and amount');
      return;
    }

    const newEntry: CashEntry = {
      id: Date.now().toString(),
      description: description.trim(),
      amount: { 
        amount: parseFloat(amount), 
        currency: 'INR' 
      },
      location,
      timestamp: new Date(),
    };

    dispatch({ type: 'ADD_CASH_ENTRY', payload: newEntry });
    resetForm();
    setAddCashModalVisible(false);
  };

  const handleMoveCash = () => {
    if (!amount || parseFloat(amount) <= 0 || !fromCategory || !toCategory) {
      Alert.alert('Error', 'Please fill all fields with valid values');
      return;
    }

    if (fromCategory === toCategory) {
      Alert.alert('Error', 'Cannot move cash to the same category');
      return;
    }

    // Check if source category has sufficient balance
    const sourceCategory = categories.find(cat => cat.name === fromCategory);
    if (!sourceCategory || sourceCategory.balance < parseFloat(amount)) {
      Alert.alert('Error', 'Insufficient cash in source category');
      return;
    }

    // For simplicity, create two entries: one negative (from) and one positive (to)
    const amountValue = parseFloat(amount);
    
    const fromEntry: CashEntry = {
      id: Date.now().toString(),
      description: `Moved to ${toCategory}`,
      amount: { amount: -amountValue, currency: 'INR' },
      location: fromCategory,
      timestamp: new Date(),
    };

    const toEntry: CashEntry = {
      id: (Date.now() + 1).toString(),
      description: `Received from ${fromCategory}`,
      amount: { amount: amountValue, currency: 'INR' },
      location: toCategory,
      timestamp: new Date(),
    };

    dispatch({ type: 'ADD_CASH_ENTRY', payload: fromEntry });
    dispatch({ type: 'ADD_CASH_ENTRY', payload: toEntry });
    
    resetForm();
    setMoveCashModalVisible(false);
  };

  const handleRecordExpense = () => {
    if (!description.trim() || !amount || parseFloat(amount) <= 0 || !location) {
      Alert.alert('Error', 'Please fill all fields with valid values');
      return;
    }

    // Check if category has sufficient balance
    const category = categories.find(cat => cat.name === location);
    if (!category || category.balance < parseFloat(amount)) {
      Alert.alert('Error', 'Insufficient cash in selected category');
      return;
    }

    const newEntry: CashEntry = {
      id: Date.now().toString(),
      description: `Expense: ${description.trim()}`,
      amount: { 
        amount: -parseFloat(amount), // Negative for expense
        currency: 'INR' 
      },
      location,
      timestamp: new Date(),
    };

    dispatch({ type: 'ADD_CASH_ENTRY', payload: newEntry });
    resetForm();
    setRecordExpenseModalVisible(false);
  };

  const handleAccountDeposit = () => {
    // Coming Soon functionality
    Alert.alert(
      'Coming Soon!',
      'Bank account integration will be available in the next update. You\'ll be able to deposit cash directly to your linked bank accounts.',
      [{ text: 'Got it', style: 'default' }]
    );
    setAccountDepositModalVisible(false);
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setLocation('Wallet');
    setFromCategory('');
    setToCategory('');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderRecentEntry = ({ item }: { item: CashEntry }) => (
    <View style={styles.entryItem}>
      <View style={styles.entryInfo}>
        <Text style={styles.entryDescription}>{item.description}</Text>
        <Text style={styles.entryLocation}>{item.location}</Text>
        <Text style={styles.entryDate}>
          {new Date(item.timestamp).toLocaleDateString('en-IN')}
        </Text>
      </View>
      <Text style={[
        styles.entryAmount,
        { color: item.amount.amount >= 0 ? Colors.success : Colors.error }
      ]}>
        {formatIndianCurrency(item.amount.amount)}
      </Text>
    </View>
  );

  const renderCategoryItem = ({ item }: { item: CashCategory }) => (
    <View style={[styles.categoryItem, { borderLeftColor: item.color }]}>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryBalance}>
          {formatIndianCurrency(item.balance)}
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* PocketWorkx App Logo - 200px height */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>PocketWorkx App</Text>
      </View>

      {/* Page Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.pageTitle}>Cash Management</Text>
      </View>

      {/* Total Liquid Cash Card */}
      <View style={styles.totalCashCard}>
        <Text style={styles.cardTitle}>Total Liquid Cash</Text>
        <Text style={styles.totalAmount}>
          ₹{getTotalCash().toLocaleString('en-IN')}
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        {/* First Row */}
        <View style={styles.actionsRow}>
          <Pressable 
            style={styles.actionButton}
            onPress={() => setAddCashModalVisible(true)}
          >
            <View style={styles.actionIcon}>
              <Feather name="plus" size={24} color={Colors.accent} />
            </View>
            <Text style={styles.actionText}>Add Cash</Text>
          </Pressable>

          <Pressable 
            style={styles.actionButton}
            onPress={() => setMoveCashModalVisible(true)}
          >
            <View style={styles.actionIcon}>
              <Feather name="arrow-right" size={24} color={Colors.accent} />
            </View>
            <Text style={styles.actionText}>Move Cash</Text>
          </Pressable>
        </View>

        {/* Second Row */}
        <View style={styles.actionsRow}>
          <Pressable 
            style={styles.actionButton}
            onPress={() => setRecordExpenseModalVisible(true)}
          >
            <View style={styles.actionIcon}>
              <Feather name="minus" size={24} color={Colors.error} />
            </View>
            <Text style={styles.actionText}>Record Expense</Text>
          </Pressable>

          <Pressable 
            style={styles.actionButton}
            onPress={() => setAccountDepositModalVisible(true)}
          >
            <View style={styles.actionIcon}>
              <Feather name="credit-card" size={24} color={Colors.info} />
            </View>
            <Text style={styles.actionText}>Account Deposit</Text>
          </Pressable>
        </View>
      </View>

      {/* Recent Entries */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Recent Entries</Text>
        {cashEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No recent entries</Text>
          </View>
        ) : (
          <FlatList
            data={cashEntries
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 5) // Show only 5 recent entries
            }
            keyExtractor={(item) => item.id}
            renderItem={renderRecentEntry}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Cash Categories */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Cash Categories</Text>
        <Text style={styles.sectionSubtitle}>Balance per category</Text>
        
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={renderCategoryItem}
          scrollEnabled={false}
        />
      </View>

      {/* Add Cash Modal */}
      <Modal visible={addCashModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Cash</Text>
            
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter description"
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Location</Text>
            <View style={styles.pickerContainer}>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.pickerOption,
                    location === cat.name && styles.pickerOptionSelected
                  ]}
                  onPress={() => setLocation(cat.name)}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    location === cat.name && styles.pickerOptionTextSelected
                  ]}>
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  resetForm();
                  setAddCashModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddCash}
              >
                <Text style={styles.confirmButtonText}>Add Cash</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Move Cash Modal */}
      <Modal visible={moveCashModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Move Cash Between Categories</Text>
            
            <Text style={styles.inputLabel}>From Category</Text>
            <View style={styles.pickerContainer}>
              {categories.filter(cat => cat.balance > 0).map((cat) => (
                <Pressable
                  key={`from-${cat.id}`}
                  style={[
                    styles.pickerOption,
                    fromCategory === cat.name && styles.pickerOptionSelected
                  ]}
                  onPress={() => setFromCategory(cat.name)}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    fromCategory === cat.name && styles.pickerOptionTextSelected
                  ]}>
                    {cat.name} ({formatIndianCurrency(cat.balance)})
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.inputLabel}>To Category</Text>
            <View style={styles.pickerContainer}>
              {categories.map((cat) => (
                <Pressable
                  key={`to-${cat.id}`}
                  style={[
                    styles.pickerOption,
                    toCategory === cat.name && styles.pickerOptionSelected
                  ]}
                  onPress={() => setToCategory(cat.name)}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    toCategory === cat.name && styles.pickerOptionTextSelected
                  ]}>
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount to move"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  resetForm();
                  setMoveCashModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleMoveCash}
              >
                <Text style={styles.confirmButtonText}>Move Cash</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Record Expense Modal */}
      <Modal visible={recordExpenseModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Expense</Text>
            
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="What was purchased?"
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount spent"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Cash Category</Text>
            <View style={styles.pickerContainer}>
              {categories.filter(cat => cat.balance > 0).map((cat) => (
                <Pressable
                  key={`expense-${cat.id}`}
                  style={[
                    styles.pickerOption,
                    location === cat.name && styles.pickerOptionSelected
                  ]}
                  onPress={() => setLocation(cat.name)}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    location === cat.name && styles.pickerOptionTextSelected
                  ]}>
                    {cat.name} ({formatIndianCurrency(cat.balance)})
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  resetForm();
                  setRecordExpenseModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleRecordExpense}
              >
                <Text style={styles.confirmButtonText}>Record</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Account Deposit Modal (Coming Soon) */}
      <Modal visible={accountDepositModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Deposit to Bank Account</Text>
            
            <View style={styles.comingSoonContainer}>
              <Feather name="credit-card" size={48} color={Colors.info} />
              <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
              <Text style={styles.comingSoonDescription}>
                Bank account integration will be available in the next update. 
                You'll be able to deposit cash directly to your linked bank accounts.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAccountDeposit}
              >
                <Text style={styles.confirmButtonText}>Got it</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Spacer for menu button */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary, // Golden yellow background
  },
  logoContainer: {
    paddingTop: 60, // Status bar padding
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.md,
  },
  logoText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    height: 28, // Approximating 200px height request proportionally
  },
  titleContainer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    marginBottom: Spacing.lg,
  },
  pageTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  totalCashCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  totalAmount: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  sectionContainer: {
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  actionButton: {
    backgroundColor: Colors.surface,
    flex: 1,
    marginHorizontal: Spacing.xs,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  entryItem: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryInfo: {
    flex: 1,
  },
  entryDescription: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  entryLocation: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  entryDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
  entryAmount: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginLeft: Spacing.md,
  },
  categoryItem: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  categoryBalance: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.accent,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.gray100,
    padding: Spacing.inputPadding,
    borderRadius: BorderRadius.md,
    fontSize: Typography.fontSize.md,
    marginBottom: Spacing.md,
    color: Colors.textPrimary,
  },
  pickerContainer: {
    marginBottom: Spacing.md,
  },
  pickerOption: {
    backgroundColor: Colors.gray100,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  pickerOptionSelected: {
    backgroundColor: Colors.accent,
  },
  pickerOptionText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  pickerOptionTextSelected: {
    color: Colors.textInverted,
    fontWeight: Typography.fontWeight.semibold,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  modalButton: {
    paddingVertical: Spacing.buttonPadding,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    flex: 1,
    marginHorizontal: Spacing.sm,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.gray200,
  },
  confirmButton: {
    backgroundColor: Colors.accent,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textInverted,
  },
  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  comingSoonTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  comingSoonDescription: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.md,
  },
});
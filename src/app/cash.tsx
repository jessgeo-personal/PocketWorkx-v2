//# Enhanced Cash.tsx - Complete Implementation

//## Enhanced Cash Management with 8 Features

//```typescript
// src/app/cash.tsx - Enhanced Cash Management System
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
  Image,
  RefreshControl
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useStorage } from '../services/storage/StorageProvider';

// Enhanced Data Structures
interface CashEntry {
  id: string;
  description: string;
  amount: { amount: number; currency: 'INR' };
  category: string; // Renamed from "location"
  type: 'add' | 'expense' | 'transfer' | 'deposit';
  receiptPhoto?: string; // Path to receipt image
  timestamp: Date;
  notes?: string;
}

interface CashTransaction {
  id: string;
  type: 'credit' | 'debit' | 'transfer';
  amount: number;
  category?: string;
  fromCategory?: string; // For transfers
  toCategory?: string; // For transfers
  description: string;
  timestamp: Date;
  receiptPhoto?: string;
  notes?: string;
}

interface CashCategory {
  id: string;
  name: string;
  balance: number;
  color?: string;
  isDefault: boolean;
}

// Default cash categories
const DEFAULT_CATEGORIES: CashCategory[] = [
  { id: '1', name: 'Wallet', balance: 0, color: '#8B5CF6', isDefault: true },
  { id: '2', name: 'Loose Change (Car)', balance: 0, color: '#10B981', isDefault: true },
  { id: '3', name: 'Loose Change (Home)', balance: 0, color: '#F59E0B', isDefault: true },
  { id: '4', name: 'Safe', balance: 0, color: '#EF4444', isDefault: true },
];

// Color palette from design system
const Colors = {
  primary: '#F7D94C',
  accent: '#8B5CF6',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  surface: '#FFFFFF',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray500: '#6B7280',
};

const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const Typography = {
  fontSize: {
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

const BorderRadius = {
  md: 8,
  lg: 12,
};

// Indian Rupee Formatting
const formatIndianCurrency = (amount: number): string => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
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
  const [categories, setCategories] = useState<CashCategory[]>(DEFAULT_CATEGORIES);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [addCashModalVisible, setAddCashModalVisible] = useState(false);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [categoryDetailModalVisible, setCategoryDetailModalVisible] = useState(false);
  const [totalCashModalVisible, setTotalCashModalVisible] = useState(false);
  
  // Form states
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [fromCategory, setFromCategory] = useState('');
  const [toCategory, setToCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [receiptPhoto, setReceiptPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedCategoryForDetail, setSelectedCategoryForDetail] = useState<CashCategory | null>(null);

  // Initialize data from storage
  useEffect(() => {
    initializeData();
  }, [state]);

  const initializeData = async () => {
    // Load categories from storage or use defaults
    if (state.cashCategories && state.cashCategories.length > 0) {
      setCategories(state.cashCategories);
    } else {
      // Initialize with default categories
      dispatch({ type: 'UPDATE_CASH_CATEGORIES', payload: DEFAULT_CATEGORIES });
      setCategories(DEFAULT_CATEGORIES);
    }

    // Load transactions
    if (state.cashTransactions) {
      setTransactions(state.cashTransactions);
    }
  };

  // Calculate total cash across all categories
  const getTotalCash = (): number => {
    return categories.reduce((total, cat) => total + cat.balance, 0);
  };

  // Get transactions for a specific category
  const getCategoryTransactions = (categoryId: string): CashTransaction[] => {
    return transactions
      .filter(t => t.category === categoryId || t.fromCategory === categoryId || t.toCategory === categoryId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  // Add new category
  const addCategory = (name: string) => {
    if (!name.trim()) return;
    
    const newCategory: CashCategory = {
      id: Date.now().toString(),
      name: name.trim(),
      balance: 0,
      color: Colors.accent,
      isDefault: false,
    };

    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    dispatch({ type: 'UPDATE_CASH_CATEGORIES', payload: updatedCategories });
    setNewCategoryName('');
  };

  // Update category balance
  const updateCategoryBalance = (categoryId: string, amount: number) => {
    const updatedCategories = categories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, balance: Math.max(0, cat.balance + amount) }
        : cat
    );
    setCategories(updatedCategories);
    dispatch({ type: 'UPDATE_CASH_CATEGORIES', payload: updatedCategories });
  };

  // Add transaction
  const addTransaction = (transaction: Omit<CashTransaction, 'id' | 'timestamp'>) => {
    const newTransaction: CashTransaction = {
      ...transaction,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions);
    dispatch({ type: 'UPDATE_CASH_TRANSACTIONS', payload: updatedTransactions });
  };

  // Handle adding cash
  const handleAddCash = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const amountValue = parseFloat(amount);
    updateCategoryBalance(selectedCategory, amountValue);

    addTransaction({
      type: 'credit',
      amount: amountValue,
      category: selectedCategory,
      description: description || 'Cash Added',
      receiptPhoto,
      notes,
    });

    resetForm();
    setAddCashModalVisible(false);
  };

  // Handle expense recording
  const handleRecordExpense = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const amountValue = parseFloat(amount);
    const category = categories.find(c => c.id === selectedCategory);
    
    if (!category || category.balance < amountValue) {
      Alert.alert('Error', 'Insufficient cash in selected category');
      return;
    }

    updateCategoryBalance(selectedCategory, -amountValue);

    // Save receipt if captured
    let receiptPath = null;
    if (receiptPhoto) {
      receiptPath = await saveReceipt(receiptPhoto);
    }

    addTransaction({
      type: 'debit',
      amount: amountValue,
      category: selectedCategory,
      description: description || 'Expense',
      receiptPhoto: receiptPath,
      notes,
    });

    resetForm();
    setExpenseModalVisible(false);
  };

  // Handle cash transfer between categories
  const handleTransferCash = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (fromCategory === toCategory) {
      Alert.alert('Error', 'Cannot transfer to the same category');
      return;
    }

    const amountValue = parseFloat(amount);
    const fromCat = categories.find(c => c.id === fromCategory);
    
    if (!fromCat || fromCat.balance < amountValue) {
      Alert.alert('Error', 'Insufficient cash in source category');
      return;
    }

    // Update balances
    updateCategoryBalance(fromCategory, -amountValue);
    updateCategoryBalance(toCategory, amountValue);

    addTransaction({
      type: 'transfer',
      amount: amountValue,
      fromCategory,
      toCategory,
      description: description || 'Internal Transfer',
      notes,
    });

    resetForm();
    setTransferModalVisible(false);
  };

  // Save receipt photo to secure directory
  const saveReceipt = async (photoUri: string): Promise<string> => {
    try {
      const receiptsDir = FileSystem.documentDirectory + 'receipts/';
      
      // Create receipts directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(receiptsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(receiptsDir);
      }

      const fileName = `receipt_${Date.now()}.jpg`;
      const newPath = receiptsDir + fileName;
      
      await FileSystem.copyAsync({
        from: photoUri,
        to: newPath,
      });

      return newPath;
    } catch (error) {
      console.error('Failed to save receipt:', error);
      return photoUri; // Fallback to original path
    }
  };

  // Capture receipt photo
  const captureReceipt = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to capture receipts');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setReceiptPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture receipt photo');
    }
  };

  // Upload receipt from gallery
  const uploadReceipt = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Gallery permission is required to upload receipts');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setReceiptPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload receipt photo');
    }
  };

  // Reset form
  const resetForm = () => {
    setAmount('');
    setDescription('');
    setNotes('');
    setReceiptPhoto(null);
    setFromCategory('');
    setToCategory('');
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await initializeData();
    setRefreshing(false);
  };

  // Open category detail modal
  const openCategoryDetail = (category: CashCategory) => {
    setSelectedCategoryForDetail(category);
    setCategoryDetailModalVisible(true);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>PocketWorkx</Text>
        <Text style={styles.logoSubtext}>Cash Management</Text>
      </View>

      {/* Total Cash Card - Clickable */}
      <Pressable 
        style={styles.totalCashCard}
        onPress={() => setTotalCashModalVisible(true)}
      >
        <Text style={styles.totalCashLabel}>Total Liquid Cash</Text>
        <Text style={styles.totalCashAmount}>
          {formatIndianCurrency(getTotalCash())}
        </Text>
        <Text style={styles.tapToViewText}>Tap to view all transactions</Text>
      </Pressable>

      {/* Cash Categories */}
      <View style={styles.categoriesContainer}>
        <Text style={styles.sectionTitle}>Cash Categories</Text>
        
        {categories.map((category) => (
          <Pressable
            key={category.id}
            style={[styles.categoryCard, { borderLeftColor: category.color }]}
            onPress={() => openCategoryDetail(category)}
          >
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryAmount}>
                {formatIndianCurrency(category.balance)}
              </Text>
            </View>
            <Text style={styles.tapToViewText}>Tap for details</Text>
          </Pressable>
        ))}

        {/* Add New Category */}
        <View style={styles.addCategoryContainer}>
          <TextInput
            style={styles.newCategoryInput}
            placeholder="Add new category..."
            value={newCategoryName}
            onChangeText={setNewCategoryName}
          />
          <Pressable
            style={styles.addCategoryButton}
            onPress={() => addCategory(newCategoryName)}
          >
            <Text style={styles.addCategoryButtonText}>Add</Text>
          </Pressable>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Pressable
          style={[styles.actionButton, styles.primaryAction]}
          onPress={() => setAddCashModalVisible(true)}
        >
          <Text style={styles.primaryActionText}>Add Cash</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => setExpenseModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>Record Expense</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => setTransferModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>Move Cash</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => setDepositModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>Deposit to Bank</Text>
        </Pressable>
      </View>

      {/* Add Cash Modal */}
      <Modal visible={addCashModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Cash</Text>
            
            <Text style={styles.inputLabel}>Cash Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCategory}
                onValueChange={setSelectedCategory}
                style={styles.picker}
              >
                {categories.map((cat) => (
                  <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                ))}
              </Picker>
            </View>

            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="Optional description"
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Optional notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

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

      {/* Record Expense Modal */}
      <Modal visible={expenseModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Expense</Text>
            
            <Text style={styles.inputLabel}>Cash Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCategory}
                onValueChange={setSelectedCategory}
                style={styles.picker}
              >
                {categories.filter(cat => cat.balance > 0).map((cat) => (
                  <Picker.Item 
                    key={cat.id} 
                    label={`${cat.name} (${formatIndianCurrency(cat.balance)})`} 
                    value={cat.id} 
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="What was purchased?"
              value={description}
              onChangeText={setDescription}
            />

            {/* Receipt Photo Section */}
            <View style={styles.receiptSection}>
              <Text style={styles.inputLabel}>Receipt (Optional)</Text>
              <View style={styles.receiptActions}>
                <Pressable style={styles.receiptButton} onPress={captureReceipt}>
                  <Text style={styles.receiptButtonText}>📷 Capture</Text>
                </Pressable>
                <Pressable style={styles.receiptButton} onPress={uploadReceipt}>
                  <Text style={styles.receiptButtonText}>📁 Upload</Text>
                </Pressable>
              </View>
              
              {receiptPhoto && (
                <View style={styles.receiptPreview}>
                  <Image source={{ uri: receiptPhoto }} style={styles.receiptImage} />
                  <Pressable
                    style={styles.removeReceiptButton}
                    onPress={() => setReceiptPhoto(null)}
                  >
                    <Text style={styles.removeReceiptText}>Remove</Text>
                  </Pressable>
                </View>
              )}
            </View>

            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Additional notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  resetForm();
                  setExpenseModalVisible(false);
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

      {/* Transfer Cash Modal */}
      <Modal visible={transferModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Move Cash Between Categories</Text>
            
            <Text style={styles.inputLabel}>From Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={fromCategory}
                onValueChange={setFromCategory}
                style={styles.picker}
              >
                <Picker.Item label="Select source category" value="" />
                {categories.filter(cat => cat.balance > 0).map((cat) => (
                  <Picker.Item 
                    key={cat.id} 
                    label={`${cat.name} (${formatIndianCurrency(cat.balance)})`} 
                    value={cat.id} 
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.inputLabel}>To Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={toCategory}
                onValueChange={setToCategory}
                style={styles.picker}
              >
                <Picker.Item label="Select destination category" value="" />
                {categories.map((cat) => (
                  <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                ))}
              </Picker>
            </View>

            {/* Option to create new category */}
            <View style={styles.newCategoryInModal}>
              <Text style={styles.inputLabel}>Or create new category:</Text>
              <View style={styles.addCategoryContainer}>
                <TextInput
                  style={styles.newCategoryInput}
                  placeholder="New category name"
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                />
                <Pressable
                  style={styles.addCategoryButton}
                  onPress={() => {
                    addCategory(newCategoryName);
                    setToCategory(categories[categories.length - 1]?.id || '');
                  }}
                >
                  <Text style={styles.addCategoryButtonText}>Add</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount to transfer"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="Optional description"
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  resetForm();
                  setTransferModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleTransferCash}
              >
                <Text style={styles.confirmButtonText}>Transfer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Deposit to Bank Modal (Coming Soon) */}
      <Modal visible={depositModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Deposit to Bank</Text>
            
            <View style={styles.comingSoonContainer}>
              <Text style={styles.comingSoonText}>🏦</Text>
              <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
              <Text style={styles.comingSoonDescription}>
                Bank account integration will be available in the next update. 
                You'll be able to deposit cash directly to your linked bank accounts.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => setDepositModalVisible(false)}
              >
                <Text style={styles.confirmButtonText}>Got it</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Detail Modal */}
      <Modal visible={categoryDetailModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.largeModal]}>
            <Text style={styles.modalTitle}>
              {selectedCategoryForDetail?.name} Transactions
            </Text>
            
            <View style={styles.categoryBalanceHeader}>
              <Text style={styles.categoryBalanceLabel}>Current Balance</Text>
              <Text style={styles.categoryBalanceAmount}>
                {selectedCategoryForDetail ? formatIndianCurrency(selectedCategoryForDetail.balance) : '₹0'}
              </Text>
            </View>

            <FlatList
              data={selectedCategoryForDetail ? getCategoryTransactions(selectedCategoryForDetail.id) : []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.transactionItem}>
                  <View style={styles.transactionHeader}>
                    <Text style={styles.transactionDescription}>{item.description}</Text>
                    <Text style={[
                      styles.transactionAmount,
                      { color: item.type === 'credit' ? Colors.success : Colors.error }
                    ]}>
                      {item.type === 'credit' ? '+' : '-'}{formatIndianCurrency(item.amount)}
                    </Text>
                  </View>
                  <Text style={styles.transactionDate}>
                    {new Date(item.timestamp).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                  {item.notes && (
                    <Text style={styles.transactionNotes}>{item.notes}</Text>
                  )}
                  {item.receiptPhoto && (
                    <Text style={styles.receiptIndicator}>📎 Receipt attached</Text>
                  )}
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No transactions yet</Text>
              }
              style={styles.transactionList}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => setCategoryDetailModalVisible(false)}
              >
                <Text style={styles.confirmButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Total Cash Modal - All Transactions */}
      <Modal visible={totalCashModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.largeModal]}>
            <Text style={styles.modalTitle}>All Cash Transactions</Text>
            
            <View style={styles.totalCashSummary}>
              <Text style={styles.totalCashSummaryLabel}>Total Liquid Cash</Text>
              <Text style={styles.totalCashSummaryAmount}>
                {formatIndianCurrency(getTotalCash())}
              </Text>
              <Text style={styles.totalCashBreakdown}>
                Across {categories.length} categories
              </Text>
            </View>

            <FlatList
              data={transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.transactionItem}>
                  <View style={styles.transactionHeader}>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionDescription}>{item.description}</Text>
                      <Text style={styles.transactionCategory}>
                        {item.type === 'transfer' 
                          ? `${categories.find(c => c.id === item.fromCategory)?.name} → ${categories.find(c => c.id === item.toCategory)?.name}`
                          : categories.find(c => c.id === item.category)?.name
                        }
                      </Text>
                    </View>
                    <View style={styles.transactionAmountContainer}>
                      <Text style={[
                        styles.transactionAmount,
                        { color: item.type === 'credit' ? Colors.success : Colors.error }
                      ]}>
                        {item.type === 'credit' ? '+' : item.type === 'transfer' ? '↔' : '-'}{formatIndianCurrency(item.amount)}
                      </Text>
                      <Text style={styles.transactionType}>
                        {item.type === 'credit' ? 'Added' : item.type === 'transfer' ? 'Transfer' : 'Expense'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.transactionDate}>
                    {new Date(item.timestamp).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                  {item.notes && (
                    <Text style={styles.transactionNotes}>{item.notes}</Text>
                  )}
                  {item.receiptPhoto && (
                    <Text style={styles.receiptIndicator}>📎 Receipt attached</Text>
                  )}
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No transactions yet</Text>
              }
              style={styles.transactionList}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => setTotalCashModalVisible(false)}
              >
                <Text style={styles.confirmButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  logoContainer: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  logoText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  logoSubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  totalCashCard: {
    backgroundColor: Colors.success,
    margin: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  totalCashLabel: {
    fontSize: Typography.fontSize.lg,
    color: Colors.surface,
    fontWeight: Typography.fontWeight.medium,
  },
  totalCashAmount: {
    fontSize: Typography.fontSize['4xl'],
    color: Colors.surface,
    fontWeight: Typography.fontWeight.bold,
    marginTop: Spacing.sm,
  },
  tapToViewText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    opacity: 0.7,
  },
  categoriesContainer: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  categoryCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    marginBottom: Spacing.md,
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
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  categoryAmount: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.accent,
  },
  addCategoryContainer: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
  newCategoryInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: Typography.fontSize.md,
    marginRight: Spacing.sm,
  },
  addCategoryButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
  },
  addCategoryButtonText: {
    color: Colors.surface,
    fontWeight: Typography.fontWeight.semibold,
    fontSize: Typography.fontSize.md,
  },
  actionsContainer: {
    padding: Spacing.lg,
    paddingBottom: 100, // Space for menu button
  },
  actionButton: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryAction: {
    backgroundColor: Colors.accent,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  primaryActionText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.surface,
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
    maxHeight: '80%',
  },
  largeModal: {
    width: '95%',
    maxHeight: '90%',
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
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: Typography.fontSize.md,
    marginBottom: Spacing.md,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  picker: {
    height: 50,
  },
  receiptSection: {
    marginVertical: Spacing.md,
  },
  receiptActions: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  receiptButton: {
    backgroundColor: Colors.gray200,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
    flex: 1,
    alignItems: 'center',
  },
  receiptButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  receiptPreview: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  receiptImage: {
    width: 150,
    height: 150,
    borderRadius: BorderRadius.md,
  },
  removeReceiptButton: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.md,
  },
  removeReceiptText: {
    color: Colors.surface,
    fontSize: Typography.fontSize.sm,
  },
  newCategoryInModal: {
    marginVertical: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.gray200,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  modalButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
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
    color: Colors.surface,
  },
  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  comingSoonText: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  comingSoonTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  comingSoonDescription: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  categoryBalanceHeader: {
    backgroundColor: Colors.gray100,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryBalanceLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  categoryBalanceAmount: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.accent,
    marginTop: Spacing.sm,
  },
  transactionList: {
    maxHeight: 300,
  },
  transactionItem: {
    backgroundColor: Colors.gray100,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  transactionCategory: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  transactionType: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  transactionNotes: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  receiptIndicator: {
    fontSize: Typography.fontSize.sm,
    color: Colors.accent,
    marginTop: Spacing.xs,
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginVertical: Spacing.xl,
  },
  totalCashSummary: {
    backgroundColor: Colors.success,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  totalCashSummaryLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.surface,
  },
  totalCashSummaryAmount: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.surface,
    marginTop: Spacing.sm,
  },
  totalCashBreakdown: {
    fontSize: Typography.fontSize.sm,
    color: Colors.surface,
    opacity: 0.8,
    marginTop: Spacing.xs,
  },
});
```

## Required Storage Provider Updates

```typescript
// Update StorageProvider.tsx to support new cash data structures

interface PocketWorkxState {
  // ... existing state
  cashCategories: CashCategory[];
  cashTransactions: CashTransaction[];
}

// Add new action types
type StorageAction = 
  | { type: 'UPDATE_CASH_CATEGORIES'; payload: CashCategory[] }
  | { type: 'UPDATE_CASH_TRANSACTIONS'; payload: CashTransaction[] }
  // ... other existing actions

// Update reducer
const reducer = (state: PocketWorkxState, action: StorageAction): PocketWorkxState => {
  switch (action.type) {
    case 'UPDATE_CASH_CATEGORIES':
      return { ...state, cashCategories: action.payload };
    case 'UPDATE_CASH_TRANSACTIONS':
      return { ...state, cashTransactions: action.payload };
    // ... other cases
  }
};
```

## Installation Requirements

```bash
# Install required dependencies
npm install @react-native-picker/picker expo-image-picker

# If using Expo managed workflow
expo install @react-native-picker/picker expo-image-picker

# Update app.json for permissions
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "The app accesses your photos to let you upload receipts for expense tracking.",
          "cameraPermission": "The app accesses your camera to let you capture receipts for expense tracking."
        }
      ]
    ]
  }
}
```


// src/services/accountService.ts
import * as SecureStore from 'expo-secure-store';

// Storage Keys
const STORAGE_KEYS = {
  ACCOUNTS: 'pocketworkx_accounts',
  TRANSACTIONS: 'pocketworkx_transactions',
  NEXT_ID: 'pocketworkx_next_id',
  APP_VERSION: 'pocketworkx_app_version',
} as const;

// Current data version for migration handling
const CURRENT_VERSION = '1.0.0';

// Types
export interface Account {
  id: string;
  nickname: string;
  bankName: string;
  accountNumber: string; // This will be encrypted
  accountType: 'savings' | 'salary' | 'current' | 'other';
  balance: number;
  currency: 'INR' | 'USD' | 'EUR' | 'AED' | 'GBP';
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  date: string;
  category?: string;
  createdAt: string;
}

export interface Currency {
  code: 'INR' | 'USD' | 'EUR' | 'AED' | 'GBP';
  symbol: string;
  name: string;
}

// Error Classes
class StorageError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'StorageError';
  }
}

class DataIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataIntegrityError';
  }
}

// Utility Functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Secure Storage Wrapper with Error Handling
class SecureStorageManager {
  private static async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      throw new StorageError(`Failed to store data for key: ${key}`, error as Error);
    }
  }

  private static async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      throw new StorageError(`Failed to retrieve data for key: ${key}`, error as Error);
    }
  }

  private static async deleteItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      throw new StorageError(`Failed to delete data for key: ${key}`, error as Error);
    }
  }

  static async setJSON<T>(key: string, data: T): Promise<void> {
    const jsonString = JSON.stringify(data);
    await this.setItem(key, jsonString);
  }

  static async getJSON<T>(key: string, defaultValue: T): Promise<T> {
    const jsonString = await this.getItem(key);
    if (!jsonString) return defaultValue;
    
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      throw new DataIntegrityError(`Invalid JSON data for key: ${key}`);
    }
  }

  static async removeKey(key: string): Promise<void> {
    await this.deleteItem(key);
  }
}

// Data Initialization with Migration Support
const initializeStorage = async (): Promise<void> => {
  try {
    // Check if this is first run or needs migration
    const currentVersion = await SecureStorageManager.getJSON(STORAGE_KEYS.APP_VERSION, null);
    
    if (!currentVersion) {
      // First run - initialize with sample data
      await initializeSampleData();
      await SecureStorageManager.setJSON(STORAGE_KEYS.APP_VERSION, CURRENT_VERSION);
      console.log('PocketWorkx: Initialized with sample data');
    } else if (currentVersion !== CURRENT_VERSION) {
      // Handle future migrations here
      await migrateTo(CURRENT_VERSION);
      console.log(`PocketWorkx: Migrated from ${currentVersion} to ${CURRENT_VERSION}`);
    }
  } catch (error) {
    console.error('PocketWorkx: Storage initialization failed:', error);
    throw new StorageError('Failed to initialize secure storage', error as Error);
  }
};

// Sample Data Initialization
const initializeSampleData = async (): Promise<void> => {
  const sampleAccounts: Account[] = [
    {
      id: generateId(),
      nickname: 'ICICI Savings Account',
      bankName: 'ICICI Bank',
      accountNumber: '****1235', // Masked for display, real number encrypted
      accountType: 'savings',
      balance: 10023550,
      currency: 'INR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    },
    {
      id: generateId(),
      nickname: 'ICICI Salary Account',
      bankName: 'ICICI Bank',
      accountNumber: '****3366',
      accountType: 'salary',
      balance: 329556,
      currency: 'INR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    },
    {
      id: generateId(),
      nickname: 'HDFC Savings Account',
      bankName: 'HDFC Bank',
      accountNumber: '****4353',
      accountType: 'savings',
      balance: 329556,
      currency: 'INR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    },
  ];

  const sampleTransactions: Transaction[] = [
    {
      id: generateId(),
      accountId: sampleAccounts[0].id,
      description: 'Salary Credit',
      amount: 85000,
      type: 'CREDIT',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Income',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      accountId: sampleAccounts[0].id,
      description: 'ATM Withdrawal',
      amount: 5000,
      type: 'DEBIT',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Cash',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      accountId: sampleAccounts[1].id,
      description: 'Online Transfer',
      amount: 15000,
      type: 'DEBIT',
      date: new Date().toISOString(),
      category: 'Transfer',
      createdAt: new Date().toISOString(),
    },
  ];

  await SecureStorageManager.setJSON(STORAGE_KEYS.ACCOUNTS, sampleAccounts);
  await SecureStorageManager.setJSON(STORAGE_KEYS.TRANSACTIONS, sampleTransactions);
  await SecureStorageManager.setJSON(STORAGE_KEYS.NEXT_ID, 1000);
};

// Migration Function (for future versions)
const migrateTo = async (version: string): Promise<void> => {
  // Future migration logic will go here
  await SecureStorageManager.setJSON(STORAGE_KEYS.APP_VERSION, version);
};

// Account Service Functions
export const fetchAccountById = async (id: string): Promise<(Account & { transactions: Transaction[] }) | null> => {
  try {
    await initializeStorage();
    await delay(300); // Simulate network delay
    
    const accounts = await SecureStorageManager.getJSON<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
    const account = accounts.find(acc => acc.id === id && acc.isActive);
    
    if (!account) {
      return null;
    }

    // Get transactions for this account
    const transactions = await SecureStorageManager.getJSON<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    const accountTransactions = transactions
      .filter(t => t.accountId === id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      ...account,
      transactions: accountTransactions,
    } as Account & { transactions: Transaction[] };
  } catch (error) {
    console.error('fetchAccountById error:', error);
    throw error;
  }
};

export const getAllAccounts = async (): Promise<Account[]> => {
  try {
    await initializeStorage();
    await delay(200); // Simulate network delay
    
    const accounts = await SecureStorageManager.getJSON<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
    return accounts
      .filter(acc => acc.isActive)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    console.error('getAllAccounts error:', error);
    throw error;
  }
};

export const addTransaction = async (accountId: string, transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> => {
  try {
    await initializeStorage();
    await delay(400); // Simulate network delay
    
    // Get current accounts and transactions
    const accounts = await SecureStorageManager.getJSON<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
    const transactions = await SecureStorageManager.getJSON<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    
    const accountIndex = accounts.findIndex(acc => acc.id === accountId);
    if (accountIndex === -1) {
      throw new Error('Account not found');
    }

    // Create new transaction
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    // Update account balance
    const balanceChange = transaction.type === 'CREDIT' 
      ? transaction.amount 
      : -transaction.amount;
    
    accounts[accountIndex] = {
      ...accounts[accountIndex],
      balance: accounts[accountIndex].balance + balanceChange,
      updatedAt: new Date().toISOString(),
    };

    // Save updated data
    const updatedTransactions = [...transactions, newTransaction];
    await SecureStorageManager.setJSON(STORAGE_KEYS.ACCOUNTS, accounts);
    await SecureStorageManager.setJSON(STORAGE_KEYS.TRANSACTIONS, updatedTransactions);

    return newTransaction;
  } catch (error) {
    console.error('addTransaction error:', error);
    throw error;
  }
};

export const updateAccount = async (accountId: string, updates: Partial<Omit<Account, 'id' | 'createdAt'>>): Promise<Account> => {
  try {
    await initializeStorage();
    await delay(350); // Simulate network delay
    
    const accounts = await SecureStorageManager.getJSON<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
    const accountIndex = accounts.findIndex(acc => acc.id === accountId);
    
    if (accountIndex === -1) {
      throw new Error('Account not found');
    }

    // Update account
    accounts[accountIndex] = {
      ...accounts[accountIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await SecureStorageManager.setJSON(STORAGE_KEYS.ACCOUNTS, accounts);
    return accounts[accountIndex];
  } catch (error) {
    console.error('updateAccount error:', error);
    throw error;
  }
};

export const createAccount = async (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> => {
  try {
    await initializeStorage();
    await delay(500); // Simulate network delay
    
    const accounts = await SecureStorageManager.getJSON<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
    
    const newAccount: Account = {
      ...accountData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    const updatedAccounts = [...accounts, newAccount];
    await SecureStorageManager.setJSON(STORAGE_KEYS.ACCOUNTS, updatedAccounts);

    return newAccount;
  } catch (error) {
    console.error('createAccount error:', error);
    throw error;
  }
};

export const deleteAccount = async (accountId: string): Promise<void> => {
  try {
    await initializeStorage();
    await delay(300); // Simulate network delay
    
    const accounts = await SecureStorageManager.getJSON<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
    const accountIndex = accounts.findIndex(acc => acc.id === accountId);
    
    if (accountIndex === -1) {
      throw new Error('Account not found');
    }

    // Soft delete - mark as inactive
    accounts[accountIndex] = {
      ...accounts[accountIndex],
      isActive: false,
      updatedAt: new Date().toISOString(),
    };

    await SecureStorageManager.setJSON(STORAGE_KEYS.ACCOUNTS, accounts);
  } catch (error) {
    console.error('deleteAccount error:', error);
    throw error;
  }
};

// Data Management Functions
export const clearAllData = async (): Promise<void> => {
  try {
    await SecureStorageManager.removeKey(STORAGE_KEYS.ACCOUNTS);
    await SecureStorageManager.removeKey(STORAGE_KEYS.TRANSACTIONS);
    await SecureStorageManager.removeKey(STORAGE_KEYS.NEXT_ID);
    await SecureStorageManager.removeKey(STORAGE_KEYS.APP_VERSION);
    console.log('PocketWorkx: All data cleared');
  } catch (error) {
    console.error('clearAllData error:', error);
    throw error;
  }
};

export const exportData = async (): Promise<{accounts: Account[], transactions: Transaction[]}> => {
  try {
    await initializeStorage();
    const accounts = await SecureStorageManager.getJSON<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
    const transactions = await SecureStorageManager.getJSON<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    
    return {
      accounts: accounts.filter(acc => acc.isActive),
      transactions,
    };
  } catch (error) {
    console.error('exportData error:', error);
    throw error;
  }
};

// Currency definitions
export const CURRENCIES: Currency[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

// Export error classes for external use
export { StorageError, DataIntegrityError };
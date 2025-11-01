// src/services/storage/localFileStore.ts
import { File, Directory, Paths } from 'expo-file-system';

type PocketWorkxState = {
  // legacy and other domains
  cashEntries?: any[];
  accounts?: any[];
  loans?: any[];
  creditCards?: any[];
  investments?: any[];
  receivables?: any[];

  // new cash domain (used by StorageProvider and cash.tsx)
  cashCategories?: Array<{
    id: string;
    name: string;
    balance: number;
    color?: string;
    isDefault: boolean;
  }>;
  cashTransactions?: Array<{
    id: string;
    type: 'credit' | 'debit' | 'transfer';
    amount: number;
    category?: string;
    fromCategory?: string;
    toCategory?: string;
    description: string;
    // Persist as string in file; StorageProvider converts to Date in memory
    timestamp?: string | Date;
    receiptPhoto?: string;
    notes?: string;
  }>;
// NEW: credit cards domain
  creditCardEntries?: Array<{
    id: string;
    bank: string;
    cardNumber: string;
    cardType: 'visa' | 'mastercard' | 'amex' | 'rupay' | 'diners';
    cardName: string;
    creditLimit: { amount: number; currency: 'INR' };
    currentBalance: { amount: number; currency: 'INR' };
    availableCredit: { amount: number; currency: 'INR' };
    minimumPayment: { amount: number; currency: 'INR' };
    paymentDueDate?: string | Date;
    statementDate?: string | Date;
    interestRate: number;
    annualFee?: { amount: number; currency: 'INR' };
    rewardProgram?: {
      type: 'cashback' | 'points' | 'miles';
      rate: number;
      currentBalance: number;
    };
    isActive: boolean;
    timestamp?: string | Date;
    encryptedData?: {
      encryptionKey: string;
      encryptionAlgorithm: string;
      lastEncrypted: string | Date;
      isEncrypted: boolean;
    };
    auditTrail?: {
      createdBy: string;
      createdAt?: string | Date;
      updatedBy: string;
      updatedAt?: string | Date;
      version: number;
      changes: any[];
    };
    linkedTransactions?: any[];
  }>;

  creditCardTransactions?: Array<{
    id: string;
    description: string;
    amount: { amount: number; currency: 'INR' };
    type: 'CHARGE' | 'PAYMENT' | 'CREDIT' | 'FEE';
    category: string;
    cardId: string;
    merchantName?: string;
    notes?: string;
    timestamp?: string | Date;
    encryptedData?: {
      encryptionKey: string;
      encryptionAlgorithm: string;
      lastEncrypted: string | Date;
      isEncrypted: boolean;
    };
    auditTrail?: {
      createdBy: string;
      createdAt?: string | Date;
      updatedBy: string;
      updatedAt?: string | Date;
      version: number;
      changes: any[];
    };
    linkedTransactions?: any[];
  }>;

  // meta
  _version?: number;
  _updatedAt?: string; // ISO date
};

// Use the new Directory and File classes
const DATA_DIR = new Directory(Paths.document, 'pocketworkx');
const DATA_FILE = new File(DATA_DIR, 'data.json');

async function ensureDataFile(): Promise<void> {
  try {
    // Create directory if it doesn't exist (much simpler now)
    if (!DATA_DIR.exists) {
      await DATA_DIR.create();
    }
    
    // Create file with initial data if it doesn't exist
    if (!DATA_FILE.exists) {
        const initial: PocketWorkxState = {
            cashEntries: [],
            accounts: [],
            loans: [],
            creditCards: [],
            investments: [],
            receivables: [],
            // new fields
            cashCategories: [],         // ensure present in file
            cashTransactions: [],       // ensure present in file
              // NEW: credit cards
            creditCardEntries: [],
            creditCardTransactions: [],
            _version: 1,
            _updatedAt: new Date().toISOString(),
        };
        await DATA_FILE.write(JSON.stringify(initial));
    }
  } catch (e) {
    // Fail safe: if creating fails, throw to surface early in dev
    throw new Error(`Failed to ensure data file: ${(e as Error).message}`);
  }
}

export async function getState(): Promise<PocketWorkxState> {
  await ensureDataFile();
  
  try {
    // Read file content using the new API
    const content = await DATA_FILE.text();
    return JSON.parse(content) as PocketWorkxState;
  } catch (parseError) {
    // If corrupt, re-initialize to a safe default
    const fallback: PocketWorkxState = {
        cashEntries: [],
        accounts: [],
        loans: [],
        creditCards: [],
        investments: [],
        receivables: [],
        cashCategories: [],       // include
        cashTransactions: [],     // include
        // NEW: credit cards
        creditCardEntries: [],
        creditCardTransactions: [],
        _version: 1,
        _updatedAt: new Date().toISOString(),
    };
    await DATA_FILE.write(JSON.stringify(fallback)); // add await
    return fallback;

  }
}

export async function setState(next: PocketWorkxState): Promise<void> {
  const stamped = { ...next, _updatedAt: new Date().toISOString() };
  await DATA_FILE.write(JSON.stringify(stamped));
}

// Convenience helpers for domain slices (example: cash)
export async function getCashEntries(): Promise<any[]> {
  const s = await getState();
  return s.cashEntries ?? [];
}

export async function setCashEntries(entries: any[]): Promise<void> {
  const s = await getState();
  await setState({ ...s, cashEntries: entries });
}

// Additional helper methods using the new API
export async function getFileInfo(): Promise<{ size: number; exists: boolean; uri: string }> {
  return {
    size: DATA_FILE.size,
    exists: DATA_FILE.exists,
    uri: DATA_FILE.uri
  };
}

export async function clearAllData(): Promise<void> {
  if (DATA_FILE.exists) {
    DATA_FILE.delete();
  }
}

export async function backupData(): Promise<File> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = new File(DATA_DIR, `data-backup-${timestamp}.json`);
  
  if (DATA_FILE.exists) {
    DATA_FILE.copy(backupFile);
  }
  
  return backupFile;
}

// You can add similar helpers for accounts, loans, etc.
// export async function getAccounts(): Promise<any[]> {
//   const s = await getState();
//   return s.accounts ?? [];
// }

// export async function setAccounts(accounts: any[]): Promise<void> {
//   const s = await getState();
//   await setState({ ...s, accounts });
// }

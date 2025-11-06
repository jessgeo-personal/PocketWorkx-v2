// src/services/storage/StorageProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { getState, setState } from './localFileStore';

// ===== Cash domain types (align with cash.tsx) =====
export interface CashCategory {
  id: string;
  name: string;
  balance: number;
  color?: string;
  isDefault: boolean;
}
export interface CashTransaction {
  id: string;
  type: 'credit' | 'debit' | 'transfer';
  amount: number;
  category?: string;
  fromCategory?: string; // for transfers
  toCategory?: string;   // for transfers
  description: string;
  timestamp: Date;
  receiptPhoto?: string;
  notes?: string;
}

// ===== Credit Cards domain types =====
export interface CreditCardEntry {
  id: string;
  bank: string;
  cardNumber: string; // masked (****1234)
  cardType: 'visa' | 'mastercard' | 'amex' | 'rupay' | 'diners';
  cardName: string;
  creditLimit: { amount: number; currency: 'INR' };
  currentBalance: { amount: number; currency: 'INR' };
  availableCredit: { amount: number; currency: 'INR' };
  minimumPayment: { amount: number; currency: 'INR' };
  paymentDueDate: Date;
  statementDate: Date;
  interestRate: number;
  annualFee?: { amount: number; currency: 'INR' };
  rewardProgram?: {
    type: 'cashback' | 'points' | 'miles';
    rate: number;
    currentBalance: number;
  };
  isActive: boolean;
  timestamp: Date;
  encryptedData?: {
    encryptionKey: string;
    encryptionAlgorithm: string;
    lastEncrypted: Date;
    isEncrypted: boolean;
  };
  auditTrail?: {
    createdBy: string;
    createdAt: Date;
    updatedBy: string;
    updatedAt: Date;
    version: number;
    changes: any[];
  };
  linkedTransactions?: any[];
}

export interface CreditCardTransaction {
  id: string;
  description: string;
  amount: { amount: number; currency: 'INR' }; 
  type: 'CHARGE' | 'PAYMENT' | 'CREDIT' | 'FEE';
  category: string;
  cardId: string;
  merchantName?: string;
  notes?: string;
  timestamp: Date;
  encryptedData?: {
    encryptionKey: string;
    encryptionAlgorithm: string;
    lastEncrypted: Date;
    isEncrypted: boolean;
  };
  auditTrail?: {
    createdBy: string;
    createdAt: Date;
    updatedBy: string;
    updatedAt: Date;
    version: number;
    changes: any[];
  };
  linkedTransactions?: any[];
}

// ===== Loans domain types =====

// ===== Loans domain types =====
// EMI schedule item stored with each loan
export interface LoanScheduleItem {
  id: string;                          // stable id: `${loan.id}-${yyyyMM}`
  dueDate: Date;
  amount: { amount: number; currency: 'INR' };
  status: 'due' | 'paid' | 'overdue';
  paidOn?: Date;
  notes?: string;
  sourceAccountId?: string;
}

export interface LoanEntry {
  id: string;
  type: 'home' | 'car' | 'personal' | 'education' | 'other';
  bank: string;
  loanNumber: string;
  principalAmount: { amount: number; currency: 'INR' };
  currentBalance: { amount: number; currency: 'INR' };
  interestRate: number; // annual %
  tenureMonths: number;
  emiAmount: { amount: number; currency: 'INR' };
  nextPaymentDate: Date;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  // Enhanced loan fields
  preferredAccountId?: string;
  monthlyDueDay?: number;
  timestamp: Date;
  // NEW: persisted full EMI schedule
  schedule?: LoanScheduleItem[];
  encryptedData?: {
    encryptionKey: string;
    encryptionAlgorithm: string;
    lastEncrypted: Date;
    isEncrypted: boolean;
  };
  auditTrail?: {
    createdBy: string;
    createdAt: Date;
    updatedBy: string;
    updatedAt: Date;
    version: number;
    changes: any[];
  };
  linkedTransactions?: any[];
}

// ===== Fixed Income domain types =====
export interface FixedIncomeEntry {
  id: string;
  instrumentType: 'fd' | 'rd' | 'nre' | 'nro' | 'fcnr' | 'company_deposit' | 'debt';
  
  // IMPORTANT: Keep bankOrIssuer for backward compatibility, but make it optional
  // Use specific fields based on instrument type
  bankOrIssuer?: string;      // Legacy field - kept for existing UI
  bankName?: string;          // For FD/RD/NRE/NRO/FCNR
  companyName?: string;       // For company deposits  
  issuerName?: string;        // For debt instruments
  instrumentName: string;
  
  // Multi-currency financial details
  principalAmount: { amount: number; currency: string };
  currentValue: { amount: number; currency: string };
  maturityAmount?: { amount: number; currency: string };  // ADD THIS LINE
  accountNumber?: string;  // ADD THIS LINE
  interestRate: number;

  // Interest structure
  compoundingFrequency: 'annually' | 'monthly' | 'quarterly' | 'daily';
  interestPayout: 'monthly' | 'quarterly' | 'annually' | 'cumulative' | 'maturity';
  payoutAccountId?: string;
  
  // Dates
  startDate: Date;
  maturityDate: Date;
  
  // RD-specific fields
  recurringDepositDay?: number;
  sourceAccountId?: string;
  installmentAmount?: { amount: number; currency: string };
  rdMonthlyInstallment?: number;  // ADD THIS LINE
  rdDayOfMonth?: number;  // ADD THIS LINE  
  rdSourceAccountId?: string;  // ADD THIS LINE

  // Debt instrument-specific fields
  bondType?: 'government' | 'corporate' | 'municipal';
  creditRating?: string;
  isinCode?: string;
  faceValue?: { amount: number; currency: string };
  couponRate?: number;
  yieldToMaturity?: number;
  hasCallOption?: boolean;
  hasPutOption?: boolean;
  
  // Renewal options
  autoRenew: boolean;
  renewalNotification?: {
    enabled: boolean;
    daysBeforeMaturity: number;
    lastNotifiedAt?: Date;
    pendingRateConfirmation?: {
      oldRate: number;
      newRate: number;
      notificationDate: Date;
      userResponse?: 'pending' | 'confirmed' | 'rejected';
    };
  };
  
  // Status
  isActive: boolean;
  isClosed?: boolean;  // ADD THIS LINE
  closureDate?: Date;  // ADD THIS LINE
  transferAccount?: string;  // ADD THIS LINE
  nomineeDetails?: string;
  jointHolders?: string[];
  notes?: string;

  // System fields
  timestamp: Date;
  encryptedData?: {
    encryptionKey: string;
    encryptionAlgorithm: string;
    lastEncrypted: Date;
    isEncrypted: boolean;
  };
  auditTrail?: {
    createdBy: string;
    createdAt: Date;
    updatedBy: string;
    updatedAt: Date;
    version: number;
    changes: any[];
  };
  linkedTransactions?: any[];
}




export interface FixedIncomeTransaction {
  id: string;
  description: string;
  amount: { amount: number; currency: 'INR' };
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'INTEREST_CREDIT' | 'MATURITY' | 'RENEWAL';
  category: string;
  instrumentId: string;
  notes?: string;
  timestamp: Date;
  encryptedData?: {
    encryptionKey: string;
    encryptionAlgorithm: string;
    lastEncrypted: Date;
    isEncrypted: boolean;
  };
  auditTrail?: {
    createdBy: string;
    createdAt: Date;
    updatedBy: string;
    updatedAt: Date;
    version: number;
    changes: any[];
  };
  linkedTransactions?: any[];
}


// ===== Persisted AppModel from localFileStore =====
// getState() returns a JSON object. It may or may not have the new cash fields yet.
// Make them optional to remain backward compatible with existing files.
export type AppModel = Awaited<ReturnType<typeof getState>> & {
  cashCategories?: CashCategory[];
  cashTransactions?: CashTransaction[];

  // Credit cards
  creditCardEntries?: CreditCardEntry[];
  creditCardTransactions?: CreditCardTransaction[];

  // Loans
  loanEntries?: LoanEntry[];

  // Fixed Income
  fixedIncomeEntries?: FixedIncomeEntry[];
  fixedIncomeTransactions?: FixedIncomeTransaction[];
  
  // Onboarding state
  onboardingCompleted?: boolean;
};




// ===== Context shape =====
type StorageContextValue = {
  state: AppModel | null;
  loading: boolean;
  reload: () => Promise<void>;

  // Generic save mechanism
  save: (updater: (draft: AppModel) => AppModel) => Promise<void>;

  // Domain helpers for Cash (for convenience in screens)
  updateCashCategories: (categories: CashCategory[]) => Promise<void>;
  updateCashTransactions: (transactions: CashTransaction[]) => Promise<void>;
};

const StorageContext = createContext<StorageContextValue>({
  state: null,
  loading: true,
  reload: async () => {},
  save: async () => {},
  updateCashCategories: async () => {},
  updateCashTransactions: async () => {},
});

export const useStorage = () => useContext(StorageContext);

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setLocal] = useState<AppModel | null>(null);
  const [loading, setLoading] = useState(true);


  const load = async () => {
    setLoading(true);
    try {
      const s = await getState();
      
      // CRITICAL: Add null check before processing
      if (!s) {
        console.warn('[Storage] getState returned null, using defaults');
        const defaultState: AppModel = {
          cashEntries: [],
          accounts: [],
          loans: [],
          creditCards: [],
          investments: [],
          receivables: [],
          cashCategories: [],
          cashTransactions: [],
          creditCardEntries: [],
          creditCardTransactions: [],
          loanEntries: [],
          fixedIncomeEntries: [],
          fixedIncomeTransactions: [],
          onboardingCompleted: false, // ADD this
        };
        setLocal(defaultState);
        setLoading(false);
        return;
      }

      // Backward-compatible initialization for newly added fields
      const withDefaults: AppModel = {
        ...s,
        // ADD null safety for all arrays
        cashCategories: Array.isArray(s.cashCategories) ? s.cashCategories : [],
        cashTransactions: Array.isArray(s.cashTransactions) ? s.cashTransactions.map((t: any) => ({
          ...t,
          timestamp: t.timestamp instanceof Date 
            ? t.timestamp 
            : t.timestamp 
              ? new Date(t.timestamp) 
              : new Date(),
        })) : [],
        
        // ADD null safety for all other arrays
        cashEntries: Array.isArray(s.cashEntries) ? s.cashEntries : [],
        accounts: Array.isArray(s.accounts) ? s.accounts : [],
        loans: Array.isArray(s.loans) ? s.loans : [],
        creditCards: Array.isArray(s.creditCards) ? s.creditCards : [],
        investments: Array.isArray(s.investments) ? s.investments : [],
        receivables: Array.isArray(s.receivables) ? s.receivables : [],

        // Credit card arrays with safe date normalization
        creditCardEntries: Array.isArray(s.creditCardEntries) ? s.creditCardEntries.map((c: any) => ({
          ...c,
          paymentDueDate: c.paymentDueDate ? new Date(c.paymentDueDate) : new Date(),
          statementDate: c.statementDate ? new Date(c.statementDate) : new Date(),
          timestamp: c.timestamp ? new Date(c.timestamp) : new Date(),
          auditTrail: c.auditTrail
            ? {
                ...c.auditTrail,
                createdAt: c.auditTrail.createdAt ? new Date(c.auditTrail.createdAt) : new Date(),
                updatedAt: c.auditTrail.updatedAt ? new Date(c.auditTrail.updatedAt) : new Date(),
              }
            : undefined,
        })) : [],

        creditCardTransactions: Array.isArray(s.creditCardTransactions) ? s.creditCardTransactions.map((t: any) => ({
          ...t,
          timestamp: t.timestamp ? new Date(t.timestamp) : new Date(),
          auditTrail: t.auditTrail
            ? {
                ...t.auditTrail,
                createdAt: t.auditTrail.createdAt ? new Date(t.auditTrail.createdAt) : new Date(),
                updatedAt: t.auditTrail.updatedAt ? new Date(t.auditTrail.updatedAt) : new Date(),
              }
            : undefined,
        })) : [],

        // Loan entries with safe date normalization
        loanEntries: Array.isArray(s.loanEntries) ? s.loanEntries.map((l: any) => ({
          ...l,
          nextPaymentDate: l.nextPaymentDate ? new Date(l.nextPaymentDate) : new Date(),
          startDate: l.startDate ? new Date(l.startDate) : new Date(),
          endDate: l.endDate ? new Date(l.endDate) : new Date(),
          timestamp: l.timestamp ? new Date(l.timestamp) : new Date(),
          schedule: Array.isArray(l.schedule)
            ? l.schedule.map((it: any) => ({
                ...it,
                dueDate: it.dueDate ? new Date(it.dueDate) : new Date(),
                paidOn: it.paidOn ? new Date(it.paidOn) : undefined,
              }))
            : [],
          auditTrail: l.auditTrail
            ? {
                ...l.auditTrail,
                createdAt: l.auditTrail.createdAt ? new Date(l.auditTrail.createdAt) : new Date(),
                updatedAt: l.auditTrail.updatedAt ? new Date(l.auditTrail.updatedAt) : new Date(),
              }
            : undefined,
        })) : [],

        // Fixed income entries with safe date normalization
        fixedIncomeEntries: Array.isArray(s.fixedIncomeEntries) ? s.fixedIncomeEntries.map((fi: any) => ({
          ...fi,
          startDate: fi.startDate ? new Date(fi.startDate) : new Date(),
          maturityDate: fi.maturityDate ? new Date(fi.maturityDate) : new Date(),
          timestamp: fi.timestamp ? new Date(fi.timestamp) : new Date(),
          auditTrail: fi.auditTrail
            ? {
                ...fi.auditTrail,
                createdAt: fi.auditTrail.createdAt ? new Date(fi.auditTrail.createdAt) : new Date(),
                updatedAt: fi.auditTrail.updatedAt ? new Date(fi.auditTrail.updatedAt) : new Date(),
              }
            : undefined,
        })) : [],

        fixedIncomeTransactions: Array.isArray(s.fixedIncomeTransactions) ? s.fixedIncomeTransactions.map((t: any) => ({
          ...t,
          timestamp: t.timestamp ? new Date(t.timestamp) : new Date(),
          auditTrail: t.auditTrail
            ? {
                ...t.auditTrail,
                createdAt: t.auditTrail.createdAt ? new Date(t.auditTrail.createdAt) : new Date(),
                updatedAt: t.auditTrail.updatedAt ? new Date(t.auditTrail.updatedAt) : new Date(),
              }
            : undefined,
        })) : [],
      };

      setLocal(withDefaults);
    } catch (e) {
      console.error('[Storage] Load failed:', e);
      // CRITICAL: Set safe fallback state instead of staying null
      const fallbackState: AppModel = {
        cashEntries: [],
        accounts: [],
        loans: [],
        creditCards: [],
        investments: [],
        receivables: [],
        cashCategories: [],
        cashTransactions: [],
        creditCardEntries: [],
        creditCardTransactions: [],
        loanEntries: [],
        fixedIncomeEntries: [],
        fixedIncomeTransactions: [],
        onboardingCompleted: false,
      };
      setLocal(fallbackState);
      
      Alert.alert('Storage Error', 'Failed to load data. Using safe defaults.');
    } finally {
      setLoading(false);
    }
  };


  const save = async (updater: (draft: AppModel) => AppModel) => {
    if (!state) return;
    // Work on a shallow clone to avoid direct mutation
    const next = updater({ ...state });
    await setState(next);
    setLocal(next);
  };

  const reload = async () => {
    await load();
  };

  // Convenience helpers to keep screens simpler
  const updateCashCategories = async (categories: CashCategory[]) => {
    await save((draft) => ({
      ...draft,
      cashCategories: categories,
    }));
  };

  const updateCashTransactions = async (transactions: CashTransaction[]) => {
    await save((draft) => ({
      ...draft,
      // Persist timestamps as ISO strings to be JSON-friendly
      cashTransactions: transactions.map((t) => ({
        ...t,
        timestamp: t.timestamp instanceof Date ? t.timestamp : new Date(t.timestamp),
      })),
    }));
  };

  useEffect(() => {
    load();
  }, []);

  const value = useMemo<StorageContextValue>(
    () => ({
      state,
      loading,
      reload,
      save,
      updateCashCategories,
      updateCashTransactions,
    }),
    [state, loading]
  );

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
};

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

// ===== Persisted AppModel from localFileStore =====
// getState() returns a JSON object. It may or may not have the new cash fields yet.
// Make them optional to remain backward compatible with existing files.
export type AppModel = Awaited<ReturnType<typeof getState>> & {
  cashCategories?: CashCategory[];
  cashTransactions?: CashTransaction[];
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

      // Backward-compatible initialization for newly added fields
      const withDefaults: AppModel = {
        ...s,
        cashCategories: s.cashCategories ?? [],
        cashTransactions: (s.cashTransactions as any[] | undefined)?.map((t) => ({
            ...t,
            // Ensure timestamp is always a Date, never undefined
            timestamp: t.timestamp instanceof Date 
                ? t.timestamp 
                : t.timestamp 
                    ? new Date(t.timestamp) 
                    : new Date(), // fallback to current date if missing
        })) ?? [],

      };

      setLocal(withDefaults);
    } catch (e) {
      Alert.alert('Storage Error', 'Failed to load local data file.');
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

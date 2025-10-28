// src/services/storage/StorageProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { getState, setState } from './localFileStore';

export type AppModel = Awaited<ReturnType<typeof getState>>;

type StorageContextValue = {
  state: AppModel | null;
  loading: boolean;
  reload: () => Promise<void>;
  save: (updater: (draft: AppModel) => AppModel) => Promise<void>;
};

const StorageContext = createContext<StorageContextValue>({
  state: null,
  loading: true,
  reload: async () => {},
  save: async () => {},
});

export const useStorage = () => useContext(StorageContext);

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setLocal] = useState<AppModel | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const s = await getState();
      setLocal(s);
    } catch (e) {
      Alert.alert('Storage Error', 'Failed to load local data file.');
    } finally {
      setLoading(false);
    }
  };

  const save = async (updater: (draft: AppModel) => AppModel) => {
    if (!state) return;
    const next = updater({ ...state });
    await setState(next);
    setLocal(next);
  };

  const reload = async () => {
    await load();
  };

  useEffect(() => {
    load();
  }, []);

  const value = useMemo<StorageContextValue>(() => ({ state, loading, reload, save }), [state, loading]);

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
};

// src/services/storage/localFileStore.ts
import * as FileSystem from 'expo-file-system';

type PocketWorkxState = {
  // Add domains as needed; keep them optional to avoid breaking old files
  cashEntries?: any[];
  accounts?: any[];
  loans?: any[];
  creditCards?: any[];
  investments?: any[];
  receivables?: any[];
  // meta for migrations
  _version?: number;
  _updatedAt?: string; // ISO date
};

const DATA_DIR = `${FileSystem.documentDirectory}pocketworkx/`;
const DATA_FILE = `${DATA_DIR}data.json`;

async function ensureDataFile(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(DATA_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(DATA_DIR, { intermediates: true });
    }
    const fileInfo = await FileSystem.getInfoAsync(DATA_FILE);
    if (!fileInfo.exists) {
      const initial: PocketWorkxState = {
        cashEntries: [],
        accounts: [],
        loans: [],
        creditCards: [],
        investments: [],
        receivables: [],
        _version: 1,
        _updatedAt: new Date().toISOString(),
      };
      await FileSystem.writeAsStringAsync(DATA_FILE, JSON.stringify(initial), { encoding: FileSystem.EncodingType.UTF8 });
    }
  } catch (e) {
    // Fail safe: if creating fails, throw to surface early in dev
    throw new Error(`Failed to ensure data file: ${(e as Error).message}`);
  }
}

export async function getState(): Promise<PocketWorkxState> {
  await ensureDataFile();
  const content = await FileSystem.readAsStringAsync(DATA_FILE, { encoding: FileSystem.EncodingType.UTF8 });
  try {
    return JSON.parse(content) as PocketWorkxState;
  } catch {
    // If corrupt, re-initialize to a safe default
    const fallback: PocketWorkxState = {
      cashEntries: [],
      accounts: [],
      loans: [],
      creditCards: [],
      investments: [],
      receivables: [],
      _version: 1,
      _updatedAt: new Date().toISOString(),
    };
    await FileSystem.writeAsStringAsync(DATA_FILE, JSON.stringify(fallback), { encoding: FileSystem.EncodingType.UTF8 });
    return fallback;
  }
}

export async function setState(next: PocketWorkxState): Promise<void> {
  const stamped = { ...next, _updatedAt: new Date().toISOString() };
  await FileSystem.writeAsStringAsync(DATA_FILE, JSON.stringify(stamped), { encoding: FileSystem.EncodingType.UTF8 });
}

// Convenience helpers for domain slices (example: cash)
export async function getCashEntries(): Promise<any[]> {
  const s = await getState();
  return s.cashEntries ?? [];
}

export async function setCashEntries(entries: any[]): Promise<void> {
  const s = await getState();
  s.cashEntries = entries;
  await setState(s);
}

// You can add similar helpers for accounts, loans, etc.
// export async function getAccounts() {}
// export async function setAccounts(next: any[]) {}

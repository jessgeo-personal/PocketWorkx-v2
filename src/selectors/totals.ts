// src/selectors/totals.ts
// Centralized totals and net worth computations for PocketWorkx
// Ensures a single source of truth across the app.

import type { AppModel } from '../services/storage/StorageProvider';

export type Totals = {
  totalBankAccounts: number;
  totalLoans: number;
  totalCreditCards: number;
  totalInvestments: number;
  totalPhysicalAssets: number;
  totalCrypto: number;
  netWorth: number;
  totalLiquidity: number;
};

type Options = {
  includeCryptoInLiquidity?: boolean; // user-configurable, default false
};

const sum = (nums: number[]) => nums.reduce((a, b) => a + (b || 0), 0);

export const computeTotals = (state: AppModel | undefined, opts: Options = {}): Totals => {
  const includeCrypto = !!opts.includeCryptoInLiquidity;

  // Bank Accounts: sum of account.balance.amount (trust running balance)
  const totalBankAccounts = sum(
    ((state?.accounts ?? []) as any[]).map(acc => acc?.balance?.amount ?? 0)
  );

  // Loans: sum of currentBalance.amount (liability)
  const totalLoans = sum(
    ((state?.loanEntries ?? []) as any[]).map(l => l?.currentBalance?.amount ?? 0)
  );

  // Credit Cards: sum of currentBalance.amount (liability)
  const totalCreditCards = sum(
    ((state?.creditCardEntries ?? []) as any[]).map(c => c?.currentBalance?.amount ?? 0)
  );

  // Investments: placeholder 0 until implemented
  const totalInvestments = sum(
    ((state?.investments ?? []) as any[]).map((inv: any) => inv?.currentValue?.amount ?? 0)
  );

  // Physical Assets: placeholder 0 until implemented
  const totalPhysicalAssets = sum(
    ((state?.physicalAssets ?? []) as any[]).map((pa: any) => pa?.currentValue?.amount ?? 0)
  );

  // Crypto: placeholder 0 unless state has entries
  const totalCrypto = sum(
    ((state?.cryptoHoldings ?? []) as any[]).map((h: any) => h?.currentValue?.amount ?? 0)
  );

  // Net Worth = (bank + crypto + investments + physical) - (loans + credit cards)
  const netWorth =
    (totalBankAccounts + totalCrypto + totalInvestments + totalPhysicalAssets) -
    (totalLoans + totalCreditCards);

  // Total Liquidity = bank + (optional) crypto + non-auto-renew FDs (future)
  const totalLiquidity = totalBankAccounts + (includeCrypto ? totalCrypto : 0);

  return {
    totalBankAccounts,
    totalLoans,
    totalCreditCards,
    totalInvestments,
    totalPhysicalAssets,
    totalCrypto,
    netWorth,
    totalLiquidity,
  };
};

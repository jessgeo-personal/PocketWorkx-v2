// src/selectors/totals.ts
// Centralized totals and net worth computations for PocketWorkx
// Ensures a single source of truth across the app.

import type { AppModel } from '../services/storage/StorageProvider';

export type Totals = {
  totalCash: number;
  totalBankAccounts: number;
  totalLoans: number;
  totalCreditCards: number;
  totalFixedIncome: number;      // NEW: Fixed Income subtotal
  totalFixedIncomeByCurrency: Record<string, number>; 
  totalInvestments: number;      // Will be sum of all investment subtypes
  totalPhysicalAssets: number;
  totalCrypto: number;
  netWorth: number;
  totalLiquidity: number;
};

type Options = {
  includeCryptoInLiquidity?: boolean; // user-configurable, default false
};

const sum = (nums: number[]) => nums.reduce((a, b) => a + (b || 0), 0);

export const computeTotals = (state: AppModel | null | undefined, opts: Options = {}): Totals => {
  const includeCrypto = !!opts.includeCryptoInLiquidity;

  // CASH: sum of all cash entries (centralized calculation)
  const totalCash = sum(
    ((state?.cashEntries ?? []) as any[]).map(e => e?.amount?.amount ?? 0)
  );

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

  // Fixed Income: sum of currentValue.amount
  const totalFixedIncome = sum(
    ((state?.fixedIncomeEntries ?? []) as any[]).map(fi => fi?.currentValue?.amount ?? 0)
  );

  // Investments: will be sum of Fixed Income + Stocks/Commodities/Forex when implemented
  const totalInvestments = totalFixedIncome; // For now, only Fixed Income

  // Physical Assets: placeholder 0 until implemented (safe property access)
  const totalPhysicalAssets = sum(
    (((state as any)?.physicalAssets ?? []) as any[]).map((pa: any) => pa?.currentValue?.amount ?? 0)
  );

  // Crypto: placeholder 0 until implemented (safe property access)
  const totalCrypto = sum(
    (((state as any)?.cryptoHoldings ?? []) as any[]).map((h: any) => h?.currentValue?.amount ?? 0)
  );

  // Net Worth = (bank + crypto + investments + physical) - (loans + credit cards)
  const netWorth =
    (totalBankAccounts + totalCrypto + totalInvestments + totalPhysicalAssets) -
    (totalLoans + totalCreditCards);

  // Total Liquidity = bank + (optional) crypto + non-auto-renew FDs (future)
  const totalLiquidity = totalBankAccounts + (includeCrypto ? totalCrypto : 0);

  return {
    totalCash,
    totalBankAccounts,
    totalLoans,
    totalCreditCards,
    totalFixedIncome,
    totalFixedIncomeByCurrency: fixedIncomeEntries.reduce((acc, fi) => {
      const currency = fi?.currentValue?.currency ?? 'INR';
      acc[currency] = (acc[currency] ?? 0) + (fi?.currentValue?.amount ?? 0);
      return acc;
    }, {} as Record<string, number>),
    totalInvestments,
    totalPhysicalAssets,
    totalCrypto,
    netWorth,
    totalLiquidity,
  };

};

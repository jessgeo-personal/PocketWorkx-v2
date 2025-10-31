// src/utils/idGeneration.ts
import { AssetType, CurrencyCode } from '../types/finance';

// Generate asset ID in format: assetType-assetNickname-currency-accountNumberMasked
export const generateAssetId = (
  assetType: AssetType,
  assetNickname: string,
  currency: CurrencyCode,
  accountNumberMasked: string
): string => {
  // Sanitize nickname (remove spaces, special chars)
  const cleanNickname = assetNickname
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 20); // Limit length
    
  return `${assetType}-${cleanNickname}-${currency}-${accountNumberMasked.replace(/\*/g, '')}`;
};

// Generate transaction ID in format: assetID-transactionYearMonth-incrementalNumber  
export const generateTransactionId = (
  assetId: string,
  transactionDate: Date,
  increment: number
): string => {
  const yearMonth = `${transactionDate.getFullYear()}${(transactionDate.getMonth() + 1).toString().padStart(2, '0')}`;
  const counter = increment.toString().padStart(3, '0');
  
  return `${assetId}-${yearMonth}-${counter}`;
};

// Helper to extract last 4 digits for masking
export const maskAccountNumber = (accountNumber: string): string => {
  const clean = accountNumber.replace(/\s/g, '');
  const last4 = clean.slice(-4);
  return last4.length === 4 ? last4 : 'XXXX';
};

// Helper to get default user profile (can be enhanced later)
export const getDefaultUserProfile = (): string => {
  return 'user-IN'; // Format: userName-profileCountry
};

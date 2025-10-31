// src/utils/currency.ts
import { Currency, Money } from '../types/finance';

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

export class CurrencyService {
  private static exchangeRates: Record<string, Record<string, number>> = {
    INR: { USD: 0.012, EUR: 0.011, AED: 0.044, GBP: 0.010, INR: 1 },
    USD: { INR: 83.0, EUR: 0.92, AED: 3.67, GBP: 0.81, USD: 1 },
    EUR: { INR: 90.2, USD: 1.09, AED: 4.00, GBP: 0.88, EUR: 1 },
    AED: { INR: 22.6, USD: 0.27, EUR: 0.25, GBP: 0.22, AED: 1 },
    GBP: { INR: 102.8, USD: 1.24, EUR: 1.14, AED: 4.55, GBP: 1 },
  };

  static formatMoney(money: Money, showSymbol: boolean = true): string {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === money.currency);
    if (!currency) return money.amount.toString();

    const formattedAmount = money.currency === 'INR' 
      ? this.formatIndianNumber(money.amount)
      : this.formatInternationalNumber(money.amount);

    return showSymbol ? `${currency.symbol}${formattedAmount}` : formattedAmount;
  }

  static formatIndianNumber(amount: number): string {
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    
    if (absAmount < 100000) {
      return (isNegative ? '-' : '') + absAmount.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    }

    const crores = Math.floor(absAmount / 10000000);
    const lakhs = Math.floor((absAmount % 10000000) / 100000);
    const thousands = Math.floor((absAmount % 100000) / 1000);
    const hundreds = absAmount % 1000;

    let result = '';
    if (crores > 0) result += `${crores},`;
    if (lakhs > 0) result += `${lakhs.toString().padStart(crores > 0 ? 2 : 1, '0')},`;
    if (thousands > 0) result += `${thousands.toString().padStart(lakhs > 0 || crores > 0 ? 2 : 1, '0')},`;
    result += hundreds.toString().padStart(thousands > 0 || lakhs > 0 || crores > 0 ? 3 : 1, '0');

    return (isNegative ? '-' : '') + result;
  }

  static formatInternationalNumber(amount: number): string {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  static convertCurrency(from: Money, toCurrency: Currency['code']): Money {
    if (from.currency === toCurrency) return from;

    const rate = this.exchangeRates[from.currency]?.[toCurrency] || 1;
    return {
      amount: from.amount * rate,
      currency: toCurrency
    };
  }

  static addMoney(money1: Money, money2: Money, resultCurrency?: Currency['code']): Money {
    const targetCurrency = resultCurrency || money1.currency;
    const converted1 = this.convertCurrency(money1, targetCurrency);
    const converted2 = this.convertCurrency(money2, targetCurrency);

    return {
      amount: converted1.amount + converted2.amount,
      currency: targetCurrency
    };
  }

  static subtractMoney(money1: Money, money2: Money, resultCurrency?: Currency['code']): Money {
    const targetCurrency = resultCurrency || money1.currency;
    const converted1 = this.convertCurrency(money1, targetCurrency);
    const converted2 = this.convertCurrency(money2, targetCurrency);

    return {
      amount: converted1.amount - converted2.amount,
      currency: targetCurrency
    };
  }

  static getCurrencyByCode(code: Currency['code']): Currency | undefined {
    return SUPPORTED_CURRENCIES.find(c => c.code === code);
  }

  static isValidCurrency(code: string): code is Currency['code'] {
    return SUPPORTED_CURRENCIES.some(c => c.code === code);
  }
}

// Utility functions for common formatting
export const formatCurrency = (amount: number, currency: Currency['code'] = 'INR'): string => {
  return CurrencyService.formatMoney({ amount, currency });
};

export const formatCompactCurrency = (amount: number, currency: Currency['code'] = 'INR'): string => {
  const symbol = SUPPORTED_CURRENCIES.find(c => c.code === currency)?.symbol || '₹';
  
  if (currency === 'INR') {
    if (amount >= 10000000) {
      return `${symbol}${(amount / 10000000).toFixed(1)} Cr`;
    } else if (amount >= 100000) {
      return `${symbol}${(amount / 100000).toFixed(1)} L`;
    } else if (amount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(1)} K`;
    }
  } else {
    if (amount >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(1)} M`;
    } else if (amount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(1)} K`;
    }
  }
  
  return `${symbol}${amount.toLocaleString()}`;
};

// Full, non-compact currency display, whole amounts by default
export const formatFullCurrency = (
  amount: number,
  currency: Currency['code'] = 'INR',
  showSymbol: boolean = true
): string => {
  // Reuse the existing service path to ensure consistent Indian vs international grouping
  return CurrencyService.formatMoney({ amount, currency }, showSymbol);
};

// Backward-compat convenience for current code paths
export const formatFullINR = (amount: number) => formatFullCurrency(amount, 'INR', true);

// Top 50 global currencies with native symbols and formatting

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  symbolPosition: 'before' | 'after';
  hasSpace: boolean;
}

export const CURRENCIES: Record<string, Currency> = {
  // Major Global Currencies
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimalPlaces: 0, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimalPlaces: 2, thousandsSeparator: "'", decimalSeparator: '.', symbolPosition: 'after', hasSpace: true },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  
  // Asian Currencies
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', decimalPlaces: 0, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', decimalPlaces: 0, thousandsSeparator: '.', decimalSeparator: ',', symbolPosition: 'before', hasSpace: true },
  PHP: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  VND: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', decimalPlaces: 0, thousandsSeparator: '.', decimalSeparator: ',', symbolPosition: 'after', hasSpace: true },
  
  // Middle East & Africa
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: true },
  SAR: { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: true },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', decimalPlaces: 2, thousandsSeparator: ' ', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  EGP: { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  ILS: { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', decimalPlaces: 2, thousandsSeparator: '.', decimalSeparator: ',', symbolPosition: 'before', hasSpace: false },
  
  // Latin America
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimalPlaces: 2, thousandsSeparator: '.', decimalSeparator: ',', symbolPosition: 'before', hasSpace: true },
  MXN: { code: 'MXN', symbol: '$', name: 'Mexican Peso', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  ARS: { code: 'ARS', symbol: '$', name: 'Argentine Peso', decimalPlaces: 2, thousandsSeparator: '.', decimalSeparator: ',', symbolPosition: 'before', hasSpace: false },
  CLP: { code: 'CLP', symbol: '$', name: 'Chilean Peso', decimalPlaces: 0, thousandsSeparator: '.', decimalSeparator: ',', symbolPosition: 'before', hasSpace: false },
  COP: { code: 'COP', symbol: '$', name: 'Colombian Peso', decimalPlaces: 2, thousandsSeparator: '.', decimalSeparator: ',', symbolPosition: 'before', hasSpace: false },
  PEN: { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  
  // Europe
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', decimalPlaces: 2, thousandsSeparator: ' ', decimalSeparator: ',', symbolPosition: 'after', hasSpace: true },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', decimalPlaces: 2, thousandsSeparator: ' ', decimalSeparator: ',', symbolPosition: 'after', hasSpace: true },
  DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone', decimalPlaces: 2, thousandsSeparator: '.', decimalSeparator: ',', symbolPosition: 'after', hasSpace: true },
  PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', decimalPlaces: 2, thousandsSeparator: ' ', decimalSeparator: ',', symbolPosition: 'after', hasSpace: true },
  CZK: { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', decimalPlaces: 2, thousandsSeparator: ' ', decimalSeparator: ',', symbolPosition: 'after', hasSpace: true },
  HUF: { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', decimalPlaces: 0, thousandsSeparator: ' ', decimalSeparator: ',', symbolPosition: 'after', hasSpace: true },
  RUB: { code: 'RUB', symbol: '₽', name: 'Russian Ruble', decimalPlaces: 2, thousandsSeparator: ' ', decimalSeparator: ',', symbolPosition: 'after', hasSpace: true },
  UAH: { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia', decimalPlaces: 2, thousandsSeparator: ' ', decimalSeparator: ',', symbolPosition: 'after', hasSpace: true },
  
  // Other Important
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  RON: { code: 'RON', symbol: 'lei', name: 'Romanian Leu', decimalPlaces: 2, thousandsSeparator: '.', decimalSeparator: ',', symbolPosition: 'after', hasSpace: true },
  BGN: { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev', decimalPlaces: 2, thousandsSeparator: ' ', decimalSeparator: ',', symbolPosition: 'after', hasSpace: true },
  HRK: { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna', decimalPlaces: 2, thousandsSeparator: '.', decimalSeparator: ',', symbolPosition: 'after', hasSpace: true },
  
  // Additional Asian/Pacific
  TWD: { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', decimalPlaces: 0, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  PKR: { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  BDT: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  LKR: { code: 'LKR', symbol: '₨', name: 'Sri Lankan Rupee', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  
  // African
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  GHS: { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  
  // Others
  ISK: { code: 'ISK', symbol: 'kr', name: 'Icelandic Krona', decimalPlaces: 0, thousandsSeparator: '.', decimalSeparator: ',', symbolPosition: 'after', hasSpace: true },
  QAR: { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal', decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false },
  KWD: { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar', decimalPlaces: 3, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: true },
  BHD: { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar', decimalPlaces: 3, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: true },
  OMR: { code: 'OMR', symbol: '﷼', name: 'Omani Rial', decimalPlaces: 3, thousandsSeparator: ',', decimalSeparator: '.', symbolPosition: 'before', hasSpace: false }
};

// Special formatting for Indian Rupee (lakhs/crores)
export function formatIndianRupee(amount: number): string {
  const absAmount = Math.abs(amount);
  const isNegative = amount < 0;
  const prefix = isNegative ? '-₹' : '₹';
  
  if (absAmount >= 10000000) { // 1 crore and above
    const crores = absAmount / 10000000;
    return `${prefix}${crores.toFixed(2)} Cr`;
  } else if (absAmount >= 100000) { // 1 lakh and above
    const lakhs = absAmount / 100000;
    return `${prefix}${lakhs.toFixed(2)} L`;
  } else if (absAmount >= 1000) { // 1 thousand and above
    const formatted = absAmount.toLocaleString('en-IN');
    return `${prefix}${formatted}`;
  } else {
    return `${prefix}${absAmount.toFixed(2)}`;
  }
}

// Generic currency formatter
export function formatCurrency(amount: number, currencyCode: string = 'INR'): string {
  if (currencyCode === 'INR') {
    return formatIndianRupee(amount);
  }
  
  const currency = CURRENCIES[currencyCode];
  if (!currency) {
    return `${amount.toFixed(2)} ${currencyCode}`;
  }
  
  const absAmount = Math.abs(amount);
  const isNegative = amount < 0;
  
  // Format the number with appropriate decimal places
  const formattedNumber = absAmount.toFixed(currency.decimalPlaces);
  
  // Add thousands separators
  const parts = formattedNumber.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandsSeparator);
  const finalNumber = parts.join(currency.decimalSeparator);
  
  // Construct final formatted string
  const sign = isNegative ? '-' : '';
  const space = currency.hasSpace ? ' ' : '';
  
  if (currency.symbolPosition === 'before') {
    return `${sign}${currency.symbol}${space}${finalNumber}`;
  } else {
    return `${sign}${finalNumber}${space}${currency.symbol}`;
  }
}

// Get currency symbol
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCIES[currencyCode]?.symbol || currencyCode;
}

// Get all supported currencies
export function getSupportedCurrencies(): Currency[] {
  return Object.values(CURRENCIES).sort((a, b) => a.name.localeCompare(b.name));
}

// Currency conversion placeholder (for future implementation)
export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string, exchangeRate?: number): number {
  // For MVP, return original amount if same currency or use static rate if provided
  if (fromCurrency === toCurrency) return amount;
  if (exchangeRate) return amount * exchangeRate;
  
  // Placeholder - in production, integrate with free exchange rate API
  console.warn(`Currency conversion from ${fromCurrency} to ${toCurrency} not implemented. Using original amount.`);
  return amount;
}

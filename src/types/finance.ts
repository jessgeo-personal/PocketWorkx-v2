// src/types/finance.ts
export interface Currency {
  code: 'INR' | 'USD' | 'EUR' | 'AED' | 'GBP';
  symbol: string;
  name: string;
}

export interface Money {
  amount: number;
  currency: Currency['code'];
}

// Enhanced security metadata for encrypted storage
export interface EncryptedStorageMetadata {
  encryptionKey: string;
  encryptionAlgorithm: 'AES-256' | 'AES-128';
  lastEncrypted: Date;
  isEncrypted: boolean;
}

// Audit trail for all financial records
export interface AuditTrail {
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
  version: number;
  changes: AuditChange[];
}

export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
  reason?: string;
}

// Transaction linking for relationships
export interface TransactionLink {
  transactionId: string;
  linkType: 'related' | 'split' | 'transfer' | 'payment';
  description?: string;
}

// Enhanced BankAccount interface
export interface BankAccount {
  id: string;
  name: string;
  type: 'savings' | 'checking' | 'salary' | 'current' | 'business';
  bank: string;
  branch?: string;
  ifscCode?: string; // Indian banking
  accountNumber: string; // Last 4 digits for display, full number encrypted
  balance: Money;
  isActive: boolean;
  openingDate: Date;
  interestRate?: number;
  minimumBalance?: Money;
  // Enhanced security & audit
  encryptedData: EncryptedStorageMetadata;
  auditTrail: AuditTrail;
  linkedTransactions: TransactionLink[];
}

// CryptoHolding interface (renamed from CryptoAsset)
export interface CryptoHolding {
  id: string;
  symbol: string; // BTC, ETH, SOL
  name: string; // Bitcoin, Ethereum, Solana
  quantity: number;
  averagePurchasePrice: Money;
  currentPrice: Money;
  currentValue: Money;
  exchange?: string;
  walletAddress?: string; // Encrypted
  walletType: 'hot' | 'cold' | 'exchange' | 'hardware';
  stakingInfo?: {
    isStaked: boolean;
    stakingReward: number;
    stakingPlatform?: string;
  };
  // Enhanced security & audit
  encryptedData: EncryptedStorageMetadata;
  auditTrail: AuditTrail;
  linkedTransactions: TransactionLink[];
}

// RealEstateAsset interface
export interface RealEstateAsset {
  id: string;
  type: 'residential' | 'commercial' | 'land' | 'rental';
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  purchasePrice: Money;
  currentValue: Money;
  purchaseDate: Date;
  area: {
    size: number;
    unit: 'sqft' | 'sqm' | 'acre';
  };
  documents: {
    registrationNumber?: string;
    surveyNumber?: string;
    documents: string[]; // File URLs
  };
  rental?: {
    monthlyRent: Money;
    tenantName?: string;
    leaseStart: Date;
    leaseEnd: Date;
  };
  taxes: {
    propertyTax: Money;
    lastPaidDate: Date;
  };
  // Enhanced security & audit
  encryptedData: EncryptedStorageMetadata;
  auditTrail: AuditTrail;
  linkedTransactions: TransactionLink[];
}

// Enhanced Investment interface
export interface Investment {
  id: string;
  type: 'stocks' | 'mutual_funds' | 'fixed_deposit' | 'real_estate' | 'gold' | 'bonds' | 'ppf' | 'nps' | 'sip' | 'other';
  name: string;
  description?: string;
  quantity: number;
  unitPrice: Money;
  currentValue: Money;
  investedAmount: Money;
  maturityDate?: Date;
  interestRate?: number;
  location?: string; // For physical assets
  weight?: number; // For gold in grams
  broker?: string;
  folioNumber?: string;
  isin?: string; // For Indian securities
  category?: 'equity' | 'debt' | 'hybrid' | 'commodity';
  riskLevel: 'low' | 'medium' | 'high';
  isActive: boolean;
  // Enhanced security & audit
  encryptedData: EncryptedStorageMetadata;
  auditTrail: AuditTrail;
  linkedTransactions: TransactionLink[];
}

// Enhanced Loan interface
export interface Loan {
  id: string;
  type: 'home' | 'personal' | 'car' | 'education' | 'business' | 'gold' | 'other';
  bank: string;
  accountNumber: string; // Last 4 digits, full number encrypted
  loanNumber?: string;
  principalAmount: Money;
  currentBalance: Money;
  interestRate: number;
  tenure: number; // months
  emi: Money;
  nextPaymentDate: Date;
  startDate: Date;
  endDate: Date;
  prepaymentCharges?: number;
  collateral?: string;
  guarantor?: {
    name: string;
    relationship: string;
    contact: string;
  };
  isActive: boolean;
  // Enhanced security & audit
  encryptedData: EncryptedStorageMetadata;
  auditTrail: AuditTrail;
  linkedTransactions: TransactionLink[];
}

// Enhanced CreditCard interface
export interface CreditCard {
  id: string;
  bank: string;
  cardNumber: string; // Last 4 digits, full number encrypted
  cardType: 'visa' | 'mastercard' | 'amex' | 'rupay' | 'diners';
  cardName: string;
  creditLimit: Money;
  currentBalance: Money;
  availableCredit: Money;
  minimumPayment: Money;
  paymentDueDate: Date;
  statementDate: Date;
  interestRate: number;
  annualFee?: Money;
  rewardProgram?: {
    type: 'cashback' | 'points' | 'miles';
    rate: number;
    currentBalance: number;
  };
  isActive: boolean;
  // Enhanced security & audit
  encryptedData: EncryptedStorageMetadata;
  auditTrail: AuditTrail;
  linkedTransactions: TransactionLink[];
}

// Receivable interface (NEW)
export interface Receivable {
  id: string;
  type: 'invoice' | 'loan_given' | 'advance' | 'deposit' | 'other';
  partyName: string;
  partyContact?: {
    phone: string;
    email: string;
    address: string;
  };
  amount: Money;
  description: string;
  dueDate: Date;
  reminderDates: Date[];
  status: 'pending' | 'partial' | 'completed' | 'overdue' | 'written_off';
  documents: string[]; // Agreement, promissory note, etc.
  interestRate?: number;
  // Enhanced security & audit
  encryptedData: EncryptedStorageMetadata;
  auditTrail: AuditTrail;
  linkedTransactions: TransactionLink[];
}

// Enhanced Transaction interface
export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  subCategory?: string;
  description: string;
  amount: Money;
  fromAccount?: string; // Account ID
  toAccount?: string; // Account ID
  date: Date;
  location?: string;
  merchant?: string;
  tags?: string[];
  attachments?: string[]; // File URLs
  source: 'manual' | 'sms' | 'email' | 'receipt' | 'statement' | 'api';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  recurringInfo?: {
    isRecurring: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    nextDate?: Date;
    endDate?: Date;
  };
  // Enhanced security & audit
  encryptedData: EncryptedStorageMetadata;
  auditTrail: AuditTrail;
  linkedTransactions: TransactionLink[];
}

// UserSettings interface (NEW)
export interface UserSettings {
  id: string;
  userId: string;
  preferences: {
    defaultCurrency: Currency['code'];
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    numberFormat: 'indian' | 'international';
    language: 'en' | 'hi' | 'ta' | 'te';
    theme: 'light' | 'dark' | 'auto';
  };
  security: {
    biometricEnabled: boolean;
    pinEnabled: boolean;
    autoLockTimeout: number; // minutes
    encryptionEnabled: boolean;
  };
  notifications: {
    paymentReminders: boolean;
    budgetAlerts: boolean;
    investmentUpdates: boolean;
    securityAlerts: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
  backup: {
    cloudBackupEnabled: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    lastBackupDate?: Date;
  };
  // Enhanced security & audit
  encryptedData: EncryptedStorageMetadata;
  auditTrail: AuditTrail;
}

// Additional supporting interfaces
export interface CashEntry {
  id: string;
  description: string;
  amount: Money;
  location?: string;
  // Enhanced security & audit
  encryptedData: EncryptedStorageMetadata;
  auditTrail: AuditTrail;
  linkedTransactions: TransactionLink[];
}

export interface NetWorthSummary {
  totalAssets: Money;
  totalLiabilities: Money;
  netWorth: Money;
  liquidCash: Money;
  accountsBalance: Money;
  cryptoValue: Money;
  investmentsValue: Money;
  realEstateValue: Money;
  receivablesValue: Money;
  totalDebt: Money;
  shortTermDebt: Money;
  longTermDebt: Money;
  asOfDate: Date;
  // Historical tracking
  previousPeriod?: NetWorthSummary;
  changePercent?: number;
}

export interface CashflowData {
  period: 'week' | 'month' | 'quarter' | 'year';
  income: Money[];
  expenses: Money[];
  netFlow: Money[];
  labels: string[];
  categories: {
    [category: string]: Money;
  };
}

export interface FinancialGoal {
  id: string;
  title: string;
  description: string;
  targetAmount: Money;
  currentAmount: Money;
  targetDate: Date;
  priority: 'low' | 'medium' | 'high';
  category: string;
  isAchieved: boolean;
  milestones: {
    percentage: number;
    amount: Money;
    achievedDate?: Date;
  }[];
  // Enhanced security & audit
  encryptedData: EncryptedStorageMetadata;
  auditTrail: AuditTrail;
}

// Additional interfaces for PDF Statement Parser
// Add these to the end of your existing src/types/finance.ts file

// Document processing types
export interface DocumentParsingOptions {
  format: 'pdf' | 'excel' | 'csv';
  bankName?: string;
  accountType?: 'savings' | 'current' | 'credit';
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  ocrEnabled?: boolean;
}

export interface ParsedTransaction {
  rawDate: string;
  parsedDate: Date;
  description: string;
  debitAmount?: number;
  creditAmount?: number;
  balance: number;
  referenceNumber?: string;
  category?: string;
  rawText: string; // Original text from document
}

export interface DocumentParsingResult {
  success: boolean;
  transactions: ParsedTransaction[];
  metadata: {
    fileName: string;
    fileSize: number;
    bankDetected?: string;
    accountNumber?: string;
    statementPeriod?: {
      startDate: Date;
      endDate: Date;
    };
    totalTransactions: number;
  };
  errors: ParseError[];
  warnings: string[];
}

export interface ParseError {
  line?: number;
  column?: number;
  message: string;
  severity: 'low' | 'medium' | 'high';
  rawData?: string;
}

export interface BankStatementFormat {
  bankName: string;
  patterns: {
    header: RegExp[];
    transaction: RegExp[];
    dateFormat: string;
    amountFormat: RegExp;
    balanceFormat: RegExp;
  };
  columns: {
    date: number;
    description: number;
    debit?: number;
    credit?: number;
    balance: number;
  };
  skipLines: number;
  identifier: RegExp;
}

export interface ProcessingProgress {
  stage: 'uploading' | 'parsing' | 'extracting' | 'formatting' | 'complete' | 'error';
  progress: number; // 0-100
  currentStep: string;
  totalSteps: number;
  currentStepIndex: number;
  estimatedTimeRemaining?: number; // seconds
}

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBoxes?: {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
  }[];
}

// Service interfaces
export interface IStatementParserService {
  parseDocument(fileUri: string, options: DocumentParsingOptions): Promise<DocumentParsingResult>;
  detectBankFormat(content: string): Promise<BankStatementFormat | null>;
  performOCR(imageUri: string): Promise<OCRResult>;
  validateTransactions(transactions: ParsedTransaction[]): Promise<ParsedTransaction[]>;
}

export interface IFileProcessorService {
  readPDF(fileUri: string): Promise<string>;
  readExcel(fileUri: string): Promise<any[]>;
  readCSV(fileUri: string): Promise<any[]>;
  getFileInfo(fileUri: string): Promise<{ size: number; type: string; name: string }>;
}

// Supported Indian banks configuration
export interface SupportedBank {
  id: string;
  name: string;
  shortName: string;
  formats: BankStatementFormat[];
  commonPatterns: {
    accountNumber: RegExp;
    ifscCode: RegExp;
    transactionId: RegExp;
  };
}

// Parsing configuration
export interface ParsingConfig {
  supportedFormats: ('pdf' | 'csv' | 'xls' | 'xlsx')[];
  maxFileSize: number; // bytes
  maxTransactionsPerFile: number;
  ocrSettings: {
    enabled: boolean;
    language: 'en' | 'hi';
    confidence: number;
  };
  privacy: {
    encryptProcessedData: boolean;
    deleteOriginalAfterProcessing: boolean;
    localProcessingOnly: boolean;
  };
}
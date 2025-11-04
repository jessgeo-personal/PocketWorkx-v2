// src/types/transactions.ts

/**
 * Unified transaction record structure supporting all asset types
 * Fields marked as optional are for asset-specific use (bank, loan, credit card)
 */
export interface TransactionRecord {
  // Core transaction fields (all assets)
  id: string;
  datetime: Date;
  amount: {
    amount: number;
    currency: 'INR';
  };
  description: string;
  notes?: string;

  // Cash-specific fields
  cashCategory?: string; // 'Wallet', 'Home Safe', 'Loose change car', 'Loose change home'
  expenseCategory?: string; // 'Food', 'Grocery', 'Shopping', etc.

  // Canonical type for this row
  type:
    | 'ADD_CASH'
    | 'RECORD_EXPENSE'
    | 'MOVE_CASH'
    | 'DEPOSIT_TO_BANK'
    | 'ACCOUNT'
    | 'LOAN'
    | 'CREDIT_CARD'
    | 'ACCT_OPENING_BAL'
    | 'EMI_PAYMENT'
    | 'CHARGE'
    | 'PAYMENT';

  // Bank account-specific fields (optional)
  bankName?: string;            // made optional to allow non-account rows
  merchant?: string;
  balance?: number;             // Balance after transaction
  referenceNumber?: string;

  // Loan-specific fields (optional)
  paymentType?: 'principal' | 'interest' | 'emi'; // Type of loan payment
  remainingBalance?: number; // Loan balance after payment

  // Credit card-specific fields (optional)
  cardEnding?: string;        // Last 4 digits like "1234"
  merchantCategory?: string;  // MCC category
  availableCredit?: number;   // Remaining credit after transaction

  // Metadata
  assetType: 'cash' | 'account' | 'loan' | 'creditcard';
  assetId: string;     // ID of the cash category, bank account, loan, or card
  assetLabel: string;  // Display name (e.g., 'Wallet', 'HDFC Savings', 'Home Loan')
}

/**
 * Filter criteria for transaction queries
 * Supports filtering by asset type, category, and future date range
 */
export interface FilterCriteria {
  assetType: 'cash' | 'account' | 'loan' | 'creditcard' | 'investment' | 'crypto';
  filterType: 'all' | 'category'; // 'all' = all transactions, 'category' = specific category/account
  assetId?: string; // Specific category/account ID (required if filterType === 'category')
  assetLabel: string; // Display label for header ('All Liquid Cash', 'Wallet', 'HDFC Savings', etc.)
  // Future fields for date range filtering
  startDate?: Date;
  endDate?: Date;
}

/**
 * Dynamic field definition for asset-specific columns in transaction table
 * Allows different assets to display custom data
 */
export interface AssetSpecificField {
  label: string; // Column header
  key: keyof TransactionRecord; // Property to display
  formatter?: (value: any) => string; // Optional formatter function
}

/**
 * CSV export configuration
 */
export interface CSVExportConfig {
  filterCriteria: FilterCriteria;
  transactions: TransactionRecord[];
  downloadDate: Date;
}

/**
 * Transaction modal navigation parameters
 * Passed to modal when opening from any screen
 */
export interface TransactionModalParams {
  filterCriteria: FilterCriteria;
  assetSpecificFields?: AssetSpecificField[];
  onDismiss?: () => void;
}

// Account-specific transaction type
export interface AccountTransaction {
  id: string;
  datetime: Date;
  amount: { amount: number; currency: string };
  description: string;
  type: | 'opening_balance' // legacy alias
        | 'ACCT_OPENING_BAL' // new canonical opening balance type
        | 'deposit'
        | 'withdrawal'
        | 'transfer_in'
        | 'transfer_out'
        | 'fee'
        | 'interest'
        | 'adjustment'
        | 'balance_correction';
  notes?: string;
  // Optional metadata for account transactions
  transactionId?: string; // Bank's transaction reference
  category?: string; // expense/income category
  balance?: number; // Running balance after transaction
  isReconciled?: boolean; // Whether transaction matches bank statement
  source: 'manual' | 'sms' | 'statement' | 'api';
  status: 'pending' | 'completed' | 'failed';
}

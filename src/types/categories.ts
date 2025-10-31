// src/types/categories.ts

// Cash Categories (existing)
export enum CashCategoryType {
  WALLET = 'Wallet',
  HOME_SAFE = 'Home Safe',
  LOOSE_CHANGE_CAR = 'Loose change (car)',
  LOOSE_CHANGE_HOME = 'Loose Change (home)',
}

// Expense Categories (from guidelines)
export enum ExpenseCategoryType {
  // Food & Dining
  FOOD = 'Food',
  GROCERY = 'Grocery',
  DINING_OUT = 'Dining Out',
  
  // Home & Living
  HOME_EXPENSES = 'Home expenses',
  UTILITIES = 'Utilities',
  RENT_MORTGAGE = 'Rent/Mortgage',
  HOME_MAINTENANCE = 'Home Maintenance',
  
  // Transportation
  FUEL = 'Fuel',
  CAR_EXPENDITURE = 'Car expenditure',
  PUBLIC_TRANSPORT = 'Public Transport',
  PARKING = 'Parking',
  
  // Personal & Shopping
  SHOPPING = 'Shopping',
  CLOTHING = 'Clothing',
  HEALTH_MEDICAL = 'Health/Medical',
  PERSONAL_CARE = 'Personal Care',
  
  // Technology & Communication  
  PHONE_INTERNET = 'Phone & Internet',
  SUBSCRIPTIONS = 'Subscriptions',
  SOFTWARE = 'Software',
  
  // Financial & Investments
  INVESTMENTS = 'Investments',
  INSURANCE = 'Insurance',
  BANK_FEES = 'Bank Fees',
  
  // Luxury & Entertainment
  JEWELERY = 'Jewelery',
  ENTERTAINMENT = 'Entertainment',
  TRAVEL = 'Travel',
  
  // Other
  OTHER = 'Other',
  BILLS = 'Bills',
}

// Income Categories (from guidelines)
export enum IncomeCategoryType {
  SALARY = 'Salary',
  FREELANCE = 'Freelance',
  BUSINESS = 'Business Income',
  INVESTMENT_RETURNS = 'Investment Returns',
  RENTAL_INCOME = 'Rental Income',
  INTEREST = 'Interest',
  DIVIDENDS = 'Dividends',
  GIFTS = 'Gifts',
  REFUNDS = 'Refunds',
  OTHER = 'Other Income',
}

// Debit/Bank Transaction Categories
export enum DebitCategoryType {
  GROCERY = 'grocery',
  FUEL = 'fuel', 
  FOOD = 'food',
  BILLS = 'bills',
  SHOPPING = 'shopping',
  TRAVEL = 'travel',
  MEDICAL = 'medical',
  ENTERTAINMENT = 'entertainment',
  OTHER = 'other',
}

// Helper functions
export const getcashCategoryOptions = (): string[] => {
  return Object.values(CashCategoryType);
};

export const getExpenseCategoryOptions = (): string[] => {
  return Object.values(ExpenseCategoryType);
};

export const getIncomeCategoryOptions = (): string[] => {
  return Object.values(IncomeCategoryType);
};

export const getDebitCategoryOptions = (): string[] => {
  return Object.values(DebitCategoryType);
};

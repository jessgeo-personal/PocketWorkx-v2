// PocketWorkx Theme System - Exact Mockup Colors & Typography
import { Platform } from 'react-native';

type RNFontWeight =
  | 'normal'
  | 'bold'
  | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export const Colors = {
  // Primary Brand Colors (from mockup)
  primary: '#F7D94C', // Golden yellow background
  primaryDark: '#E6C43B',
  accent: '#8B5CF6', // Purple action buttons
  accentDark: '#7C3AED',
  accentLight: '#A78BFA',
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  grey: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Text Colors
  text: {
    primary: '#545454', // grey-900
    secondary: '#6B7280', // grey-500
    tertiary: '#9CA3AF', // grey-400
    light: '#FFFFFF',
    inverse: '#FFFFFF',
  },
  
  // Background Colors
  background: {
    primary: '#ffd21f', // Main golden background
    secondary: '#FFFFFF',
    tertiary: '#F9FAFB',
    card: '#FFFFFF',
    modal: 'rgba(0, 0, 0, 0.5)',
    overlay: 'rgba(0, 0, 0, 0.3)',
  },
  
  // Status Colors
  success: {
    light: '#D1FAE5',
    main: '#10B981',
    dark: '#047857',
  },
  error: {
    light: '#FEE2E2',
    main: '#EF4444',
    dark: '#DC2626',
  },
  warning: {
    light: '#FEF3C7',
    main: '#F59E0B',
    dark: '#D97706',
  },
  info: {
    light: '#DBEAFE',
    main: '#3B82F6',
    dark: '#1D4ED8',
  },
  
  // Financial Colors
  finance: {
    positive: '#10B981', // Green for gains
    negative: '#EF4444', // Red for losses
    neutral: '#6B7280', // Grey for neutral
    cash: '#F59E0B', // Amber for cash
    investment: '#8B5CF6', // Purple for investments
    liability: '#EF4444', // Red for liabilities
  },
  
  // Border Colors
  border: {
    light: '#F3F4F6',
    main: '#E5E7EB',
    dark: '#D1D5DB',
  },
};

// Typography system matching Inter font
export const Typography = {
  fontFamily: {
    regular: Platform.select({
      ios: 'Inter_400Regular',
      android: 'Inter_400Regular',
      web: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    }),
    medium: Platform.select({
      ios: 'Inter_500Medium',
      android: 'Inter_500Medium',
      web: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    }),
    semiBold: Platform.select({
      ios: 'Inter_600SemiBold',
      android: 'Inter_600SemiBold',
      web: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    }),
    bold: Platform.select({
      ios: 'Inter_700Bold',
      android: 'Inter_700Bold',
      web: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    }),
  },
  
  // Font sizes (mockup-based)
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Line heights
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 32,
    '2xl': 36,
    '3xl': 40,
    '4xl': 48,
    '5xl': 56,
  },
  
  // Font weights
  fontWeight: {
    normal: 'normal' as RNFontWeight,   // RN literal
    medium: 500 as RNFontWeight,        // numeric literal (Inter_500)
    semibold: 600 as RNFontWeight,      // numeric literal (Inter_600)
    bold: 'bold' as RNFontWeight,       // RN literal
  } as const,
} as const;

// Spacing system (16px base grid)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16, // Base spacing from mockup
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
  '5xl': 80,
};

// Border radius
export const BorderRadius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

// Shadows (elevation 3-6dp as approved)
export const Shadows = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
};

// Animation durations
export const Animation = {
  fast: 150,
  base: 250,
  slow: 350,
  slower: 500,
};

// Layout dimensions
export const Layout = {
  // Screen margins
  screenMargin: Spacing.base,
  
  // Card padding
  cardPadding: Spacing.base,
  
  // Button heights
  buttonHeight: {
    sm: 36,
    md: 44,
    lg: 52,
  },
  
  // Input heights
  inputHeight: {
    sm: 36,
    md: 44,
    lg: 52,
  },
  
  // Bottom menu
  bottomMenu: {
    buttonHeight: 56,
    slideHeight: '80%', // 80% screen height as confirmed
  },
};

// Complete theme object
export const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  animation: Animation,
  layout: Layout,
};

// Add this at the very end of the existing theme.ts file
// Legacy compatibility export (CRITICAL FIX)
export const colors = {
  primary: Colors.accent,        // Purple buttons
  secondary: Colors.accent,      
  background: Colors.background.primary, // Golden yellow
  surface: Colors.grey[100],
  textPrimary: Colors.text.primary,
  textSecondary: Colors.text.secondary,
  error: Colors.error.main,
  success: Colors.success.main,
  warning: Colors.warning.main,
};

export default Theme;

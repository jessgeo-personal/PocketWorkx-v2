# PocketWorkx-v2

## Personal Wealth Management App - React Native + Expo + TypeScript

A comprehensive financial management mobile app supporting 6 asset classes with encrypted local storage and multi-device sync.

### Environment Structure

- **main**: Production environment (App Store/Google Play releases)
- **staging**: Pre-production testing environment
- **development**: Active development branch

### Key Features (MVP - Non-Crypto)

- **Visual Design**: Golden background (#F7D94C), purple accent (#8B5CF6)
- **Navigation**: Persistent grey bottom menu with 80% sliding menu
- **Asset Classes**: Bank Accounts, Loans, Credit Cards, Investments, Receivables, Cash
- **Data Input**: Manual entry, SMS parsing, receipt photos
- **Security**: AES-256-GCM encryption, local storage only
- **Sync**: Google Drive encrypted backup
- **Currency**: Top 50 currencies with native symbols (₹, $, €, £, ¥, etc.)

### Technology Stack

- **Framework**: React Native + Expo
- **Language**: TypeScript (strict mode)
- **Navigation**: @react-navigation/native + bottom-tabs
- **Storage**: Encrypted local files (expo-secure-store)
- **Fonts**: Inter via expo-font
- **Icons**: Feather (@expo/vector-icons)

### Bundle Configuration

- **App Name**: PocketWorkx
- **Package ID**: com.pocketworkx.app
- **Orientation**: Portrait
- **Platforms**: iOS + Android

### Getting Started

```bash
npm install
npm start
```

Select platform:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web browser

### Branch Workflow

1. **Development**: Feature development and testing
2. **Staging**: Integration testing and QA
3. **Main**: Production releases

### Privacy & Security

- All processing: Local device only
- No external databases or APIs
- User-controlled Google Drive backup
- Multi-device sync via QR pairing

---

**Created**: October 26, 2025  
**Version**: 1.0.0 MVP (Non-Crypto)

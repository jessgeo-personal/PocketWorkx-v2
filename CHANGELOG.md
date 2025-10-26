# PocketWorkx MVP Changelog

## [1.0.0] - 2025-10-26 - MVP (Non-Crypto) Release

### Added
- **Visual Design**: Golden background (#F7D94C), purple accent buttons (#8B5CF6), exact mockup adherence
- **Typography**: Inter font integration via expo-font for cross-platform consistency
- **Icons**: Feather icons (@expo/vector-icons/Feather) for clean UI
- **Navigation**: Persistent grey bottom menu button with 80% screen sliding menu + scroll indicator
- **Currency Support**: Top 50 currencies with native symbols (₹, $, €, £, ¥, etc.)
- **Coming Soon Modal**: All crypto/NFT/token features show "Coming Soon" popup
- **Manual Entry**: Forms for Cash, Bank Accounts, Loans, Credit Cards, Investments, Receivables
- **SMS Processing**: Local regex parsing for HDFC, ICICI, SBI, Axis, Kotak banks
- **Receipt Photos**: Capture and store in unencrypted local folder
- **Google Drive Sync**: Full OAuth integration with backup button
- **Encrypted Storage**: AES-256-GCM for all financial data
- **OS Back Button**: Support for secondary screens (add/edit/details)

### Technical Stack
- React Native + Expo + TypeScript (strict mode)
- @react-navigation/native + bottom-tabs
- expo-font, expo-secure-store, expo-file-system
- Feather icons, Inter typography
- Local encrypted files (no external databases)

### Screens Implemented
- Home Dashboard (liquid cash, net worth, liabilities, investments widgets)
- Cash Management
- Bank Accounts
- Loans & Credit Cards
- Investments & Receivables
- Dashboard Analytics
- Liquidity, Liabilities, Cashflow projections
- Settings with Google Drive backup

### Security & Privacy
- All processing local device only
- AES-256-GCM encryption with PBKDF2 + SHA-256
- No external databases
- User-controlled Google Drive encrypted backup
- Multi-device sync capability

### Bundle Configuration
- Package ID: com.pocketworkx.app
- App Name: PocketWorkx
- Orientation: Portrait
- Support: iOS + Android

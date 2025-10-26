# PocketWorkx-v2 Environment Configuration

## Environment Structure

### 1. **main** (Production)
- **Purpose**: Production releases for App Store and Google Play
- **Protection**: Protected branch, requires PR reviews
- **Deployment**: Automated builds for app stores
- **Bundle ID**: `com.pocketworkx.app`
- **App Name**: `PocketWorkx`
- **Environment**: `production`

### 2. **staging** (Pre-Production)
- **Purpose**: Integration testing, QA validation, UAT
- **Protection**: Semi-protected, requires PR from development
- **Deployment**: TestFlight (iOS) and Internal Testing (Android)
- **Bundle ID**: `com.pocketworkx.app.staging`
- **App Name**: `PocketWorkx Staging`
- **Environment**: `staging`

### 3. **development** (Development)
- **Purpose**: Active feature development, testing, debugging
- **Protection**: Open for direct commits and PRs
- **Deployment**: Expo Development Client, simulators
- **Bundle ID**: `com.pocketworkx.app.dev`
- **App Name**: `PocketWorkx Dev`
- **Environment**: `development`

## Branch Workflow

```
development → staging → main
```

### Development Workflow:
1. **Feature Development**: Work directly on `development` or create feature branches
2. **Testing**: Test features in development environment
3. **Staging Deploy**: Create PR from `development` to `staging`
4. **QA Testing**: Validate features in staging environment
5. **Production Deploy**: Create PR from `staging` to `main`
6. **Release**: Deploy to app stores from `main`

## Environment Variables

Each environment uses different configuration:

### Development
```bash
EXPO_PUBLIC_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_APP_NAME=PocketWorkx Dev
EXPO_PUBLIC_BUNDLE_ID=com.pocketworkx.app.dev
EXPO_PUBLIC_ENABLE_DEBUG=true
EXPO_PUBLIC_GOOGLE_DRIVE_SCOPE=test
```

### Staging
```bash
EXPO_PUBLIC_ENV=staging
EXPO_PUBLIC_API_URL=https://staging-api.pocketworkx.com
EXPO_PUBLIC_APP_NAME=PocketWorkx Staging
EXPO_PUBLIC_BUNDLE_ID=com.pocketworkx.app.staging
EXPO_PUBLIC_ENABLE_DEBUG=true
EXPO_PUBLIC_GOOGLE_DRIVE_SCOPE=staging
```

### Production
```bash
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_URL=https://api.pocketworkx.com
EXPO_PUBLIC_APP_NAME=PocketWorkx
EXPO_PUBLIC_BUNDLE_ID=com.pocketworkx.app
EXPO_PUBLIC_ENABLE_DEBUG=false
EXPO_PUBLIC_GOOGLE_DRIVE_SCOPE=production
```

## Expo Configuration per Environment

Each environment has its own `app.config.js` settings:

- **Development**: `expo://` scheme, development client
- **Staging**: Internal distribution, TestFlight/Internal Testing
- **Production**: App Store/Google Play release builds

## Database & Storage

- **All Environments**: Local encrypted storage only
- **Development**: Mock data, test encryption keys
- **Staging**: Limited real data, staging encryption keys
- **Production**: Full encryption, user-controlled Google Drive backup

## Testing Strategy

### Development
- Unit tests
- Component testing
- Local integration testing
- Expo Development Client testing

### Staging
- End-to-end testing
- User acceptance testing
- Performance testing
- Security testing
- TestFlight beta testing

### Production
- Production monitoring
- Crash reporting
- Analytics
- User feedback collection

## Deployment Pipeline

1. **Development**: 
   - Push to development branch
   - Expo Development Client auto-updates

2. **Staging**:
   - PR from development → staging
   - Automated build to TestFlight/Internal Testing
   - QA validation

3. **Production**:
   - PR from staging → main
   - Manual approval required
   - Automated build to App Store/Google Play
   - Release notes and version tagging

## Security Considerations

- **Development**: Test keys, mock sensitive data
- **Staging**: Staging keys, limited real data
- **Production**: Full encryption, production keys, no debug logs

## Branch Protection Rules

### main (Production)
- Require pull request reviews (2 reviewers)
- Require status checks to pass
- Require up-to-date branches
- Include administrators in restrictions

### staging (Pre-Production)  
- Require pull request reviews (1 reviewer)
- Require status checks to pass
- Allow administrators to bypass

### development (Development)
- No protection rules
- Direct commits allowed
- Feature branches encouraged but not required

---

**Last Updated**: October 26, 2025
**Version**: 1.0.0

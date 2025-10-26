const IS_DEV = process.env.EXPO_PUBLIC_ENV === 'development';
const IS_STAGING = process.env.EXPO_PUBLIC_ENV === 'staging';
const IS_PRODUCTION = process.env.EXPO_PUBLIC_ENV === 'production';

// Environment-specific configuration
const getEnvironmentConfig = () => {
  if (IS_PRODUCTION) {
    return {
      name: 'PocketWorkx',
      slug: 'pocketworkx',
      bundleIdentifier: 'com.pocketworkx.app',
      package: 'com.pocketworkx.app',
      backgroundColor: '#F7D94C',
      scheme: 'pocketworkx',
    };
  }
  
  if (IS_STAGING) {
    return {
      name: 'PocketWorkx Staging',
      slug: 'pocketworkx-staging',
      bundleIdentifier: 'com.pocketworkx.app.staging',
      package: 'com.pocketworkx.app.staging',
      backgroundColor: '#FFA726', // Orange for staging
      scheme: 'pocketworkx-staging',
    };
  }
  
  // Development
  return {
    name: 'PocketWorkx Dev',
    slug: 'pocketworkx-dev',
    bundleIdentifier: 'com.pocketworkx.app.dev',
    package: 'com.pocketworkx.app.dev',
    backgroundColor: '#E53E3E', // Red for development
    scheme: 'pocketworkx-dev',
  };
};

const envConfig = getEnvironmentConfig();

export default {
  expo: {
    name: envConfig.name,
    slug: envConfig.slug,
    version: process.env.EXPO_PUBLIC_VERSION || '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    scheme: envConfig.scheme,
    
    assetBundlePatterns: [
      'src/assets/*',
      'assets/fonts/*'
    ],
    
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: envConfig.backgroundColor,
    },
    
    ios: {
      supportsTablet: true,
      bundleIdentifier: envConfig.bundleIdentifier,
      buildNumber: IS_PRODUCTION ? '1' : '1',
    },
    
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: envConfig.backgroundColor,
      },
      package: envConfig.package,
      versionCode: IS_PRODUCTION ? 1 : 1,
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    
    web: {
      favicon: './assets/favicon.png',
    },
    
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-font',
      'expo-camera',
      'expo-image-picker',
      'expo-auth-session',
      'expo-web-browser',
      [
        'expo-build-properties',
        {
          android: {
            enableProguardInReleaseBuilds: IS_PRODUCTION,
            enableShrinkResourcesInReleaseBuilds: IS_PRODUCTION,
          },
          ios: {
            flipper: !IS_PRODUCTION,
          },
        },
      ],
    ],
    
    extra: {
      environment: process.env.EXPO_PUBLIC_ENV || 'development',
      enableDebug: process.env.EXPO_PUBLIC_ENABLE_DEBUG === 'true',
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      enableCrypto: process.env.EXPO_PUBLIC_ENABLE_CRYPTO === 'true',
      enableAnalytics: process.env.EXPO_PUBLIC_ENABLE_ADVANCED_ANALYTICS === 'true',
    },
    
    updates: {
      url: `https://u.expo.dev/${process.env.EXPO_PROJECT_ID}`,
      enabled: !IS_DEV,
    },
    
    runtimeVersion: {
      policy: 'sdkVersion',
    },
  },
};

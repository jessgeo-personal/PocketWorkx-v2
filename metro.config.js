// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Add resolver alias for @ → src
defaultConfig.resolver.alias = {
  '@': './src',
};

// Include .ts and .tsx files
defaultConfig.resolver.sourceExts.push('ts', 'tsx');

module.exports = defaultConfig;

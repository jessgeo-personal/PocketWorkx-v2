#!/usr/bin/env node

/**
 * Environment Validation Script
 * 
 * Validates that the current environment configuration is correct
 * and all required variables are set.
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_VARS = [
  'EXPO_PUBLIC_ENV',
  'EXPO_PUBLIC_APP_NAME',
  'EXPO_PUBLIC_BUNDLE_ID',
  'EXPO_PUBLIC_VERSION',
];

const ENVIRONMENT_SPECIFIC_VARS = {
  development: {
    EXPO_PUBLIC_ENABLE_DEBUG: 'true',
    EXPO_PUBLIC_LOG_LEVEL: 'debug',
  },
  staging: {
    EXPO_PUBLIC_ENABLE_DEBUG: 'true',
    EXPO_PUBLIC_LOG_LEVEL: 'info',
  },
  production: {
    EXPO_PUBLIC_ENABLE_DEBUG: 'false',
    EXPO_PUBLIC_LOG_LEVEL: 'error',
  },
};

function log(message, color = '') {
  const RESET = '\x1b[0m';
  console.log(`${color}${message}${RESET}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, '\x1b[32m');
}

function logError(message) {
  log(`✗ ${message}`, '\x1b[31m');
}

function logWarning(message) {
  log(`⚠ ${message}`, '\x1b[33m');
}

function loadEnvironment() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    logError('.env file not found');
    logError('Run: npm run setup:dev (or setup:staging/setup:prod)');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return env;
}

function validateEnvironment() {
  log('\n🔍 Validating environment configuration...\n');
  
  const env = loadEnvironment();
  let hasErrors = false;
  
  // Check required variables
  REQUIRED_VARS.forEach(varName => {
    if (env[varName]) {
      logSuccess(`${varName} = ${env[varName]}`);
    } else {
      logError(`${varName} is missing or empty`);
      hasErrors = true;
    }
  });
  
  // Check environment-specific variables
  const currentEnv = env.EXPO_PUBLIC_ENV;
  if (currentEnv && ENVIRONMENT_SPECIFIC_VARS[currentEnv]) {
    log(`\n🎯 Checking ${currentEnv} environment specifics:`);
    
    Object.entries(ENVIRONMENT_SPECIFIC_VARS[currentEnv]).forEach(([key, expectedValue]) => {
      if (env[key] === expectedValue) {
        logSuccess(`${key} = ${env[key]}`);
      } else {
        logWarning(`${key} = ${env[key]} (expected: ${expectedValue})`);
      }
    });
  }
  
  // Validate bundle ID format
  const bundleId = env.EXPO_PUBLIC_BUNDLE_ID;
  if (bundleId) {
    const expectedPattern = currentEnv === 'production' 
      ? 'com.pocketworkx.app'
      : `com.pocketworkx.app.${currentEnv === 'development' ? 'dev' : currentEnv}`;
      
    if (bundleId === expectedPattern) {
      logSuccess(`Bundle ID format is correct`);
    } else {
      logWarning(`Bundle ID might be incorrect. Expected: ${expectedPattern}`);
    }
  }
  
  // Summary
  if (hasErrors) {
    log('\n❌ Environment validation failed', '\x1b[31m');
    log('Please fix the errors above before proceeding.', '\x1b[31m');
    process.exit(1);
  } else {
    log('\n✅ Environment validation passed', '\x1b[32m');
    log(`Current environment: ${env.EXPO_PUBLIC_ENV}`, '\x1b[36m');
    log(`App name: ${env.EXPO_PUBLIC_APP_NAME}`, '\x1b[36m');
    log(`Bundle ID: ${env.EXPO_PUBLIC_BUNDLE_ID}`, '\x1b[36m');
  }
}

if (require.main === module) {
  validateEnvironment();
}

module.exports = { validateEnvironment };

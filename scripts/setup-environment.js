#!/usr/bin/env node

/**
 * Environment Setup Script for PocketWorkx-v2
 * 
 * This script helps developers quickly switch between environments
 * and ensures the correct configuration is loaded.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ENVIRONMENTS = {
  development: {
    name: 'Development',
    envFile: '.env.development',
    description: 'Local development with debug enabled',
    color: '\x1b[31m', // Red
  },
  staging: {
    name: 'Staging',
    envFile: '.env.staging',
    description: 'Pre-production testing environment',
    color: '\x1b[33m', // Yellow
  },
  production: {
    name: 'Production',
    envFile: '.env.production',
    description: 'Production release environment',
    color: '\x1b[32m', // Green
  },
};

const RESET_COLOR = '\x1b[0m';

function log(message, color = '') {
  console.log(`${color}${message}${RESET_COLOR}`);
}

function logError(message) {
  console.error(`\x1b[31mError: ${message}${RESET_COLOR}`);
}

function logSuccess(message) {
  console.log(`\x1b[32m✓ ${message}${RESET_COLOR}`);
}

function logWarning(message) {
  console.log(`\x1b[33m⚠ ${message}${RESET_COLOR}`);
}

function checkEnvironmentFiles() {
  log('\n🔍 Checking environment files...');
  
  for (const [env, config] of Object.entries(ENVIRONMENTS)) {
    const envPath = path.join(process.cwd(), config.envFile);
    if (fs.existsSync(envPath)) {
      logSuccess(`${config.envFile} found`);
    } else {
      logError(`${config.envFile} not found`);
      return false;
    }
  }
  
  return true;
}

function setupEnvironment(environment) {
  const config = ENVIRONMENTS[environment];
  
  if (!config) {
    logError(`Unknown environment: ${environment}`);
    logError('Available environments: development, staging, production');
    process.exit(1);
  }
  
  log(`\n🚀 Setting up ${config.color}${config.name}${RESET_COLOR} environment...`);
  log(`   ${config.description}`);
  
  // Check if source env file exists
  const sourceEnvPath = path.join(process.cwd(), config.envFile);
  if (!fs.existsSync(sourceEnvPath)) {
    logError(`Environment file ${config.envFile} not found`);
    process.exit(1);
  }
  
  // Copy environment file
  const targetEnvPath = path.join(process.cwd(), '.env');
  try {
    fs.copyFileSync(sourceEnvPath, targetEnvPath);
    logSuccess(`Copied ${config.envFile} to .env`);
  } catch (error) {
    logError(`Failed to copy environment file: ${error.message}`);
    process.exit(1);
  }
  
  // Install dependencies if needed
  try {
    log('\n📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    logSuccess('Dependencies installed');
  } catch (error) {
    logWarning('Failed to install dependencies. Run `npm install` manually.');
  }
  
  // Display current environment info
  log(`\n✨ Environment setup complete!`);
  log(`   Current environment: ${config.color}${config.name}${RESET_COLOR}`);
  log(`   Bundle ID: com.pocketworkx.app${environment !== 'production' ? `.${environment.substring(0, 3)}` : ''}`);
  log(`   App Name: PocketWorkx${environment !== 'production' ? ` ${config.name}` : ''}`);
  
  log(`\n🎯 Next steps:`);
  log(`   • Run: npm run start:${environment.substring(0, 3)}`);
  log(`   • Or: npm start`);
  log(`   • Build: npm run build:${environment.substring(0, 3)}`);
  
  if (environment === 'development') {
    log(`\n🔧 Development tools:`);
    log(`   • Test: npm test`);
    log(`   • Lint: npm run lint`);
    log(`   • Format: npm run format`);
  }
}

function showHelp() {
  log('\n🛠️  PocketWorkx-v2 Environment Setup');
  log('\nUsage: node scripts/setup-environment.js <environment>');
  log('\nAvailable environments:');
  
  for (const [env, config] of Object.entries(ENVIRONMENTS)) {
    log(`  ${config.color}${env.padEnd(12)}${RESET_COLOR} - ${config.description}`);
  }
  
  log('\nExamples:');
  log('  node scripts/setup-environment.js development');
  log('  node scripts/setup-environment.js staging');
  log('  node scripts/setup-environment.js production');
  
  log('\nOr use npm scripts:');
  log('  npm run setup:dev');
  log('  npm run setup:staging');
  log('  npm run setup:prod');
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    return;
  }
  
  const environment = args[0].toLowerCase();
  
  // Check if all environment files exist
  if (!checkEnvironmentFiles()) {
    logError('Please create missing environment files based on .env.example');
    process.exit(1);
  }
  
  setupEnvironment(environment);
}

if (require.main === module) {
  main();
}

module.exports = { setupEnvironment, ENVIRONMENTS };

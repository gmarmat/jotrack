#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync } from 'fs';

/**
 * Test runner script for JoTrack E2E tests
 * Usage: tsx e2e/run-tests.ts [options]
 */

interface TestOptions {
  scenario?: string;
  priority?: 'P0' | 'P1' | 'P2' | 'all';
  browser?: 'chromium' | 'firefox' | 'webkit' | 'all';
  headed?: boolean;
  debug?: boolean;
  report?: boolean;
}

function parseArgs(): TestOptions {
  const args = process.argv.slice(2);
  const options: TestOptions = {
    priority: 'all',
    browser: 'all',
    headed: false,
    debug: false,
    report: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--scenario':
        options.scenario = args[++i];
        break;
      case '--priority':
        options.priority = args[++i] as 'P0' | 'P1' | 'P2' | 'all';
        break;
      case '--browser':
        options.browser = args[++i] as 'chromium' | 'firefox' | 'webkit' | 'all';
        break;
      case '--headed':
        options.headed = true;
        break;
      case '--debug':
        options.debug = true;
        break;
      case '--report':
        options.report = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }
  
  return options;
}

function printHelp() {
  console.log(`
JoTrack E2E Test Runner

Usage: tsx e2e/run-tests.ts [options]

Options:
  --scenario <name>     Run specific scenario (1-8)
  --priority <level>   Run tests by priority (P0, P1, P2, all)
  --browser <name>     Run on specific browser (chromium, firefox, webkit, all)
  --headed             Run in headed mode (visible browser)
  --debug              Run in debug mode
  --report             Show test report after completion
  --help               Show this help message

Examples:
  tsx e2e/run-tests.ts --priority P0 --browser chromium
  tsx e2e/run-tests.ts --scenario 1 --headed --debug
  tsx e2e/run-tests.ts --priority P0 --report
`);
}

function buildPlaywrightCommand(options: TestOptions): string {
  let command = 'npx playwright test';
  
  // Add scenario filter
  if (options.scenario) {
    command += ` --grep "Scenario ${options.scenario}"`;
  }
  
  // Add priority filter
  if (options.priority && options.priority !== 'all') {
    const priorityMap = {
      'P0': 'P0 Critical Tests',
      'P1': 'P1 High Priority Tests', 
      'P2': 'P2 Nice-to-Have Tests'
    };
    command += ` --grep "${priorityMap[options.priority]}"`;
  }
  
  // Add browser filter
  if (options.browser && options.browser !== 'all') {
    command += ` --project ${options.browser}`;
  }
  
  // Add headed mode
  if (options.headed) {
    command += ' --headed';
  }
  
  // Add debug mode
  if (options.debug) {
    command += ' --debug';
  }
  
  return command;
}

function checkPrerequisites(): void {
  console.log('🔍 Checking prerequisites...');
  
  // Check if Playwright is installed
  try {
    execSync('npx playwright --version', { stdio: 'pipe' });
    console.log('✅ Playwright is installed');
  } catch (error) {
    console.log('❌ Playwright not found. Installing...');
    execSync('npm run e2e:install', { stdio: 'inherit' });
  }
  
  // Check if Next.js dev server is running
  try {
    execSync('curl -s http://localhost:3000 > /dev/null', { stdio: 'pipe' });
    console.log('✅ Next.js dev server is running');
  } catch (error) {
    console.log('❌ Next.js dev server not running. Please start it with: npm run dev');
    process.exit(1);
  }
  
  // Check if test files exist
  if (!existsSync('e2e/comprehensive-flow.spec.ts')) {
    console.log('❌ Test files not found. Please ensure e2e directory is set up correctly.');
    process.exit(1);
  }
  
  console.log('✅ All prerequisites met');
}

function runTests(command: string): void {
  console.log(`🚀 Running tests: ${command}`);
  
  try {
    execSync(command, { stdio: 'inherit' });
    console.log('✅ Tests completed successfully');
  } catch (error) {
    console.log('❌ Tests failed');
    process.exit(1);
  }
}

function showReport(): void {
  console.log('📊 Opening test report...');
  
  try {
    execSync('npm run e2e:report', { stdio: 'inherit' });
  } catch (error) {
    console.log('❌ Failed to open test report');
  }
}

function main() {
  console.log('🧪 JoTrack E2E Test Runner');
  console.log('========================\n');
  
  const options = parseArgs();
  
  console.log('Options:', options);
  console.log('');
  
  checkPrerequisites();
  
  const command = buildPlaywrightCommand(options);
  
  runTests(command);
  
  if (options.report) {
    showReport();
  }
}

if (require.main === module) {
  main();
}

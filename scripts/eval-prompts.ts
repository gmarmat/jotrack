#!/usr/bin/env tsx
/**
 * Prompt Evaluation Harness
 * 
 * Loads golden test cases, runs them through the AI analysis API,
 * saves results, and compares against expected outputs.
 * 
 * Usage:
 *   npm run eval:prompts
 *   npm run eval:prompts -- --case=pm_saas_mid
 *   npm run eval:prompts -- --dry-run
 */

import fs from 'fs/promises';
import path from 'path';

const BASE_URL = process.env.EVAL_BASE_URL || 'http://localhost:3000';
const PROMPTS_EVAL_DIR = path.join(process.cwd(), 'prompts_eval');
const CASES_DIR = path.join(PROMPTS_EVAL_DIR, 'cases');
const EXPECTED_DIR = path.join(PROMPTS_EVAL_DIR, 'expected');
const ACTUAL_DIR = path.join(PROMPTS_EVAL_DIR, 'actual');

interface TestCase {
  jobTitle: string;
  company: string;
  jdText: string;
  resumeText: string;
  notesText: string;
}

interface EvalResult {
  case: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
}

async function loadTestCase(caseName: string): Promise<TestCase> {
  const filePath = path.join(CASES_DIR, `${caseName}.json`);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

async function loadExpected(caseName: string, capability: string): Promise<any> {
  const filePath = path.join(EXPECTED_DIR, `${capability}.${caseName}.json`);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`⚠️  No expected output found for ${capability}.${caseName}`);
    return null;
  }
}

async function saveActual(caseName: string, capability: string, result: any): Promise<void> {
  // Ensure actual directory exists
  await fs.mkdir(ACTUAL_DIR, { recursive: true });
  const filePath = path.join(ACTUAL_DIR, `${capability}.${caseName}.json`);
  await fs.writeFile(filePath, JSON.stringify(result, null, 2));
  console.log(`💾 Saved actual output to ${filePath}`);
}

async function runAnalysis(testCase: TestCase, dryRun: boolean): Promise<any> {
  const url = `${BASE_URL}/api/ai/analyze`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      capability: 'fit',
      inputs: {
        jobTitle: testCase.jobTitle,
        company: testCase.company,
        jdText: testCase.jdText,
        resumeText: testCase.resumeText,
        notesText: testCase.notesText,
      },
      dryRun,
      promptVersion: 'v1',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API call failed (${response.status}): ${error}`);
  }

  return await response.json();
}

function compareResults(caseName: string, expected: any, actual: any): EvalResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!expected) {
    warnings.push('No expected output to compare against');
    return { case: caseName, passed: true, errors, warnings };
  }

  // Check overall structure
  if (!actual.result) {
    errors.push('Missing "result" key in response');
    return { case: caseName, passed: false, errors, warnings };
  }

  const result = actual.result;

  // Check fit structure
  if (!result.fit) {
    errors.push('Missing "fit" object');
  } else {
    if (typeof result.fit.overall !== 'number') {
      errors.push('fit.overall must be a number');
    } else if (result.fit.overall < 0 || result.fit.overall > 1) {
      errors.push(`fit.overall out of range: ${result.fit.overall}`);
    }

    if (!Array.isArray(result.fit.breakdown)) {
      errors.push('fit.breakdown must be an array');
    } else if (result.fit.breakdown.length === 0) {
      warnings.push('fit.breakdown is empty');
    } else {
      // Check first breakdown entry structure
      const entry = result.fit.breakdown[0];
      const requiredKeys = ['param', 'weight', 'jdEvidence', 'resumeEvidence', 'score', 'reasoning', 'sources'];
      for (const key of requiredKeys) {
        if (!(key in entry)) {
          errors.push(`fit.breakdown[0] missing key: ${key}`);
        }
      }
    }
  }

  // Check keywords structure
  if (!Array.isArray(result.keywords)) {
    errors.push('keywords must be an array');
  } else if (result.keywords.length === 0) {
    warnings.push('keywords array is empty');
  }

  // Check sources
  if (!Array.isArray(result.sources)) {
    errors.push('sources must be an array');
  } else if (result.sources.length === 0) {
    warnings.push('sources array is empty (expected for dry-run)');
  }

  // Length bounds check
  if (result.fit && result.fit.breakdown) {
    if (result.fit.breakdown.length < 5) {
      warnings.push(`fit.breakdown has only ${result.fit.breakdown.length} entries (expected ~25)`);
    }
    if (result.fit.breakdown.length > 30) {
      warnings.push(`fit.breakdown has ${result.fit.breakdown.length} entries (expected ~25)`);
    }
  }

  // Score reasonableness (compare to expected)
  if (expected.fit && result.fit) {
    const scoreDiff = Math.abs(expected.fit.overall - result.fit.overall);
    if (scoreDiff > 0.15) {
      warnings.push(`Overall score differs significantly: expected ${expected.fit.overall}, got ${result.fit.overall}`);
    }
  }

  return {
    case: caseName,
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

async function evalCase(caseName: string, dryRun: boolean): Promise<EvalResult> {
  console.log(`\n📋 Evaluating case: ${caseName}`);
  
  try {
    // Load test case
    const testCase = await loadTestCase(caseName);
    console.log(`✓ Loaded test case`);

    // Run analysis
    console.log(`🤖 Running ${dryRun ? 'dry-run' : 'remote'} analysis...`);
    const actual = await runAnalysis(testCase, dryRun);
    console.log(`✓ Analysis complete`);

    // Save actual result
    await saveActual(caseName, 'analyze', actual);

    // Load expected
    const expected = await loadExpected(caseName, 'analyze');

    // Compare
    const result = compareResults(caseName, expected, actual);
    
    // Print results
    console.log(`\n${result.passed ? '✅' : '❌'} ${caseName}: ${result.passed ? 'PASSED' : 'FAILED'}`);
    
    if (result.errors.length > 0) {
      console.log('  Errors:');
      result.errors.forEach(err => console.log(`    - ${err}`));
    }
    
    if (result.warnings.length > 0) {
      console.log('  Warnings:');
      result.warnings.forEach(warn => console.log(`    ⚠️  ${warn}`));
    }

    return result;
  } catch (error) {
    console.error(`❌ Error evaluating ${caseName}:`, error);
    return {
      case: caseName,
      passed: false,
      errors: [error instanceof Error ? error.message : String(error)],
      warnings: [],
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || !args.includes('--remote');
  const specificCase = args.find(arg => arg.startsWith('--case='))?.split('=')[1];

  console.log('🧪 Prompt Evaluation Harness');
  console.log(`📡 Base URL: ${BASE_URL}`);
  console.log(`🔧 Mode: ${dryRun ? 'Dry-run (local)' : 'Remote (real LLM)'}`);
  console.log('');

  // Get list of cases
  let caseNames: string[];
  if (specificCase) {
    caseNames = [specificCase];
  } else {
    const files = await fs.readdir(CASES_DIR);
    caseNames = files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  }

  console.log(`📦 Found ${caseNames.length} test case(s): ${caseNames.join(', ')}`);

  // Run evaluations
  const results: EvalResult[] = [];
  for (const caseName of caseNames) {
    const result = await evalCase(caseName, dryRun);
    results.push(result);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  
  if (failed > 0) {
    console.log('\nFailed cases:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.case}`);
      r.errors.forEach(err => console.log(`      ${err}`));
    });
  }

  // Exit code
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});


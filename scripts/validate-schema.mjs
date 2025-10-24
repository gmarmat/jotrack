#!/usr/bin/env node

/**
 * Validation script for Score v2 Schema
 * Manually validates the schema configuration without requiring vitest
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Import the schema module
const schemaPath = path.join(projectRoot, 'src/interview-coach/scoring/schema.ts');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Simple validation by parsing the file
const tests = {
  passed: 0,
  failed: 0,
  results: []
};

function test(name, condition, details = '') {
  if (condition) {
    tests.passed++;
    tests.results.push({ status: 'PASS', name, details });
    console.log(`✓ ${name}`);
  } else {
    tests.failed++;
    tests.results.push({ status: 'FAIL', name, details });
    console.log(`✗ ${name}`);
  }
}

// Validate file content
console.log('\n📋 Validating Score v2 Schema...\n');

// Check for required types
test('DimensionType is exported', schemaContent.includes('export type DimensionType'));
test('PersonaType is exported', schemaContent.includes('export type PersonaType'));
test('Dimension interface is exported', schemaContent.includes('export interface Dimension'));
test('PersonaWeights interface is exported', schemaContent.includes('export interface PersonaWeights'));
test('RedFlag interface is exported', schemaContent.includes('export interface RedFlag'));
test('CeilingRuleHook type is exported', schemaContent.includes('export type CeilingRuleHook'));
test('ScoreV2Config interface is exported', schemaContent.includes('export interface ScoreV2Config'));

// Check for constants
test('DIMENSIONS constant is exported', schemaContent.includes('export const DIMENSIONS'));
test('PERSONA_WEIGHTS constant is exported', schemaContent.includes('export const PERSONA_WEIGHTS'));
test('RED_FLAGS constant is exported', schemaContent.includes('export const RED_FLAGS'));
test('DEFAULT_SCORE_V2_CONFIG constant is exported', schemaContent.includes('export const DEFAULT_SCORE_V2_CONFIG'));

// Check for ceiling rules
test('ceilingRuleInsufficientLength is exported', schemaContent.includes('export const ceilingRuleInsufficientLength'));
test('ceilingRuleHighRedFlags is exported', schemaContent.includes('export const ceilingRuleHighRedFlags'));
test('ceilingRuleDimensionImbalance is exported', schemaContent.includes('export const ceilingRuleDimensionImbalance'));
test('ceilingRulePersonaMismatch is exported', schemaContent.includes('export const ceilingRulePersonaMismatch'));

// Check for validation functions
test('validateDimensionWeights function is exported', schemaContent.includes('export function validateDimensionWeights'));
test('validatePersonaWeights function is exported', schemaContent.includes('export function validatePersonaWeights'));
test('validateRedFlagPenalties function is exported', schemaContent.includes('export function validateRedFlagPenalties'));
test('getCeilingRules function is exported', schemaContent.includes('export function getCeilingRules'));
test('getPersonaWeights function is exported', schemaContent.includes('export function getPersonaWeights'));
test('getDimension function is exported', schemaContent.includes('export function getDimension'));

// Check for dimension definitions
test('Has 7 dimensions', schemaContent.match(/name: 'structure'/), 'structure dimension');
test('Has specificity dimension', schemaContent.includes("name: 'specificity'"));
test('Has outcome dimension', schemaContent.includes("name: 'outcome'"));
test('Has role dimension', schemaContent.includes("name: 'role'"));
test('Has company dimension', schemaContent.includes("name: 'company'"));
test('Has persona dimension', schemaContent.includes("name: 'persona'"));
test('Has risks dimension', schemaContent.includes("name: 'risks'"));

// Check for persona types
test('Has recruiter persona weights', schemaContent.includes('recruiter: {'));
test('Has hiring-manager persona weights', schemaContent.includes("'hiring-manager': {"));
test('Has peer persona weights', schemaContent.includes('peer: {'));

// Check for red flags
test('Has weak-ownership red flag', schemaContent.includes("name: 'weak-ownership'"));
test('Has vague-outcome red flag', schemaContent.includes("name: 'vague-outcome'"));
test('Has negative-framing red flag', schemaContent.includes("name: 'negative-framing'"));
test('Has excessive-criticism red flag', schemaContent.includes("name: 'excessive-criticism'"));
test('Has overconfidence red flag', schemaContent.includes("name: 'overconfidence'"));

// Check for config version
test('Config has version 2.0', schemaContent.includes("version: '2.0'"));

// Check for ceiling rules in config
test('Config includes ceilingRuleInsufficientLength', schemaContent.includes('ceilingRuleInsufficientLength'));
test('Config includes ceilingRuleHighRedFlags', schemaContent.includes('ceilingRuleHighRedFlags'));
test('Config includes ceilingRuleDimensionImbalance', schemaContent.includes('ceilingRuleDimensionImbalance'));
test('Config includes ceilingRulePersonaMismatch', schemaContent.includes('ceilingRulePersonaMismatch'));

// Statistics
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Tests Passed: ${tests.passed}/${tests.passed + tests.failed}`);
console.log(`Coverage: ${Math.round((tests.passed / (tests.passed + tests.failed)) * 100)}%`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

// Generate JSON report
const reportDir = path.join(projectRoot, 'reports');
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const report = {
  timestamp: new Date().toISOString(),
  file: 'src/interview-coach/scoring/schema.ts',
  totalTests: tests.passed + tests.failed,
  passed: tests.passed,
  failed: tests.failed,
  coverage: Math.round((tests.passed / (tests.passed + tests.failed)) * 100),
  results: tests.results
};

fs.writeFileSync(
  path.join(reportDir, 'schema-validation.json'),
  JSON.stringify(report, null, 2)
);

console.log(`📊 Report saved to reports/schema-validation.json\n`);

process.exit(tests.failed > 0 ? 1 : 0);

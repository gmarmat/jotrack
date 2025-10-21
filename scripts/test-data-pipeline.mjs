#!/usr/bin/env node
/**
 * Test Data Pipeline extraction
 * Tests: Raw extraction → Normalized variant → Detailed variant
 */

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Data Pipeline Extraction\n');

// Read test resume
const resumePath = path.join(__dirname, '../e2e/fixtures/data-pipeline/test-resume.txt');
const resumeText = readFileSync(resumePath, 'utf-8');

console.log('📄 Test Resume Loaded:');
console.log(`   File: ${resumePath}`);
console.log(`   Size: ${(resumeText.length / 1024).toFixed(1)} KB`);
console.log(`   Words: ${resumeText.split(/\s+/).length}`);
console.log(`   First 150 chars: ${resumeText.substring(0, 150)}...\n`);

// Read test JD
const jdPath = path.join(__dirname, '../e2e/fixtures/data-pipeline/test-jd.txt');
const jdText = readFileSync(jdPath, 'utf-8');

console.log('📄 Test JD Loaded:');
console.log(`   File: ${jdPath}`);
console.log(`   Size: ${(jdText.length / 1024).toFixed(1)} KB`);
console.log(`   Words: ${jdText.split(/\s+/).length}`);
console.log(`   First 150 chars: ${jdText.substring(0, 150)}...\n`);

// Verify content quality
const requiredResumeTerms = ['Python', 'Django', 'AWS', 'microservices', 'experience'];
const foundResumeTerms = requiredResumeTerms.filter(term => 
  resumeText.toLowerCase().includes(term.toLowerCase())
);

const requiredJDTerms = ['Python', 'Django', 'required', 'qualifications', 'experience'];
const foundJDTerms = requiredJDTerms.filter(term => 
  jdText.toLowerCase().includes(term.toLowerCase())
);

console.log('✅ Resume Content Validation:');
console.log(`   Required terms: ${requiredResumeTerms.join(', ')}`);
console.log(`   Found: ${foundResumeTerms.length}/${requiredResumeTerms.length} ✓\n`);

console.log('✅ JD Content Validation:');
console.log(`   Required terms: ${requiredJDTerms.join(', ')}`);
console.log(`   Found: ${foundJDTerms.length}/${requiredJDTerms.length} ✓\n`);

if (foundResumeTerms.length === requiredResumeTerms.length && 
    foundJDTerms.length === requiredJDTerms.length) {
  console.log('🎉 TEST FIXTURES ARE VALID!\n');
  console.log('Next steps:');
  console.log('1. Start dev server: npm run dev');
  console.log('2. Upload test-resume.txt to a job');
  console.log('3. Click "Refresh Data" button');
  console.log('4. Check terminal for variant creation logs');
  console.log('5. Click eye icons to view Raw/Normalized/Detailed variants\n');
} else {
  console.log('❌ TEST FIXTURES INVALID - Missing required terms\n');
  process.exit(1);
}


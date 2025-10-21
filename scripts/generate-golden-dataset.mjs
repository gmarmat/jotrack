#!/usr/bin/env node
/**
 * Generate Golden Dataset for Testing
 * Runs REAL AI extraction once, saves outputs for reuse
 * Cost: ~$0.04 one-time investment
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🏆 Generating Golden Dataset for E2E Tests\n');
console.log('⚠️  This will make REAL AI API calls');
console.log('💰 Estimated cost: ~$0.04');
console.log('🎯 Purpose: Generate once, reuse forever\n');

// Check if we should proceed
const proceed = process.argv.includes('--confirm');
if (!proceed) {
  console.log('To proceed, run: node scripts/generate-golden-dataset.mjs --confirm\n');
  console.log('This will:');
  console.log('1. Read test-resume.txt and test-jd.txt');
  console.log('2. Call OpenAI API to create AI-optimized variants');
  console.log('3. Save outputs to e2e/fixtures/golden-dataset/');
  console.log('4. Verify quality (fact extraction)');
  console.log('5. Create metadata.json with costs\n');
  process.exit(0);
}

console.log('✅ Proceeding with golden dataset generation...\n');

// Setup paths
const fixturesDir = path.join(__dirname, '../e2e/fixtures/data-pipeline');
const goldenDir = path.join(__dirname, '../e2e/fixtures/golden-dataset');
const outputsDir = path.join(goldenDir, 'outputs');

// Create directories
mkdirSync(outputsDir, { recursive: true });

// Read test files
const resumeRaw = readFileSync(path.join(fixturesDir, 'test-resume.txt'), 'utf-8');
const jdRaw = readFileSync(path.join(fixturesDir, 'test-jd.txt'), 'utf-8');

console.log('📄 Test files loaded:');
console.log(`   Resume: ${resumeRaw.split(/\s+/).length} words`);
console.log(`   JD: ${jdRaw.split(/\s+/).length} words\n`);

// Test extraction endpoint
console.log('🧪 Testing extraction endpoint...\n');

async function testExtraction() {
  try {
    // Create a test job
    const createRes = await fetch('http://localhost:3000/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Golden Dataset Generation Test',
        company: 'Test Company',
        status: 'ON_RADAR'
      })
    });
    
    if (!createRes.ok) {
      throw new Error(`Failed to create job: ${createRes.status}`);
    }
    
    const jobData = await createRes.json();
    const jobId = jobData.job.id;
    console.log(`✓ Created test job: ${jobId}\n`);
    
    // Upload resume as TXT (to avoid PDF issues)
    const formData = new FormData();
    const resumeBlob = new Blob([resumeRaw], { type: 'text/plain' });
    formData.append('file', resumeBlob, 'test-resume.txt');
    formData.append('kind', 'resume');
    
    const uploadRes = await fetch(`http://localhost:3000/api/jobs/${jobId}/attachments/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!uploadRes.ok) {
      throw new Error(`Upload failed: ${uploadRes.status}`);
    }
    
    console.log('✓ Resume uploaded\n');
    
    // Trigger extraction - REAL AI CALL
    console.log('⏳ Calling AI to create optimized variant...');
    console.log('   (This may take 10-15 seconds)\n');
    
    const extractRes = await fetch(`http://localhost:3000/api/jobs/${jobId}/refresh-variants`, {
      method: 'POST'
    });
    
    if (!extractRes.ok) {
      const error = await extractRes.text();
      throw new Error(`Extraction failed: ${error}`);
    }
    
    const extractData = await extractRes.json();
    console.log('✅ Extraction complete!');
    console.log(`   Cost: ${extractData.totalCost}`);
    console.log(`   Processed: ${extractData.processed.length} documents\n`);
    
    // Fetch the created variant
    const attachment = jobData.job.attachments?.[0] || await getFirstAttachment(jobId);
    const variantsRes = await fetch(`http://localhost:3000/api/attachments/${attachment.id}/variants`);
    const variantsData = await variantsRes.json();
    
    const aiOptimized = variantsData.variants.find(v => v.variantType === 'ai_optimized');
    
    if (!aiOptimized) {
      throw new Error('AI-optimized variant not created!');
    }
    
    const aiContent = JSON.parse(aiOptimized.content);
    const aiText = aiContent.text || JSON.stringify(aiContent);
    
    console.log('✅ AI-Optimized variant retrieved:');
    console.log(`   Words: ${aiContent.wordCount || 'unknown'}`);
    console.log(`   Tokens: ${aiOptimized.tokenCount}`);
    console.log(`   First 100 chars: ${aiText.substring(0, 100)}...\n`);
    
    // Save to golden dataset
    writeFileSync(
      path.join(outputsDir, 'resume-standard-ai-optimized.txt'),
      aiText,
      'utf-8'
    );
    
    console.log('💾 Saved to: e2e/fixtures/golden-dataset/outputs/resume-standard-ai-optimized.txt\n');
    
    // Cleanup test job
    await fetch(`http://localhost:3000/api/jobs/${jobId}`, { method: 'DELETE' });
    console.log('🧹 Cleaned up test job\n');
    
    // Create metadata
    const metadata = {
      generated_at: new Date().toISOString(),
      model: 'gpt-4o-mini',
      total_cost: extractData.totalCost,
      files: [
        {
          input: 'test-resume.txt',
          output: 'resume-standard-ai-optimized.txt',
          raw_words: resumeRaw.split(/\s+/).length,
          optimized_words: aiContent.wordCount,
          raw_tokens: estimateTokens(resumeRaw),
          optimized_tokens: aiOptimized.tokenCount,
          reduction_percent: ((1 - aiOptimized.tokenCount / estimateTokens(resumeRaw)) * 100).toFixed(1),
          cost: extractData.totalCost
        }
      ]
    };
    
    writeFileSync(
      path.join(goldenDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );
    
    console.log('📊 Metadata saved\n');
    console.log('═'.repeat(60));
    console.log('🎉 GOLDEN DATASET GENERATED SUCCESSFULLY!\n');
    console.log('Summary:');
    console.log(`   Raw words: ${metadata.files[0].raw_words}`);
    console.log(`   Optimized words: ${metadata.files[0].optimized_words}`);
    console.log(`   Token reduction: ${metadata.files[0].reduction_percent}%`);
    console.log(`   Total cost: ${metadata.total_cost}`);
    console.log('\n📁 Files created:');
    console.log('   - outputs/resume-standard-ai-optimized.txt');
    console.log('   - metadata.json');
    console.log('\n🎯 Next: Use these files in test suite (cost: $0.00 per run)');
    console.log('═'.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Is server running? (npm run dev)');
    console.error('2. Is OpenAI API key set? (check .env.local)');
    console.error('3. Are test fixtures present? (e2e/fixtures/data-pipeline/)\n');
    process.exit(1);
  }
}

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

async function getFirstAttachment(jobId) {
  const res = await fetch(`http://localhost:3000/api/jobs/${jobId}/attachments`);
  const data = await res.json();
  return data.attachments[0];
}

// Run
testExtraction();


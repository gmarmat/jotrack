#!/usr/bin/env node

/**
 * Diagnostic script to check variant extraction system
 * Run: node scripts/diagnose-variants.js [job-id]
 */

const Database = require('better-sqlite3');
const path = require('path');

const jobId = process.argv[2];

if (!jobId) {
  console.error('❌ Usage: node scripts/diagnose-variants.js [job-id]');
  process.exit(1);
}

const dbPath = path.join(__dirname, '..', 'data', 'jotrack.db');
const db = new Database(dbPath, { readonly: true });

console.log('🔍 VARIANT EXTRACTION DIAGNOSTIC\n');
console.log(`Job ID: ${jobId}\n`);

// Check job exists
const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
if (!job) {
  console.error('❌ Job not found');
  process.exit(1);
}

console.log(`✅ Job found: ${job.title} at ${job.company}`);
console.log(`   Status: ${job.status}`);
console.log(`   Analysis State: ${job.analysis_state || 'NULL'}\n`);

// Check attachments
const attachments = db.prepare(`
  SELECT * FROM attachments 
  WHERE job_id = ? AND is_active = 1 AND deleted_at IS NULL
  ORDER BY kind, created_at DESC
`).all(jobId);

console.log(`📎 Active Attachments: ${attachments.length}`);
attachments.forEach(att => {
  console.log(`   - ${att.kind}: ${att.filename} (ID: ${att.id.substring(0, 8)}...)`);
});
console.log('');

// Check variants for each attachment
console.log('🔍 Checking Variants:\n');

for (const att of attachments) {
  console.log(`\n📄 ${att.kind.toUpperCase()}: ${att.filename}`);
  console.log(`   Attachment ID: ${att.id}`);
  
  const variants = db.prepare(`
    SELECT 
      variant_type,
      is_active,
      token_count,
      extraction_model,
      created_at,
      LENGTH(content) as content_length
    FROM artifact_variants
    WHERE source_id = ? AND is_active = 1
    ORDER BY created_at DESC
  `).all(att.id);
  
  if (variants.length === 0) {
    console.log('   ❌ NO VARIANTS FOUND');
    console.log('   → Need to click "Refresh Data" to create variants');
  } else {
    console.log(`   ✅ Found ${variants.length} variant(s):`);
    variants.forEach(v => {
      const date = new Date(v.created_at).toLocaleString();
      console.log(`      - ${v.variant_type}: ${v.token_count} tokens, ${v.extraction_model}, ${date}`);
      console.log(`        Content size: ${v.content_length} bytes`);
    });
    
    // Check for required variants
    const hasRaw = variants.some(v => v.variant_type === 'raw');
    const hasNormalized = variants.some(v => v.variant_type === 'ai_optimized');
    const hasDetailed = variants.some(v => v.variant_type === 'detailed');
    
    console.log('\n   Variant Checklist:');
    console.log(`      ${hasRaw ? '✅' : '❌'} raw`);
    console.log(`      ${hasNormalized ? '✅' : '❌'} ai_optimized (normalized)`);
    console.log(`      ${hasDetailed ? '✅' : '❌'} detailed`);
    
    if (!hasRaw) {
      console.log('\n   ⚠️  Missing RAW variant - upload might have failed');
    }
    if (!hasNormalized || !hasDetailed) {
      console.log('\n   ⚠️  Missing AI variants - need to run "Refresh Data"');
    }
  }
}

// Check analysis bundles
console.log('\n\n📊 Analysis Bundles:');
const bundles = db.prepare(`
  SELECT * FROM job_analysis_bundles
  WHERE job_id = ? AND is_active = 1
  ORDER BY created_at DESC
  LIMIT 5
`).all(jobId);

if (bundles.length === 0) {
  console.log('   ❌ No analysis bundles found');
  console.log('   → Need to run "Analyze All" to create bundles');
} else {
  console.log(`   ✅ Found ${bundles.length} bundle(s):`);
  bundles.forEach((b, idx) => {
    const date = new Date(b.created_at).toLocaleString();
    console.log(`      ${idx + 1}. ${date}`);
    console.log(`         Fingerprint: ${b.fingerprint.substring(0, 16)}...`);
    console.log(`         Active: ${b.is_active ? 'Yes' : 'No'}`);
  });
}

// Summary
console.log('\n\n📋 SUMMARY:\n');

const totalVariants = db.prepare(`
  SELECT COUNT(*) as count FROM artifact_variants av
  JOIN attachments a ON a.id = av.source_id
  WHERE a.job_id = ? AND av.is_active = 1 AND a.is_active = 1
`).get(jobId);

const variantsByType = db.prepare(`
  SELECT variant_type, COUNT(*) as count FROM artifact_variants av
  JOIN attachments a ON a.id = av.source_id
  WHERE a.job_id = ? AND av.is_active = 1 AND a.is_active = 1
  GROUP BY variant_type
`).all(jobId);

console.log(`Total active variants: ${totalVariants.count}`);
variantsByType.forEach(v => {
  console.log(`   - ${v.variant_type}: ${v.count}`);
});

const expectedVariants = attachments.length * 3; // 3 variants per attachment
const actualVariants = totalVariants.count;

console.log(`\nExpected: ${expectedVariants} (${attachments.length} attachments × 3 variants)`);
console.log(`Actual: ${actualVariants}`);

if (actualVariants < expectedVariants) {
  console.log(`\n⚠️  MISSING ${expectedVariants - actualVariants} VARIANTS!`);
  console.log(`\nNext Step: Click "Refresh Data" in the Data Pipeline section`);
} else if (actualVariants === expectedVariants) {
  console.log('\n✅ ALL VARIANTS PRESENT!');
  console.log('\nSystem is ready for analysis.');
} else {
  console.log('\n⚠️  More variants than expected (might have duplicates)');
}

db.close();


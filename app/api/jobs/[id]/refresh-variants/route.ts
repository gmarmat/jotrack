// v2.7: Refresh Data endpoint
// Takes raw text → AI extraction → Structured variants
// Compares to previous version → Shows changelog

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, sqlite } from '@/db/client';
import { jobs, attachments, artifactVariants } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getVariant, saveRawVariant } from '@/lib/extraction/extractionEngine';
import { callAiProvider } from '@/lib/coach/aiProvider';
import { saveAnalysisBundle, calculateFingerprint } from '@/lib/analysis/bundleManager';
import { createHash } from 'crypto';
import { v4 as uuid } from 'uuid';
import path from 'path';

const paramsSchema = z.object({
  id: z.string().uuid('Invalid job id'),
});

interface ChangeItem {
  type: 'added' | 'removed' | 'updated';
  category: string;
  value: string;
  field?: string;
}

interface ComparisonResult {
  similarity: number;
  changes: ChangeItem[];
  significance: 'none' | 'minor' | 'major';
  reasoning: string;
}

interface ProcessedAttachment {
  kind: string;
  filename: string;
  similarity?: number;
  changes?: ChangeItem[];
  significance?: 'none' | 'minor' | 'major';
  extracted: boolean;
  error?: string;
}

/**
 * Create normalized (AI-Short) text variant from raw text
 * Purpose: Clean, concise text (500-800 words) for efficient AI analysis
 */
async function createNormalizedVariant(
  rawText: string,
  sourceType: 'resume' | 'job_description' | 'cover_letter'
): Promise<{ text: string; wordCount: number }> {
  const docType = sourceType === 'resume' ? 'resume' : 
                  sourceType === 'job_description' ? 'job description' : 
                  'cover letter';
  
  const prompt = `You are creating a NORMALIZED TEXT variant of a ${docType}.

TASK: Clean and condense the raw text below into a concise, well-formatted version.

CRITICAL RULES:
1. OUTPUT PLAIN TEXT ONLY (no JSON, no markdown formatting, no code blocks)
2. Remove: Formatting artifacts, redundant whitespace, page numbers, headers/footers
3. Preserve: ALL meaningful content - skills, experiences, achievements, requirements
4. Condense: Reduce verbosity but keep ALL facts and details
5. Fix: Spelling errors, grammar issues, unclear phrasing
6. Target: 500-800 words (shorter is better if you can preserve all content)
7. Format: Use simple paragraphs and line breaks for readability

EXAMPLE:
Input: "Page 1\\n====\\nJOHN    DOE\\nEmail: john@example.com      Phone: 555-1234\\n\\nEXPERIENCE\\nCompany A                                                     2020-Present\\nSenior Engineer\\n- Led team of 5..."

Output: "John Doe - Senior Engineer\\nEmail: john@example.com | Phone: 555-1234\\n\\nEXPERIENCE:\\nSenior Engineer at Company A (2020-Present): Led team of 5 engineers building microservices. Reduced API latency by 60%.\\n\\nSKILLS: Python, Django, AWS, Docker..."

NOW PROCESS THIS ${docType.toUpperCase()}:

${rawText}

OUTPUT NORMALIZED TEXT BELOW (START YOUR RESPONSE WITH THE CLEANED TEXT, NO PREAMBLE):`;

  const { result } = await callAiProvider('create_normalized_variant', {
    prompt,
    sourceType,
  }, false, 'v1');
  
  // Result is plain TEXT (not JSON), use directly
  const text = (typeof result === 'string' ? result : result.text || JSON.stringify(result)).trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  
  return { text, wordCount };
}

/**
 * Compare two text variants using AI
 */
async function compareVariantsWithAI(
  oldVariant: { text: string } | any,
  newVariant: { text: string } | any,
  sourceType: string
): Promise<ComparisonResult> {
  // Extract text from variants (handle both old JSON format and new text format)
  const oldText = oldVariant?.text || JSON.stringify(oldVariant);
  const newText = newVariant?.text || JSON.stringify(newVariant);
  
  const prompt = `
Compare these two ${sourceType} versions and determine what changed.
Return ONLY valid JSON with no markdown formatting:

{
  "similarity": 0.85,
  "changes": [
    { "type": "added", "category": "skill", "value": "AWS" },
    { "type": "updated", "category": "experience", "field": "current_role", "value": "New job title" },
    { "type": "removed", "category": "skill", "value": "PHP" }
  ],
  "significance": "major",
  "reasoning": "Added cloud skills and updated current role"
}

Significance levels:
- "none": Only typos/formatting changes
- "minor": Small updates that don't affect qualifications
- "major": Added/removed skills, changed jobs, updated qualifications

Old version:
${oldText.substring(0, 2000)}

New version:
${newText.substring(0, 2000)}
`;

  const { result } = await callAiProvider('compare_variants', {
    prompt,
    sourceType,
  }, false, 'v1');
  
  // Parse JSON from result (handle potential markdown wrapping or direct object)
  if (typeof result === 'object') {
    return result; // Already parsed
  }
  
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI did not return valid JSON');
  }
  
  return JSON.parse(jsonMatch[0]);
}

/**
 * Save variant to database
 */
async function saveVariant(params: {
  sourceId: string;
  sourceType: string;
  variantType: string;
  content: any;
  contentHash: string;
  tokenCount: number;
}): Promise<string> {
  const variantId = uuid();
  const now = Date.now();
  
  // Deactivate previous versions
  await db
    .update(artifactVariants)
    .set({ isActive: false })
    .where(
      and(
        eq(artifactVariants.sourceId, params.sourceId),
        eq(artifactVariants.sourceType, params.sourceType as any),
        eq(artifactVariants.variantType, params.variantType as any)
      )
    );
  
  // Insert new variant
  await db.insert(artifactVariants).values({
    id: variantId,
    sourceId: params.sourceId,
    sourceType: params.sourceType as any,
    variantType: params.variantType as any,
    version: 1,
    content: JSON.stringify(params.content),
    contentHash: params.contentHash,
    tokenCount: params.tokenCount,
    extractionModel: 'gpt-4o-mini', // NOTE: Using OpenAI for extraction. Set preferred model in Settings Modal
    extractionPromptVersion: 'v1',
    createdAt: now,
    isActive: true,
  });
  
  return variantId;
}

/**
 * Estimate tokens (rough)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: jobId } = paramsSchema.parse(params);
    
    console.log(`🌟 Starting variant refresh for job ${jobId}...`);
    
    // Check job exists
    const job = await db.query.jobs.findFirst({
      where: (j, { eq }) => eq(j.id, jobId),
    });
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // Get all active attachments
    const activeAttachments = await db
      .select()
      .from(attachments)
      .where(
        and(
          eq(attachments.jobId, jobId),
          eq(attachments.isActive, true),
          isNull(attachments.deletedAt)
        )
      );
    
    if (activeAttachments.length === 0) {
      return NextResponse.json(
        { error: 'No active attachments found' },
        { status: 400 }
      );
    }
    
    console.log(`📎 Found ${activeAttachments.length} active attachments:`);
    activeAttachments.forEach(att => {
      console.log(`   - ${att.kind}: ${att.filename} (v${att.version}, isActive=${att.isActive})`);
    });
    console.log('');
    
    const processed: ProcessedAttachment[] = [];
    let totalCost = 0;
    
    for (const attachment of activeAttachments) {
      try {
        // Map kind to source type
        const sourceType =
          attachment.kind === 'resume' ? 'resume' :
          attachment.kind === 'jd' ? 'job_description' :
          attachment.kind === 'cover_letter' ? 'cover_letter' :
          'other';
        
        // Skip if not a supported type
        if (sourceType === 'other') {
          processed.push({
            kind: attachment.kind,
            filename: attachment.filename,
            extracted: false,
            error: 'Unsupported attachment type',
          });
          continue;
        }
        
        // Get raw variant (or extract on-the-fly for existing attachments)
        console.log(`🔍 Fetching raw variant for ${attachment.filename} (sourceType: ${sourceType})...`);
        
        let rawVariant = await getVariant(
          attachment.id,
          sourceType,
          'raw'
        );
        
        console.log(`   Raw variant result:`, rawVariant ? `Found (has .text: ${!!rawVariant.text})` : 'Not found');
        
        if (!rawVariant || !rawVariant.text) {
          console.log(`📄 No raw variant found, extracting from file: ${attachment.filename}`);
          
          // Extract raw text from file (for existing attachments uploaded before v2.7)
          const filePath = path.join(process.cwd(), 'data', 'attachments', attachment.path);
          const rawResult = await saveRawVariant({
            sourceId: attachment.id,
            sourceType,
            filePath,
          });
          
          if (!rawResult.success) {
            processed.push({
              kind: attachment.kind,
              filename: attachment.filename,
              extracted: false,
              error: rawResult.error || 'Failed to extract raw text',
            });
            continue;
          }
          
          // Get the newly created raw variant
          rawVariant = await getVariant(attachment.id, sourceType, 'raw');
          
          if (!rawVariant || !rawVariant.text) {
            processed.push({
              kind: attachment.kind,
              filename: attachment.filename,
              extracted: false,
              error: 'Raw extraction succeeded but variant not found',
            });
            continue;
          }
        }
        
        // Check if ai_optimized variant already exists with same content
        const existingAiVariant = await getVariant(
          attachment.id,
          sourceType,
          'ai_optimized'
        );
        
        // Calculate hash of raw content
        const rawHash = createHash('sha256')
          .update(rawVariant.text)
          .digest('hex');
        
        // If ai_optimized exists and raw content hasn't changed, skip re-extraction
        if (existingAiVariant) {
          const existingRawHash = rawVariant.metadata?.contentHash || rawHash;
          
          // Check if the ai_optimized variant was created from the same raw content
          const aiVariantRecord = await db
            .select()
            .from(artifactVariants)
            .where(
              and(
                eq(artifactVariants.sourceId, attachment.id),
                eq(artifactVariants.sourceType, sourceType as any),
                eq(artifactVariants.variantType, 'ai_optimized'),
                eq(artifactVariants.isActive, true)
              )
            )
            .limit(1);
          
          // If variant exists, check if it's the NEW format (text-based)
          if (aiVariantRecord.length > 0) {
            try {
              const existingContent = JSON.parse(aiVariantRecord[0].content);
              
              // Check if it's NEW format: { text: "...", wordCount: 123 }
              if (existingContent.text && typeof existingContent.text === 'string') {
                console.log(`✓ AI variant already exists (new format) for ${attachment.filename}, skipping re-extraction`);
                
                processed.push({
                  kind: attachment.kind,
                  filename: attachment.filename,
                  extracted: true,
                  significance: 'none',
                  changes: [],
                });
                continue;
              }
              
              // OLD format detected: { skills: [], experience: [] } or { fit: {...} }
              console.log(`⚠️ AI variant exists but in OLD format (JSON structure), will recreate as text variant`);
              
            } catch (e) {
              console.error(`⚠️ Could not parse existing variant, will recreate`);
            }
          }
        }
        
        console.log(`🔄 Creating AI-optimized variant from ${attachment.filename}...`);
        
        // Validate raw text exists and is not empty
        if (!rawVariant.text || typeof rawVariant.text !== 'string' || rawVariant.text.trim().length === 0) {
          console.error(`❌ Raw variant text is empty or invalid for ${attachment.filename}`);
          console.error(`   Raw variant structure:`, JSON.stringify(rawVariant).substring(0, 200));
          
          processed.push({
            kind: attachment.kind,
            filename: attachment.filename,
            extracted: false,
            error: 'Raw text extraction returned empty content. File may be corrupted, empty, or in unsupported format. Try converting to .txt and re-uploading.',
          });
          continue; // Skip AI extraction for this document
        }
        
        console.log(`✓ Raw text validated: ${rawVariant.text.length} chars, ${rawVariant.metadata?.wordCount || 0} words`);
        
        // Create normalized variant ONLY (2-variant system: Raw + Normalized)
        console.log(`📝 Creating AI-optimized (normalized) variant...`);
        const normalized = await createNormalizedVariant(rawVariant.text, sourceType);
        
        const normalizedInputTokens = estimateTokens(rawVariant.text);
        const normalizedOutputTokens = estimateTokens(normalized.text);
        const normalizedCost = (normalizedInputTokens * 0.00015 + normalizedOutputTokens * 0.0006) / 1000;
        totalCost += normalizedCost;
        
        console.log(`✅ AI-Optimized: ${normalized.wordCount} words (from ${rawVariant.metadata?.wordCount || 0} raw) - Cost: $${normalizedCost.toFixed(4)}`);
        
        // Compare with previous version (if exists)
        const oldVariant = await getVariant(
          attachment.id,
          sourceType,
          'ai_optimized'
        );
        
        let comparison: ComparisonResult | undefined;
        
        if (oldVariant) {
          console.log(`🔍 Comparing with previous variant...`);
          comparison = await compareVariantsWithAI(oldVariant, normalized, sourceType);
          
          // Add comparison cost
          const compareInputTokens = estimateTokens(
            (oldVariant.text || JSON.stringify(oldVariant)) + normalized.text
          );
          const compareOutputTokens = 500;
          const compareCost = (compareInputTokens * 0.00015 + compareOutputTokens * 0.0006) / 1000;
          totalCost += compareCost;
          
          console.log(`   Similarity: ${(comparison.similarity * 100).toFixed(0)}%, Significance: ${comparison.significance}`);
        }
        
        // Save ai_optimized variant (normalized text)
        const normalizedHash = createHash('sha256')
          .update(normalized.text)
          .digest('hex');
        
        await saveVariant({
          sourceId: attachment.id,
          sourceType,
          variantType: 'ai_optimized',
          content: {
            text: normalized.text,
            wordCount: normalized.wordCount,
            variant: 'normalized',
          },
          contentHash: normalizedHash,
          tokenCount: normalizedOutputTokens,
        });
        
        console.log(`✅ Variants saved for ${attachment.filename}`);
        
        processed.push({
          kind: attachment.kind,
          filename: attachment.filename,
          extracted: true,
          similarity: comparison?.similarity,
          changes: comparison?.changes,
          significance: comparison?.significance,
        });
        
      } catch (error: any) {
        console.error(`❌ Error processing ${attachment.filename}:`, error);
        processed.push({
          kind: attachment.kind,
          filename: attachment.filename,
          extracted: false,
          error: error.message || 'Extraction failed',
        });
      }
    }
    
    // Update job state
    await db
      .update(jobs)
      .set({
        analysisState: 'variants_fresh',
        updatedAt: Date.now(),
      })
      .where(eq(jobs.id, jobId));
    
    console.log(`✅ Variant refresh complete. Total cost: $${totalCost.toFixed(3)}`);
    
    // === SAVE ANALYSIS BUNDLE (for reuse!) ===
    try {
      const resumeProc = processed.find(p => p.kind === 'resume');
      const jdProc = processed.find(p => p.kind === 'jd');
      
      if (resumeProc?.extracted && jdProc?.extracted) {
        // Get all 3 variants for each
        const resumeAttachment = activeAttachments.find(a => a.kind === 'resume');
        const jdAttachment = activeAttachments.find(a => a.kind === 'jd');
        
        if (resumeAttachment && jdAttachment) {
          const resumeRaw = await getVariant(resumeAttachment.id, 'resume', 'raw') || 
                           await getVariant(resumeAttachment.id, 'attachment', 'raw');
          const resumeAi = await getVariant(resumeAttachment.id, 'resume', 'ai_optimized') || 
                          await getVariant(resumeAttachment.id, 'attachment', 'ai_optimized');
          const resumeDetailed = await getVariant(resumeAttachment.id, 'resume', 'detailed') || 
                                await getVariant(resumeAttachment.id, 'attachment', 'detailed');
          
          const jdRaw = await getVariant(jdAttachment.id, 'job_description', 'raw') || 
                       await getVariant(jdAttachment.id, 'attachment', 'raw');
          const jdAi = await getVariant(jdAttachment.id, 'job_description', 'ai_optimized') || 
                      await getVariant(jdAttachment.id, 'attachment', 'ai_optimized');
          const jdDetailed = await getVariant(jdAttachment.id, 'job_description', 'detailed') || 
                            await getVariant(jdAttachment.id, 'attachment', 'detailed');
          
          if (resumeRaw && resumeAi && jdRaw && jdAi) {
            const fingerprint = calculateFingerprint(
              resumeRaw.text || '',
              jdRaw.text || ''
            );
            
            saveAnalysisBundle({
              jobId,
              fingerprint,
              resumeRaw: resumeRaw.text || '',
              resumeAiOptimized: resumeAi.text || '',
              resumeDetailed: resumeDetailed?.text || '',
              jdRaw: jdRaw.text || '',
              jdAiOptimized: jdAi.text || '',
              jdDetailed: jdDetailed?.text || '',
              tokensUsed: Math.floor(totalCost / 0.000003), // Rough estimate
              costUsd: totalCost,
            });
            
            console.log(`📦 Saved analysis bundle (fingerprint: ${fingerprint.substring(0, 8)}...)`);
          }
        }
      }
    } catch (bundleError) {
      console.error('⚠️ Failed to save analysis bundle:', bundleError);
      // Don't fail the request if bundle save fails
    }
    
    return NextResponse.json({
      success: true,
      processed,
      totalCost: `$${totalCost.toFixed(3)}`,
      recommendation: 
        processed.some(p => p.significance === 'major')
          ? 'Major changes detected - recommend running full analysis'
          : processed.some(p => p.significance === 'minor')
          ? 'Minor changes detected - consider running analysis'
          : 'No significant changes - analysis may not be needed',
    });
    
  } catch (error: any) {
    console.error('❌ POST /refresh-variants error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}


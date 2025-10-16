// v2.7: Refresh Data endpoint
// Takes raw text → AI extraction → Structured variants
// Compares to previous version → Shows changelog

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/client';
import { jobs, attachments, artifactVariants } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getVariant, saveRawVariant } from '@/lib/extraction/extractionEngine';
import { callAiProvider } from '@/lib/coach/aiProvider';
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
 * Extract structured data from raw text using AI
 */
async function extractWithAI(
  rawText: string,
  sourceType: 'resume' | 'job_description' | 'cover_letter'
): Promise<any> {
  let prompt = '';
  
  if (sourceType === 'resume') {
    prompt = `
Extract structured information from this resume. Return ONLY valid JSON with no markdown formatting:

{
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Jan 2020 - Present",
      "highlights": ["achievement 1", "achievement 2"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "School Name",
      "year": "2020"
    }
  ],
  "summary": "Brief professional summary"
}

Resume text:
${rawText}
`;
  } else if (sourceType === 'job_description') {
    prompt = `
Extract structured information from this job description. Return ONLY valid JSON with no markdown formatting:

{
  "title": "Job Title",
  "company": "Company Name",
  "required_skills": ["skill1", "skill2", ...],
  "preferred_skills": ["skill1", "skill2", ...],
  "responsibilities": ["resp1", "resp2", ...],
  "qualifications": ["qual1", "qual2", ...],
  "summary": "Brief job summary"
}

Job description text:
${rawText}
`;
  } else {
    // cover_letter
    prompt = `
Extract key information from this cover letter. Return ONLY valid JSON with no markdown formatting:

{
  "target_company": "Company Name",
  "target_role": "Role Name",
  "key_points": ["point1", "point2", ...],
  "motivations": ["motivation1", "motivation2", ...],
  "summary": "Brief summary"
}

Cover letter text:
${rawText}
`;
  }
  
  const { result } = await callAiProvider('extract_structured_data', {
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
 * Compare two variants using AI
 */
async function compareVariantsWithAI(
  oldVariant: any,
  newVariant: any,
  sourceType: string
): Promise<ComparisonResult> {
  const prompt = `
Compare these two ${sourceType} variants and determine what changed.
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

Old variant:
${JSON.stringify(oldVariant, null, 2)}

New variant:
${JSON.stringify(newVariant, null, 2)}
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
    extractionModel: 'gpt-4o-mini', // TODO: Get from settings
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
    
    console.log(`📎 Found ${activeAttachments.length} active attachments`);
    
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
        let rawVariant = await getVariant(
          attachment.id,
          sourceType,
          'raw'
        );
        
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
          
          // If variant exists and was created recently, assume it's up to date
          if (aiVariantRecord.length > 0) {
            console.log(`✓ AI variant already exists for ${attachment.filename}, skipping re-extraction`);
            
            processed.push({
              kind: attachment.kind,
              filename: attachment.filename,
              extracted: true,
              significance: 'none',
              changes: [],
            });
            continue;
          }
        }
        
        console.log(`🔄 Extracting structured data from ${attachment.filename}...`);
        
        // Extract with AI
        const extracted = await extractWithAI(rawVariant.text, sourceType);
        
        // Calculate cost (rough estimate)
        const inputTokens = estimateTokens(rawVariant.text);
        const outputTokens = estimateTokens(JSON.stringify(extracted));
        const cost = (inputTokens * 0.00015 + outputTokens * 0.0006) / 1000; // GPT-4o Mini pricing
        totalCost += cost;
        
        // Get previous ai_optimized variant for comparison
        const oldVariant = await getVariant(
          attachment.id,
          sourceType,
          'ai_optimized'
        );
        
        let comparison: ComparisonResult | undefined;
        
        if (oldVariant) {
          console.log(`🔍 Comparing with previous variant...`);
          comparison = await compareVariantsWithAI(oldVariant, extracted, sourceType);
          
          // Add comparison cost
          const compareInputTokens = estimateTokens(
            JSON.stringify(oldVariant) + JSON.stringify(extracted)
          );
          const compareOutputTokens = 500; // Estimate for comparison result
          const compareCost = (compareInputTokens * 0.00015 + compareOutputTokens * 0.0006) / 1000;
          totalCost += compareCost;
        }
        
        // Save ai_optimized variant
        const contentHash = createHash('sha256')
          .update(JSON.stringify(extracted))
          .digest('hex');
        
        await saveVariant({
          sourceId: attachment.id,
          sourceType,
          variantType: 'ai_optimized',
          content: extracted,
          contentHash,
          tokenCount: outputTokens,
        });
        
        // Also save detailed variant (same for now, can be enhanced later)
        await saveVariant({
          sourceId: attachment.id,
          sourceType,
          variantType: 'detailed',
          content: extracted,
          contentHash,
          tokenCount: outputTokens,
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


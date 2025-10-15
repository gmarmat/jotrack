// v2.7: Global analysis orchestrator

import { db } from '@/db/client';
import { jobs, attachments } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import {
  checkAnalysisStaleness,
  updateAnalysisFingerprint,
  markJobAnalyzing,
} from './fingerprintCalculator';
import { extractVariants, getVariant } from '../extraction';
import type { SourceType } from '../extraction/types';

export interface AnalysisResult {
  success?: boolean;
  cached?: boolean;
  error?: boolean;
  message: string;
  nextAllowedAt?: number;
  results?: any;
}

/**
 * Main entry point for "Analyze All" button
 * Orchestrates all analysis steps with smart caching
 */
export async function runGlobalAnalysis(jobId: string): Promise<AnalysisResult> {
  // 1. Check staleness
  const staleness = await checkAnalysisStaleness(jobId);
  if (!staleness.isStale && staleness.severity === 'fresh') {
    return { cached: true, message: 'Analysis already up to date' };
  }

  // 2. Check rate limiting (prevent spam clicks)
  const rateLimitCheck = await checkRateLimit(jobId);
  if (rateLimitCheck.blocked) {
    return {
      error: true,
      message: `Please wait ${rateLimitCheck.secondsRemaining} seconds between analyses`,
      nextAllowedAt: rateLimitCheck.nextAllowedAt,
    };
  }

  // 3. Mark as analyzing
  await markJobAnalyzing(jobId);

  try {
    // 4. Extract/refresh variants if needed
    await ensureAllVariantsExist(jobId);

    // 5. Run analyses in optimal order (simplified for now)
    const results = {
      variantsCreated: true,
      message: 'Variants extracted successfully',
    };

    // 6. Update fingerprint
    console.log('🔄 Updating analysis fingerprint...');
    try {
      await updateAnalysisFingerprint(jobId);
      console.log('✅ Fingerprint updated successfully');
    } catch (fingerprintError) {
      console.error('❌ Failed to update fingerprint:', fingerprintError);
      // Don't fail the whole analysis, just log it
    }

    return { success: true, message: 'Analysis completed successfully', results };
  } catch (error) {
    console.error('❌ Global analysis error:', error);
    
    // Mark as stale on failure
    await db
      .update(jobs)
      .set({
        analysis_state: 'stale',
        updatedAt: Date.now(),
      })
      .where(eq(jobs.id, jobId));

    return {
      error: true,
      message: error instanceof Error ? error.message : 'Analysis failed',
    };
  }
}

/**
 * Rate limiting: Prevent accidental spam
 */
async function checkRateLimit(jobId: string): Promise<{
  blocked: boolean;
  nextAllowedAt?: number;
  secondsRemaining?: number;
}> {
  const job = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);

  if (job.length === 0) {
    throw new Error(`Job not found: ${jobId}`);
  }

  const currentJob = job[0];

  if (!currentJob.last_full_analysis_at) {
    return { blocked: false }; // First analysis, allow
  }

  const timeSince = Date.now() - currentJob.last_full_analysis_at;
  const COOLDOWN_MS = 30 * 1000; // 30 seconds

  if (timeSince < COOLDOWN_MS) {
    const nextAllowedAt = currentJob.last_full_analysis_at + COOLDOWN_MS;
    const secondsRemaining = Math.ceil((COOLDOWN_MS - timeSince) / 1000);
    return {
      blocked: true,
      nextAllowedAt,
      secondsRemaining,
    };
  }

  return { blocked: false };
}

/**
 * Ensure all attachments have extracted variants
 */
async function ensureAllVariantsExist(jobId: string): Promise<void> {
  console.log(`🔄 Ensuring variants exist for job ${jobId}...`);

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

  console.log(`📎 Found ${activeAttachments.length} active attachments`);

  // Extract variants for each attachment if not already done
  for (const attachment of activeAttachments) {
    // Determine source type based on attachment kind
    let sourceType: SourceType = 'attachment';
    
    // Check if variants already exist
    const existing = await getVariant(attachment.id, sourceType, 'ai_optimized');
    
    if (!existing) {
      console.log(`📝 Creating mock variants for ${attachment.kind}: ${attachment.filename}`);
      
      try {
        // TODO v2.9: Replace with real text extraction from DOCX/PDF
        // For now, create mock variants to test the flow
        const mockContent = `Mock ${attachment.kind} content from ${attachment.filename}. 
This is placeholder text until real text extraction is implemented in v2.9.
File: ${attachment.path}
Kind: ${attachment.kind}`;
        
        // Extract variants (synchronously for now)
        await extractVariants(attachment.id, sourceType, mockContent, { async: false });
        
        console.log(`✅ Created mock variants for ${attachment.filename}`);
      } catch (error) {
        console.error(`❌ Failed to create variants for ${attachment.filename}:`, error);
        // Continue with other attachments
      }
    } else {
      console.log(`✓ Variants already exist for ${attachment.filename}`);
    }
  }

  console.log(`✅ Variant extraction complete`);
}


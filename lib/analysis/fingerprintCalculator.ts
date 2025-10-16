// v2.7: Analysis fingerprint calculation for change detection

import { createHash } from 'crypto';
import { db } from '@/db/client';
import { jobs, attachments, userProfile, artifactVariants } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { calculateTextSimilarity, assessChangeSignificance } from './similarityCalculator';

export interface StalenessCheck {
  isStale: boolean;
  severity: 'fresh' | 'never_analyzed' | 'minor' | 'major' | 'no_variants' | 'variants_fresh';
  message: string;
  changedArtifacts?: string[];
  hasVariants?: boolean; // Whether AI-optimized variants exist
  hasAnalysis?: boolean; // Whether full analysis has been run
}

/**
 * Calculate fingerprint hash from all analysis inputs
 * v2.7.1: Uses CONTENT hash from variants (not attachment ID/version)
 * This prevents false positives when toggling between identical versions
 */
export async function calculateAnalysisFingerprint(jobId: string): Promise<string> {
  // Gather all input sources
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

  // Get user profile version (with error handling for new table)
  let profileVersion = 0;
  try {
    const profile = await db.select().from(userProfile).limit(1);
    profileVersion = profile[0]?.version || 0;
  } catch (error) {
    // User profile table might not exist or might not be in Drizzle schema yet
    console.log('User profile not available, using version 0');
  }

  // Get content hashes from variants (content-based, not ID-based!)
  const parts: string[] = [];
  
  for (const attachment of activeAttachments) {
    // Try to get the ai_optimized variant's content hash
    const variant = await db
      .select()
      .from(artifactVariants)
      .where(
        and(
          eq(artifactVariants.sourceId, attachment.id),
          eq(artifactVariants.sourceType, 'attachment'),
          eq(artifactVariants.variantType, 'ai_optimized'),
          eq(artifactVariants.isActive, true)
        )
      )
      .limit(1);
    
    if (variant.length > 0) {
      // Use content hash (detects actual changes)
      parts.push(`${attachment.kind}:${variant[0].contentHash.substring(0, 16)}`);
    } else {
      // Fallback: use attachment ID if variant doesn't exist yet
      parts.push(`${attachment.kind}:${attachment.id}`);
    }
  }
  
  parts.push(`profile:v${profileVersion}`);
  parts.sort(); // Sort for consistency

  const fingerprint = createHash('sha256').update(parts.join('|')).digest('hex');

  return fingerprint;
}

/**
 * Check if analysis is stale (needs re-running)
 */
export async function checkAnalysisStaleness(jobId: string): Promise<StalenessCheck> {
  const job = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);

  if (job.length === 0) {
    throw new Error(`Job not found: ${jobId}`);
  }

  const currentJob = job[0];
  
  // Check if attachments exist
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
  
  // State 1: NO_VARIANTS - Attachments exist but no AI variants
  if (activeAttachments.length > 0) {
    const hasVariants = await checkIfVariantsExist(jobId, activeAttachments);
    
    if (!hasVariants) {
      return {
        isStale: true,
        severity: 'no_variants',
        message: 'Documents uploaded - click "Refresh Data" to extract AI-optimized data (~$0.02)',
        hasVariants: false,
        hasAnalysis: false,
      };
    }
    
    // State 2: VARIANTS_FRESH - Variants exist but no full analysis
    if (!currentJob.analysisFingerprint || currentJob.analysisState === 'pending') {
      return {
        isStale: true,
        severity: 'variants_fresh',
        message: 'AI data ready - click "Analyze All" to generate insights (~$0.20)',
        hasVariants: true,
        hasAnalysis: false,
      };
    }
  }
  
  // Check analysis_state column (set by triggers)
  if (currentJob.analysisState === 'stale') {
    // Determine if this is major or minor based on what changed
    const changes = currentJob.analysisFingerprint 
      ? await detectChanges(jobId, currentJob.analysisFingerprint, await calculateAnalysisFingerprint(jobId))
      : ['resume', 'jd']; // Assume major if no fingerprint
    
    if (changes.includes('resume') || changes.includes('jd')) {
      return {
        isStale: true,
        severity: 'major',
        message: 'Key documents changed - re-analysis strongly recommended',
        changedArtifacts: changes,
      };
    }
    
    return {
      isStale: true,
      severity: 'minor',
      message: 'Minor updates detected - consider re-analyzing',
      changedArtifacts: changes,
    };
  }
  
  // Never analyzed before
  if (!currentJob.analysisFingerprint || currentJob.analysisState === 'pending') {
    return {
      isStale: true,
      severity: 'never_analyzed',
      message: 'No analysis run yet - click Analyze to get started',
    };
  }

  // State is 'fresh' - analysis is up to date
  return {
    isStale: false,
    severity: 'fresh',
    message: 'Analysis is up to date',
    hasVariants: true,
    hasAnalysis: true,
  };
}

/**
 * Check if AI-optimized variants exist for all attachments
 */
async function checkIfVariantsExist(
  jobId: string,
  activeAttachments: any[]
): Promise<boolean> {
  for (const attachment of activeAttachments) {
    // Check if ai_optimized variant exists
    // Note: Old variants use source_type='attachment', new ones use specific types
    const variant = await db
      .select()
      .from(artifactVariants)
      .where(
        and(
          eq(artifactVariants.sourceId, attachment.id),
          eq(artifactVariants.variantType, 'ai_optimized'),
          eq(artifactVariants.isActive, true)
          // Don't filter by source_type - accept any (backward compat)
        )
      )
      .limit(1);
    
    if (variant.length === 0) {
      return false; // At least one attachment is missing variants
    }
  }
  
  return true; // All attachments have variants
}

/**
 * Detect which artifacts changed between two fingerprints
 */
async function detectChanges(
  jobId: string,
  oldFingerprint: string,
  newFingerprint: string
): Promise<string[]> {
  // Get current attachments
  const currentAttachments = await db
    .select()
    .from(attachments)
    .where(
      and(
        eq(attachments.jobId, jobId),
        eq(attachments.isActive, true),
        isNull(attachments.deletedAt)
      )
    );

  // For now, return all attachment kinds as changed
  // (More sophisticated diff would require storing old fingerprint components)
  const changes = currentAttachments.map((a) => a.kind);

  return [...new Set(changes)]; // Dedupe
}

/**
 * Update job analysis state and fingerprint after successful analysis
 */
export async function updateAnalysisFingerprint(jobId: string): Promise<void> {
  const fingerprint = await calculateAnalysisFingerprint(jobId);
  const now = Date.now();

  await db
    .update(jobs)
    .set({
      analysisFingerprint: fingerprint,
      analysisState: 'fresh',
      lastFullAnalysisAt: now,
      updatedAt: now,
    })
    .where(eq(jobs.id, jobId));
}

/**
 * Mark job as stale (analysis needs refresh)
 */
export async function markJobStale(jobId: string): Promise<void> {
  await db
    .update(jobs)
    .set({
      analysisState: 'stale',
      updatedAt: Date.now(),
    })
    .where(eq(jobs.id, jobId));
}

/**
 * Mark job as analyzing (in progress)
 */
export async function markJobAnalyzing(jobId: string): Promise<void> {
  await db
    .update(jobs)
    .set({
      analysisState: 'analyzing',
      updatedAt: Date.now(),
    })
    .where(eq(jobs.id, jobId));
}


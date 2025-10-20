/**
 * Analysis Bundle Manager
 * Eliminates duplicate variant extractions by caching results
 */

import { sqlite } from '@/db/client';
import crypto from 'crypto';

export interface AnalysisBundle {
  jobId: string;
  fingerprint: string;
  resumeRaw: string | null;
  resumeAiOptimized: string | null;
  resumeDetailed: string | null;
  jdRaw: string | null;
  jdAiOptimized: string | null;
  jdDetailed: string | null;
  createdAt: number;
  updatedAt: number;
  tokensUsed: number;
  costUsd: number;
}

/**
 * Calculate fingerprint from Resume + JD content
 * If content changes, fingerprint changes → invalidate cache
 */
export function calculateFingerprint(resumeContent: string, jdContent: string): string {
  const combined = `resume:${resumeContent}||jd:${jdContent}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
}

/**
 * Get existing bundle for job (if valid)
 */
export function getAnalysisBundle(jobId: string, currentFingerprint: string): AnalysisBundle | null {
  try {
    const row = sqlite.prepare(`
      SELECT * FROM job_analysis_bundles 
      WHERE job_id = ? 
      AND fingerprint = ?
      LIMIT 1
    `).get(jobId, currentFingerprint);
    
    if (!row) {
      console.log(`📦 No bundle found for job ${jobId}`);
      return null;
    }
    
    console.log(`💾 Bundle found for job ${jobId} (created ${new Date(row.created_at * 1000).toLocaleString()})`);
    
    return {
      jobId: row.job_id,
      fingerprint: row.fingerprint,
      resumeRaw: row.resume_raw,
      resumeAiOptimized: row.resume_ai_optimized,
      resumeDetailed: row.resume_detailed,
      jdRaw: row.jd_raw,
      jdAiOptimized: row.jd_ai_optimized,
      jdDetailed: row.jd_detailed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      tokensUsed: row.tokens_used || 0,
      costUsd: row.cost_usd || 0,
    };
  } catch (error) {
    console.error('Failed to get bundle:', error);
    return null;
  }
}

/**
 * Save new bundle (upsert)
 */
export function saveAnalysisBundle(bundle: {
  jobId: string;
  fingerprint: string;
  resumeRaw: string;
  resumeAiOptimized: string;
  resumeDetailed: string;
  jdRaw: string;
  jdAiOptimized: string;
  jdDetailed: string;
  tokensUsed: number;
  costUsd: number;
}): void {
  try {
    const now = Math.floor(Date.now() / 1000);
    
    sqlite.prepare(`
      INSERT INTO job_analysis_bundles (
        job_id, fingerprint,
        resume_raw, resume_ai_optimized, resume_detailed,
        jd_raw, jd_ai_optimized, jd_detailed,
        tokens_used, cost_usd,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(job_id) DO UPDATE SET
        fingerprint = excluded.fingerprint,
        resume_raw = excluded.resume_raw,
        resume_ai_optimized = excluded.resume_ai_optimized,
        resume_detailed = excluded.resume_detailed,
        jd_raw = excluded.jd_raw,
        jd_ai_optimized = excluded.jd_ai_optimized,
        jd_detailed = excluded.jd_detailed,
        tokens_used = excluded.tokens_used,
        cost_usd = excluded.cost_usd,
        updated_at = excluded.updated_at
    `).run(
      bundle.jobId,
      bundle.fingerprint,
      bundle.resumeRaw,
      bundle.resumeAiOptimized,
      bundle.resumeDetailed,
      bundle.jdRaw,
      bundle.jdAiOptimized,
      bundle.jdDetailed,
      bundle.tokensUsed,
      bundle.costUsd,
      now,
      now
    );
    
    console.log(`💾 Saved analysis bundle for job ${bundle.jobId} (fingerprint: ${bundle.fingerprint.substring(0, 8)}...)`);
  } catch (error) {
    console.error('Failed to save bundle:', error);
    throw error;
  }
}

/**
 * Invalidate bundle (called when Resume or JD is re-uploaded)
 */
export function invalidateBundle(jobId: string): void {
  try {
    sqlite.prepare('DELETE FROM job_analysis_bundles WHERE job_id = ?').run(jobId);
    console.log(`🗑️ Invalidated bundle for job ${jobId}`);
  } catch (error) {
    console.error('Failed to invalidate bundle:', error);
  }
}

/**
 * Check if bundle is valid (fingerprint matches current content)
 */
export function isBundleValid(jobId: string, resumeContent: string, jdContent: string): boolean {
  const currentFingerprint = calculateFingerprint(resumeContent, jdContent);
  const bundle = getAnalysisBundle(jobId, currentFingerprint);
  return bundle !== null;
}


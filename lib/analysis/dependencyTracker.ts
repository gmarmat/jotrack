// v2.7: Analysis dependency tracking for smart cache invalidation

import { v4 as uuid } from 'uuid';
import { db } from '@/db/client';
import { analysisDependencies, analysis_cache } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { SourceType, VariantType } from '../extraction/types';

export interface VariantReference {
  sourceId: string;
  sourceType: SourceType;
  variantType: VariantType;
}

/**
 * Record which variants were used for an analysis
 * Enables smart cache invalidation when dependencies change
 */
export async function recordAnalysisDependencies(
  jobId: string,
  analysisType: string,
  usedVariants: VariantReference[]
): Promise<void> {
  const dependencyId = uuid();
  const now = Date.now();

  // Insert or replace existing dependency record
  await db.insert(analysisDependencies).values({
    id: dependencyId,
    jobId,
    analysisType,
    dependsOn: JSON.stringify(usedVariants),
    createdAt: now,
    isValid: true,
  });
}

/**
 * Invalidate analyses when a dependency (variant) changes
 */
export async function invalidateDependentAnalyses(
  sourceId: string,
  sourceType: SourceType
): Promise<void> {
  // Find all analyses that depend on this variant
  const deps = await db
    .select()
    .from(analysisDependencies)
    .where(
      sql`json_extract(${analysisDependencies.dependsOn}, '$') LIKE '%"sourceId":"${sourceId}"%'`
    );

  console.log(`🔄 Found ${deps.length} analyses depending on ${sourceType}:${sourceId}`);

  // Mark them invalid
  for (const dep of deps) {
    await db
      .update(analysisDependencies)
      .set({ isValid: false })
      .where(eq(analysisDependencies.id, dep.id));

    // Also mark the cached analysis result as stale
    await markCacheStale(dep.jobId, dep.analysisType);
  }

  console.log(`✅ Invalidated ${deps.length} dependent analyses`);
}

/**
 * Mark cached analysis result as stale
 */
async function markCacheStale(jobId: string, analysisType: string): Promise<void> {
  // Check if analysis_cache table exists
  try {
    await db
      .update(analysis_cache)
      .set({ result_json: sql`json_set(result_json, '$.stale', 1)` })
      .where(
        sql`${analysis_cache.job_id} = ${jobId} AND ${analysis_cache.analysis_type} = ${analysisType}`
      );
  } catch (error) {
    // Table might not exist yet, that's okay
    console.log('analysis_cache table not found, skipping cache invalidation');
  }
}

/**
 * Check if analysis dependencies are still valid
 */
export async function areAnalysisDependenciesValid(
  jobId: string,
  analysisType: string
): Promise<boolean> {
  const deps = await db
    .select()
    .from(analysisDependencies)
    .where(
      sql`${analysisDependencies.jobId} = ${jobId} AND ${analysisDependencies.analysisType} = ${analysisType}`
    )
    .orderBy(sql`${analysisDependencies.createdAt} DESC`)
    .limit(1);

  if (deps.length === 0) {
    return false; // No dependencies recorded = not valid
  }

  return deps[0].isValid;
}

/**
 * Get the variants an analysis depends on
 */
export async function getAnalysisDependencies(
  jobId: string,
  analysisType: string
): Promise<VariantReference[]> {
  const deps = await db
    .select()
    .from(analysisDependencies)
    .where(
      sql`${analysisDependencies.jobId} = ${jobId} AND ${analysisDependencies.analysisType} = ${analysisType}`
    )
    .orderBy(sql`${analysisDependencies.createdAt} DESC`)
    .limit(1);

  if (deps.length === 0) {
    return [];
  }

  return JSON.parse(deps[0].dependsOn) as VariantReference[];
}


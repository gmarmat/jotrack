import { NextRequest, NextResponse } from 'next/server';
import { getAiRuns } from '@/db/coachRepository';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/usage?jobId=xxx
 * Get token usage stats for ALL AI runs (global) or filtered by job
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    // Get all AI runs globally (from ai_runs table)
    let totalTokens = 0;
    let totalCalls = 0;
    let byCapability: Record<string, { calls: number; tokens: number }> = {};

    // Get capabilities to check
    const capabilities = ['fit', 'compare', 'persona', 'fit_analysis', 'resume_improve', 'skill_path', 'company_profile', 'recruiter_profile'];
    
    // Query all runs (this is inefficient for large datasets - consider aggregation table in production)
    const db = (await import('@/db/client')).db;
    const { aiRuns } = await import('@/db/schema');
    
    let query = db.select().from(aiRuns);
    if (jobId) {
      const { eq } = await import('drizzle-orm');
      query = query.where(eq(aiRuns.jobId, jobId)) as any;
    }
    
    const allRuns = await query.limit(1000).execute(); // Limit for performance
    
    for (const run of allRuns) {
      try {
        const meta = JSON.parse(run.metaJson);
        if (meta.usage) {
          const tokens = meta.usage.totalTokens || 
                        (meta.usage.promptTokens || 0) + (meta.usage.completionTokens || 0);
          if (tokens > 0) {
            totalTokens += tokens;
            totalCalls++;

            const cap = run.capability;
            if (!byCapability[cap]) {
              byCapability[cap] = { calls: 0, tokens: 0 };
            }
            byCapability[cap].calls++;
            byCapability[cap].tokens += tokens;
          }
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }

    // Estimate cost (gpt-4o-mini pricing)
    const estimatedCost = (totalTokens / 1000000) * 0.15; // $0.15 per 1M tokens for gpt-4o-mini

    return NextResponse.json({
      totalTokens,
      totalCalls,
      byCapability,
      estimatedCost: estimatedCost.toFixed(4),
      note: jobId ? 'Usage for this job' : 'Global usage across all jobs',
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage stats' },
      { status: 500 }
    );
  }
}


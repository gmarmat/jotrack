import { NextRequest, NextResponse } from 'next/server';
import { getAiRuns } from '@/db/coachRepository';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/usage?jobId=xxx
 * Get token usage stats for a job or all jobs
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    // Get all AI runs (or filtered by job)
    let totalTokens = 0;
    let totalCalls = 0;
    let byCapability: Record<string, { calls: number; tokens: number }> = {};

    // For now, get runs from a sample job
    // In production, you'd want a global usage table
    if (jobId) {
      const capabilities = ['fit_analysis', 'resume_improve', 'skill_path', 'company_profile', 'recruiter_profile'];
      
      for (const capability of capabilities) {
        const runs = await getAiRuns(jobId, capability, 100);
        
        for (const run of runs) {
          const meta = JSON.parse(run.metaJson);
          if (meta.usage) {
            const tokens = meta.usage.totalTokens || 0;
            totalTokens += tokens;
            totalCalls++;

            if (!byCapability[capability]) {
              byCapability[capability] = { calls: 0, tokens: 0 };
            }
            byCapability[capability].calls++;
            byCapability[capability].tokens += tokens;
          }
        }
      }
    }

    // Estimate cost (approximate - update based on actual pricing)
    const estimatedCost = (totalTokens / 1000000) * 0.15; // $0.15 per 1M tokens for gpt-4o-mini

    return NextResponse.json({
      totalTokens,
      totalCalls,
      byCapability,
      estimatedCost: estimatedCost.toFixed(4),
      note: 'Usage tracking is per-job. Global usage coming in v1.3',
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage stats' },
      { status: 500 }
    );
  }
}


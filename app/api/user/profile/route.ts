import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/db/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/profile
 * Returns aggregated user statistics across all jobs
 */
export async function GET(request: NextRequest) {
  try {
    // Get job statistics
    const jobStats = sqlite.prepare(`
      SELECT 
        COUNT(*) as total_jobs,
        SUM(CASE WHEN deleted_at IS NULL AND archived_at IS NULL THEN 1 ELSE 0 END) as active_jobs,
        SUM(CASE WHEN status = 'APPLIED' OR status = 'PHONE_SCREEN' OR status = 'ONSITE' THEN 1 ELSE 0 END) as applied_jobs,
        SUM(CASE WHEN status = 'PHONE_SCREEN' OR status = 'ONSITE' THEN 1 ELSE 0 END) as interviewing_jobs,
        SUM(CASE WHEN status = 'OFFER' THEN 1 ELSE 0 END) as offers_received
      FROM jobs
      WHERE deleted_at IS NULL
    `).get();
    
    // Get coach mode usage
    const coachStats = sqlite.prepare(`
      SELECT 
        COUNT(DISTINCT job_id) as coach_mode_used,
        AVG(CASE 
          WHEN match_score_before > 0 AND match_score_after > 0 
          THEN ((match_score_after - match_score_before) / match_score_before * 100)
          ELSE 0 
        END) as avg_score_improvement
      FROM coach_sessions
    `).get();
    
    // Get total tokens/cost (rough estimate from bundle + cache tables)
    const costStats = sqlite.prepare(`
      SELECT 
        COALESCE(SUM(tokens_used), 0) as total_tokens,
        COALESCE(SUM(cost_usd), 0) as total_cost
      FROM (
        SELECT tokens_used, cost_usd FROM job_analysis_bundles
        UNION ALL
        SELECT tokens_used, cost_usd FROM company_ecosystem_cache
        UNION ALL
        SELECT tokens_used, cost_usd FROM company_intelligence_cache
      )
    `).get();
    
    // Get writing style from most recent coach session
    let writingStyle = null;
    const recentCoachState = sqlite.prepare(`
      SELECT data_json 
      FROM coach_state 
      ORDER BY updated_at DESC 
      LIMIT 1
    `).get();
    
    if (recentCoachState) {
      try {
        const coachData = JSON.parse(recentCoachState.data_json);
        writingStyle = coachData.writingStyleProfile || null;
      } catch (error) {
        console.warn('Failed to parse coach state:', error);
      }
    }
    
    // Calculate success rate
    const totalApplied = (jobStats as any).applied_jobs || 0;
    const totalOffers = (jobStats as any).offers_received || 0;
    const successRate = totalApplied > 0 
      ? Math.round((totalOffers / totalApplied) * 100)
      : 0;
    
    const stats = {
      totalJobs: (jobStats as any).total_jobs || 0,
      activeJobs: (jobStats as any).active_jobs || 0,
      appliedJobs: (jobStats as any).applied_jobs || 0,
      interviewingJobs: (jobStats as any).interviewing_jobs || 0,
      offersReceived: (jobStats as any).offers_received || 0,
      coachModeUsed: (coachStats as any).coach_mode_used || 0,
      averageScoreImprovement: Math.round((coachStats as any).avg_score_improvement || 0),
      totalAiCost: (costStats as any).total_cost || 0,
      totalTokensUsed: (costStats as any).total_tokens || 0,
      writingStyle,
      successRate,
      averageTimeToOffer: 0, // TODO: Calculate from status_history
    };
    
    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('❌ GET /user/profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/db/client';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { jobId: string };
}

/**
 * GET /api/coach/[jobId]/snapshots
 * Fetch all snapshots for a job
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { jobId } = context.params;
    
    // Get coach state
    const coachStateRow = sqlite.prepare(`
      SELECT interview_coach_json FROM coach_state WHERE job_id = ?
    `).get(jobId);
    
    if (!coachStateRow?.interview_coach_json) {
      return NextResponse.json({
        success: true,
        snapshots: [],
        version: 'v2'
      });
    }
    
    let interviewCoachData: any = {};
    try {
      interviewCoachData = JSON.parse(coachStateRow.interview_coach_json);
    } catch (error) {
      console.warn('Failed to parse coach data');
      return NextResponse.json({
        success: true,
        snapshots: [],
        version: 'v2'
      });
    }
    
    const snapshots = interviewCoachData.snapshots || [];
    
    // Sort by timestamp (newest first)
    snapshots.sort((a: any, b: any) => b.at - a.at);
    
    return NextResponse.json({
      success: true,
      snapshots,
      version: 'v2',
      totalCount: snapshots.length
    });
    
  } catch (error: any) {
    console.error('❌ Failed to fetch snapshots:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch snapshots',
        code: 'FETCH_ERROR',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}

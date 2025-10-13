import { NextRequest, NextResponse } from 'next/server';
import { getAiRuns } from '@/db/coachRepository';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/runs?jobId=xxx&capability=yyy&limit=3
 * Get AI runs history
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');
    const capability = searchParams.get('capability');
    const limit = parseInt(searchParams.get('limit') || '3');

    if (!jobId || !capability) {
      return NextResponse.json(
        { error: 'Missing required parameters: jobId, capability' },
        { status: 400 }
      );
    }

    const runs = await getAiRuns(jobId, capability, limit);
    return NextResponse.json({ runs });
  } catch (error) {
    console.error('Error fetching AI runs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI runs' },
      { status: 500 }
    );
  }
}


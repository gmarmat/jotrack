import { NextRequest, NextResponse } from 'next/server';
import { setActiveAiRun } from '@/db/coachRepository';

/**
 * POST /api/ai/runs/revert
 * Revert to a previous AI run (set as active)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, capability, runId } = body;

    if (!jobId || !capability || !runId) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, capability, runId' },
        { status: 400 }
      );
    }

    await setActiveAiRun(jobId, capability, runId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reverting AI run:', error);
    return NextResponse.json(
      { error: 'Failed to revert AI run' },
      { status: 500 }
    );
  }
}


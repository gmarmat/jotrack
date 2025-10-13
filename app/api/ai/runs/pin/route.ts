import { NextRequest, NextResponse } from 'next/server';
import { pinAiRun } from '@/db/coachRepository';

/**
 * POST /api/ai/runs/pin
 * Pin or unpin an AI run
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { runId, isPinned } = body;

    if (!runId || typeof isPinned !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: runId, isPinned' },
        { status: 400 }
      );
    }

    await pinAiRun(runId, isPinned);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error pinning AI run:', error);
    return NextResponse.json(
      { error: 'Failed to pin AI run' },
      { status: 500 }
    );
  }
}


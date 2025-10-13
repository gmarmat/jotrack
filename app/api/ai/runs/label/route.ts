import { NextRequest, NextResponse } from 'next/server';
import { labelAiRun } from '@/db/coachRepository';

/**
 * POST /api/ai/runs/label
 * Add a label to an AI run
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { runId, label } = body;

    if (!runId || typeof label !== 'string') {
      return NextResponse.json(
        { error: 'Missing required fields: runId, label' },
        { status: 400 }
      );
    }

    await labelAiRun(runId, label);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error labeling AI run:', error);
    return NextResponse.json(
      { error: 'Failed to label AI run' },
      { status: 500 }
    );
  }
}


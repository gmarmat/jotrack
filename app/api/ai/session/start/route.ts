import { NextRequest, NextResponse } from 'next/server';
import { createAiSession } from '@/db/coachRepository';

/**
 * POST /api/ai/session/start
 * Start a new AI session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, capability, targetThreshold } = body;

    if (!jobId || !capability) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, capability' },
        { status: 400 }
      );
    }

    const session = await createAiSession({
      jobId,
      capability,
      startedAt: Date.now(),
      endedAt: null,
      targetThreshold: targetThreshold || null,
      outcome: null,
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error starting AI session:', error);
    return NextResponse.json(
      { error: 'Failed to start AI session' },
      { status: 500 }
    );
  }
}


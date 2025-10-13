import { NextRequest, NextResponse } from 'next/server';
import { updateAiSession } from '@/db/coachRepository';

/**
 * POST /api/ai/session/finish
 * Finish an AI session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, outcome } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required field: sessionId' },
        { status: 400 }
      );
    }

    await updateAiSession(sessionId, {
      endedAt: Date.now(),
      outcome: outcome || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error finishing AI session:', error);
    return NextResponse.json(
      { error: 'Failed to finish AI session' },
      { status: 500 }
    );
  }
}


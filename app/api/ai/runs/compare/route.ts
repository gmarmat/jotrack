import { NextRequest, NextResponse } from 'next/server';
import { getAiRunById } from '@/db/coachRepository';

/**
 * POST /api/ai/runs/compare
 * Compare two AI runs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { runId1, runId2 } = body;

    if (!runId1 || !runId2) {
      return NextResponse.json(
        { error: 'Missing required fields: runId1, runId2' },
        { status: 400 }
      );
    }

    const [run1, run2] = await Promise.all([
      getAiRunById(runId1),
      getAiRunById(runId2),
    ]);

    if (!run1 || !run2) {
      return NextResponse.json(
        { error: 'One or both runs not found' },
        { status: 404 }
      );
    }

    const result1 = JSON.parse(run1.resultJson);
    const result2 = JSON.parse(run2.resultJson);

    return NextResponse.json({
      run1: {
        id: run1.id,
        createdAt: run1.createdAt,
        label: run1.label,
        provider: run1.provider,
        result: result1,
      },
      run2: {
        id: run2.id,
        createdAt: run2.createdAt,
        label: run2.label,
        provider: run2.provider,
        result: result2,
      },
    });
  } catch (error) {
    console.error('Error comparing AI runs:', error);
    return NextResponse.json(
      { error: 'Failed to compare AI runs' },
      { status: 500 }
    );
  }
}


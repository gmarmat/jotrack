// v2.7: API endpoint to check if analysis is stale

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkAnalysisStaleness } from '@/lib/analysis/fingerprintCalculator';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id: jobId } = paramsSchema.parse(params);

    const stalenessCheck = await checkAnalysisStaleness(jobId);

    return NextResponse.json(stalenessCheck);
  } catch (error) {
    console.error('GET /api/jobs/[id]/check-staleness error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


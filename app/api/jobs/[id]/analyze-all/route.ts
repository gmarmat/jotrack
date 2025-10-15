// v2.7: API endpoint for global analysis

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runGlobalAnalysis } from '@/lib/analysis/globalAnalyzer';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id: jobId } = paramsSchema.parse(params);

    console.log(`🌟 Starting global analysis for job ${jobId}...`);
    
    const result = await runGlobalAnalysis(jobId);

    if (result.error) {
      return NextResponse.json(result, { status: result.nextAllowedAt ? 429 : 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/jobs/[id]/analyze-all error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


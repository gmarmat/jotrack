import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { executePrompt, getJobAnalysisVariants } from '@/lib/analysis/promptExecutor';
import { db } from '@/db/client';
import { jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

/**
 * POST /api/jobs/[id]/analyze-match-score
 * Generates match score analysis using resume + JD variants
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: jobId } = paramsSchema.parse(params);
    
    console.log(`🎯 Starting match score analysis for job ${jobId}...`);
    
    // Fetch job
    const job = await db.query.jobs.findFirst({
      where: (j, { eq }) => eq(j.id, jobId),
    });
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // Get resume and JD variants
    const { resumeVariant, jdVariant } = await getJobAnalysisVariants(jobId);
    
    // Execute match score prompt
    const result = await executePrompt({
      promptName: 'matchScore',
      promptVersion: 'v1',
      variables: {
        resumeVariant: JSON.stringify(resumeVariant, null, 2),
        jdVariant: JSON.stringify(jdVariant, null, 2),
        companyName: job.company,
      },
      jobId,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Analysis failed' },
        { status: 500 }
      );
    }
    
    console.log(`✅ Match score analysis complete: ${result.tokensUsed} tokens, $${result.cost?.toFixed(4)}`);
    
    // Save result to database
    const now = Date.now();
    await db.update(jobs)
      .set({
        matchScoreData: JSON.stringify(result.data),
        matchScoreAnalyzedAt: now,
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId));
    
    console.log(`💾 Saved match score + skills data to database`);
    
    return NextResponse.json({
      success: true,
      analysis: result.data,
      metadata: {
        tokensUsed: result.tokensUsed,
        cost: `$${result.cost?.toFixed(4)}`,
        promptVersion: 'v1',
        analyzedAt: now,
      },
    });
  } catch (error: any) {
    console.error('❌ POST /analyze-match-score error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}


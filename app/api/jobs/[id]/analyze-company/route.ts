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
 * POST /api/jobs/[id]/analyze-company
 * Generates company intelligence using JD variant + web research
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: jobId } = paramsSchema.parse(params);
    
    console.log(`🏢 Starting company intelligence analysis for job ${jobId}...`);
    
    // Fetch job
    const job = await db.query.jobs.findFirst({
      where: (j, { eq }) => eq(j.id, jobId),
    });
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // Get JD variant (don't need resume for company analysis)
    const { jdVariant } = await getJobAnalysisVariants(jobId);
    
    // Extract company name from JD variant or use job.company
    const companyName = jdVariant.company || job.company;
    
    // Execute company intelligence prompt (includes web search permission)
    const result = await executePrompt({
      promptName: 'company',
      promptVersion: 'v1',
      variables: {
        jdVariant: JSON.stringify(jdVariant, null, 2),
        companyName,
      },
      jobId,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Analysis failed' },
        { status: 500 }
      );
    }
    
    console.log(`✅ Company intelligence complete: ${result.tokensUsed} tokens, $${result.cost?.toFixed(4)}`);
    
    // Save to jobs table for persistence
    await db.update(jobs)
      .set({
        companyIntelligenceData: JSON.stringify(result.data),
        companyIntelligenceAnalyzedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(jobs.id, jobId));
    
    console.log(`💾 Saved company intelligence to database`);
    
    return NextResponse.json({
      success: true,
      analysis: result.data,
      metadata: {
        tokensUsed: result.tokensUsed,
        cost: `$${result.cost?.toFixed(4)}`,
        promptVersion: 'v1',
        analyzedAt: Date.now(),
        webSearchUsed: true,
      },
    });
  } catch (error: any) {
    console.error('❌ POST /analyze-company error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}


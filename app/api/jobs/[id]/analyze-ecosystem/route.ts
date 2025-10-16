import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { executePrompt, getJobAnalysisVariants } from '@/lib/analysis/promptExecutor';
import { db } from '@/db/client';
import { jobs } from '@/db/schema';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

/**
 * POST /api/jobs/[id]/analyze-ecosystem
 * Generates company ecosystem matrix using JD variant + company intelligence (if available)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: jobId } = paramsSchema.parse(params);
    
    console.log(`🌐 Starting ecosystem analysis for job ${jobId}...`);
    
    // Fetch job
    const job = await db.query.jobs.findFirst({
      where: (j, { eq }) => eq(j.id, jobId),
    });
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // Get JD variant
    const { jdVariant } = await getJobAnalysisVariants(jobId);
    
    // Extract company name
    const companyName = jdVariant.company || job.company;
    
    // TODO: Fetch existing company intelligence if available
    const companyIntel = null; // Will be populated from company_intel table later
    
    // Execute ecosystem prompt
    const result = await executePrompt({
      promptName: 'companyEcosystem',
      promptVersion: 'v1',
      variables: {
        jdVariant: JSON.stringify(jdVariant, null, 2),
        companyName,
        companyIntel: companyIntel ? JSON.stringify(companyIntel, null, 2) : 'null',
      },
      jobId,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Analysis failed' },
        { status: 500 }
      );
    }
    
    console.log(`✅ Ecosystem analysis complete: ${result.tokensUsed} tokens, $${result.cost?.toFixed(4)}`);
    
    // TODO: Store result in database (company_ecosystem table)
    
    return NextResponse.json({
      success: true,
      analysis: result.data,
      metadata: {
        tokensUsed: result.tokensUsed,
        cost: `$${result.cost?.toFixed(4)}`,
        promptVersion: 'v1',
        analyzedAt: Date.now(),
      },
    });
  } catch (error: any) {
    console.error('❌ POST /analyze-ecosystem error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}


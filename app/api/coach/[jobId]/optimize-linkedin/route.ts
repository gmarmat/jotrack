import { NextRequest, NextResponse } from 'next/server';
import { db, sqlite } from '@/db/client';
import { jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { callAiProvider } from '@/lib/coach/aiProvider';
import { getJobAnalysisVariants } from '@/lib/analysis/promptExecutor';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { jobId: string };
}

/**
 * POST /api/coach/[jobId]/optimize-linkedin
 * Generates LinkedIn profile optimization recommendations
 * Headline, about, experience, skills, ATS optimization
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const jobId = context.params.jobId;
    const body = await request.json().catch(() => ({}));
    const currentLinkedInProfile = body.currentLinkedInProfile || '';
    
    console.log(`💼 Generating LinkedIn optimization for job ${jobId}...`);
    
    // Get job details
    const job = await db.query.jobs.findFirst({
      where: (j, { eq }) => eq(j.id, jobId),
    });
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // Get Match Matrix data (to identify gaps)
    const matchMatrixData = job.matchMatrixData 
      ? JSON.parse(job.matchMatrixData)
      : null;
    
    let matchMatrixGaps = '';
    if (matchMatrixData) {
      const gaps = matchMatrixData.signals
        ?.filter((signal: any) => signal.score < 75)
        .map((signal: any) => `${signal.name} (Score: ${signal.score}/100)`)
        .join(', ');
      matchMatrixGaps = gaps || 'No significant gaps';
    }
    
    // Get resume and JD from bundle
    let resumeContent = '';
    let jobDescription = '';
    
    try {
      const { resumeVariant, jdVariant } = await getJobAnalysisVariants(jobId);
      resumeContent = resumeVariant.aiOptimized || resumeVariant.raw || '';
      jobDescription = jdVariant.aiOptimized || jdVariant.raw || '';
    } catch (error) {
      return NextResponse.json(
        { error: 'Missing Resume or JD. Upload documents and run Refresh Data first.' },
        { status: 400 }
      );
    }
    
    // If no LinkedIn profile provided, use resume as base
    const profileToOptimize = currentLinkedInProfile || resumeContent;
    
    console.log(`📊 Input data:`, {
      hasLinkedInProfile: !!currentLinkedInProfile,
      resumeLength: resumeContent.length,
      jdLength: jobDescription.length,
      gapsIdentified: matchMatrixGaps.split(',').length
    });
    
    // Generate optimization recommendations
    const aiResult = await callAiProvider('linkedin-optimization', {
      companyName: job.company,
      roleTitle: job.title,
      jobDescription: jobDescription.substring(0, 2500),
      currentLinkedInProfile: profileToOptimize.substring(0, 3000),
      resumeSummary: resumeContent.substring(0, 1500),
      matchMatrixGaps
    }, false, 'v1');
    
    // Parse result
    let optimization;
    if (typeof aiResult.result === 'string') {
      const cleaned = aiResult.result
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      optimization = JSON.parse(cleaned);
    } else {
      optimization = aiResult.result;
    }
    
    console.log('✅ LinkedIn optimization generated:', {
      atsScoreImprovement: optimization.atsOptimization?.improvement || 0,
      quickWins: optimization.quickWins?.length || 0,
      skillsToAdd: optimization.skills?.toAdd?.length || 0
    });
    
    // Save to coach_state
    const now = Math.floor(Date.now() / 1000);
    
    const coachStateRow = sqlite.prepare(`
      SELECT data_json FROM coach_state WHERE job_id = ? LIMIT 1
    `).get(jobId);
    
    if (coachStateRow) {
      const coachState = JSON.parse(coachStateRow.data_json);
      const updatedState = {
        ...coachState,
        linkedinOptimization: optimization,
        linkedinOptimizationGeneratedAt: now
      };
      
      sqlite.prepare(`
        UPDATE coach_state 
        SET data_json = ?, updated_at = ?
        WHERE job_id = ?
      `).run(JSON.stringify(updatedState), now, jobId);
      
      console.log(`💾 Saved LinkedIn optimization to coach_state`);
    }
    
    return NextResponse.json({
      success: true,
      optimization,
      generatedAt: now,
      metadata: {
        tokensUsed: aiResult.tokensUsed || 0,
        cost: aiResult.cost || 0,
        atsScoreImprovement: optimization.atsOptimization?.improvement || 0,
        quickWins: optimization.quickWins?.length || 0
      }
    });
  } catch (error: any) {
    console.error('❌ LinkedIn optimization failed:', error);
    return NextResponse.json(
      { error: `Optimization failed: ${error.message}` },
      { status: 500 }
    );
  }
}


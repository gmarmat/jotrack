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
 * POST /api/coach/[jobId]/generate-recommendations
 * Analyzes Match Matrix gaps and generates actionable recommendations
 * Courses, projects, LinkedIn improvements, interview prep
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const jobId = context.params.jobId;
    
    console.log(`💡 Generating recommendations for job ${jobId}...`);
    
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
    
    if (!matchMatrixData) {
      return NextResponse.json(
        { error: 'No Match Matrix data found. Run Match Matrix analysis first.' },
        { status: 400 }
      );
    }
    
    // Extract gaps (signals with low scores)
    const gaps = matchMatrixData.signals
      ?.filter((signal: any) => signal.score < 75)
      .map((signal: any) => ({
        signal: signal.name,
        score: signal.score,
        gap: 100 - signal.score,
        category: signal.category,
        jdEvidence: signal.jdEvidence,
        resumeEvidence: signal.resumeEvidence
      })) || [];
    
    console.log(`📊 Identified ${gaps.length} gaps to address`);
    
    // Get resume and JD from bundle
    let resumeContent = '';
    let jobDescription = '';
    
    try {
      const { resumeVariant, jdVariant } = await getJobAnalysisVariants(jobId);
      resumeContent = resumeVariant.aiOptimized || resumeVariant.raw || '';
      jobDescription = jdVariant.aiOptimized || jdVariant.raw || '';
    } catch (error) {
      console.warn('Missing documents:', error);
    }
    
    // Get coach state (for writing style + discovery)
    const coachStateRow = sqlite.prepare(`
      SELECT data_json FROM coach_state WHERE job_id = ? LIMIT 1
    `).get(jobId);
    
    let writingStyleProfile = null;
    let careerGoals = '';
    
    if (coachStateRow) {
      const coachState = JSON.parse(coachStateRow.data_json);
      writingStyleProfile = coachState.writingStyleProfile;
      
      // Extract career goals from discovery responses
      const responses = coachState.discoveryResponses || {};
      careerGoals = Object.entries(responses)
        .map(([q, a]: [string, any]) => `Q: ${q}\nA: ${a.answer || a}`)
        .join('\n\n');
    }
    
    // Format match matrix gaps for prompt
    const formattedGaps = gaps.map((gap: any, idx: number) => 
      `${idx + 1}. ${gap.signal} (Score: ${gap.score}/100, Gap: ${gap.gap}%)\n` +
      `   Category: ${gap.category}\n` +
      `   JD Evidence: ${gap.jdEvidence}\n` +
      `   Resume Evidence: ${gap.resumeEvidence || 'Missing'}`
    ).join('\n\n');
    
    console.log(`🎯 Calling recommendations AI...`);
    
    // Generate recommendations
    const aiResult = await callAiProvider('recommendations', {
      jobDescription: jobDescription.substring(0, 2000),
      resumeSummary: resumeContent.substring(0, 1500),
      matchMatrixGaps: formattedGaps,
      writingStyleProfile: writingStyleProfile ? JSON.stringify(writingStyleProfile) : 'Not available',
      careerGoals: careerGoals || 'Not specified'
    }, false, 'v1');
    
    // Parse result
    let recommendations;
    if (typeof aiResult.result === 'string') {
      const cleaned = aiResult.result
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      recommendations = JSON.parse(cleaned);
    } else {
      recommendations = aiResult.result;
    }
    
    console.log('✅ Recommendations generated:', {
      courses: recommendations.courses?.length || 0,
      projects: recommendations.projects?.length || 0,
      linkedinImprovements: Object.keys(recommendations.linkedinImprovements || {}).length,
      interviewPrep: recommendations.interviewPrep?.length || 0
    });
    
    // Save to coach_state
    const now = Math.floor(Date.now() / 1000);
    
    if (coachStateRow) {
      const coachState = JSON.parse(coachStateRow.data_json);
      const updatedState = {
        ...coachState,
        recommendations,
        recommendationsGeneratedAt: now
      };
      
      sqlite.prepare(`
        UPDATE coach_state 
        SET data_json = ?, updated_at = ?
        WHERE job_id = ?
      `).run(JSON.stringify(updatedState), now, jobId);
      
      console.log(`💾 Saved recommendations to coach_state`);
    }
    
    return NextResponse.json({
      success: true,
      recommendations,
      generatedAt: now,
      metadata: {
        tokensUsed: aiResult.tokensUsed || 0,
        cost: aiResult.cost || 0,
        gapsAnalyzed: gaps.length,
        coursesRecommended: recommendations.courses?.length || 0,
        projectsRecommended: recommendations.projects?.length || 0
      }
    });
  } catch (error: any) {
    console.error('❌ Recommendations generation failed:', error);
    return NextResponse.json(
      { error: `Generation failed: ${error.message}` },
      { status: 500 }
    );
  }
}


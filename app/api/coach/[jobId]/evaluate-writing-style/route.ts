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
 * POST /api/coach/[jobId]/evaluate-writing-style
 * Analyzes user's writing style from discovery responses + resume
 * Stores profile in coach_state for use in talk track generation
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const jobId = context.params.jobId;
    
    console.log(`✍️ Evaluating writing style for job ${jobId}...`);
    
    // Get job details
    const job = await db.query.jobs.findFirst({
      where: (j, { eq }) => eq(j.id, jobId),
    });
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // Get coach state (discovery responses)
    const coachStateRow = sqlite.prepare(`
      SELECT data_json FROM coach_state WHERE job_id = ? LIMIT 1
    `).get(jobId);
    
    if (!coachStateRow) {
      return NextResponse.json(
        { error: 'No coach session found. Complete discovery wizard first.' },
        { status: 400 }
      );
    }
    
    const coachState = JSON.parse(coachStateRow.data_json);
    const discoveryResponses = coachState.discoveryResponses || {};
    
    if (Object.keys(discoveryResponses).length === 0) {
      return NextResponse.json(
        { error: 'No discovery responses found. Complete discovery wizard first.' },
        { status: 400 }
      );
    }
    
    // Get resume variant
    let resumeContent = '';
    try {
      const { resumeVariant } = await getJobAnalysisVariants(jobId);
      resumeContent = resumeVariant.aiOptimized || resumeVariant.raw || '';
    } catch (error) {
      console.warn('No resume found, using discovery only:', error);
    }
    
    // Get JD for context
    let jobDescription = '';
    try {
      const { jdVariant } = await getJobAnalysisVariants(jobId);
      jobDescription = jdVariant.aiOptimized || jdVariant.raw || '';
    } catch (error) {
      console.warn('No JD found:', error);
    }
    
    // Format discovery responses for analysis
    const formattedResponses = Object.entries(discoveryResponses)
      .map(([question, answer]) => `Q: ${question}\nA: ${answer}`)
      .join('\n\n');
    
    console.log('📊 Input data:', {
      discoveryQuestions: Object.keys(discoveryResponses).length,
      discoveryWordCount: formattedResponses.split(/\s+/).length,
      resumeWordCount: resumeContent.split(/\s+/).length,
      hasJD: !!jobDescription
    });
    
    // Call AI for writing style evaluation
    const aiResult = await callAiProvider('writing-style-evaluation', {
      jobDescription: jobDescription.substring(0, 1000), // First 1000 chars for context
      discoveryResponses: formattedResponses,
      resumeContent: resumeContent.substring(0, 2000) // First 2000 chars
    }, false, 'v1');
    
    // Parse result
    let writingStyleProfile;
    if (typeof aiResult.result === 'string') {
      // Strip markdown if present
      const cleaned = aiResult.result
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      writingStyleProfile = JSON.parse(cleaned);
    } else {
      writingStyleProfile = aiResult.result;
    }
    
    console.log('✅ Writing style evaluated:', {
      vocabularyLevel: writingStyleProfile.vocabularyLevel,
      dominantTones: writingStyleProfile.dominantTones,
      strengths: writingStyleProfile.writingStrengths?.length || 0,
      improvements: writingStyleProfile.improvementAreas?.length || 0
    });
    
    // Save to coach_state
    const now = Math.floor(Date.now() / 1000);
    const updatedState = {
      ...coachState,
      writingStyleProfile,
      writingStyleEvaluatedAt: now
    };
    
    sqlite.prepare(`
      UPDATE coach_state 
      SET data_json = ?, updated_at = ?
      WHERE job_id = ?
    `).run(JSON.stringify(updatedState), now, jobId);
    
    console.log(`💾 Saved writing style profile to coach_state`);
    
    return NextResponse.json({
      success: true,
      writingStyleProfile,
      evaluatedAt: now,
      metadata: {
        tokensUsed: aiResult.tokensUsed || 0,
        cost: aiResult.cost || 0,
        inputWordCount: formattedResponses.split(/\s+/).length + resumeContent.split(/\s+/).length
      }
    });
  } catch (error: any) {
    console.error('❌ Writing style evaluation failed:', error);
    return NextResponse.json(
      { error: `Evaluation failed: ${error.message}` },
      { status: 500 }
    );
  }
}


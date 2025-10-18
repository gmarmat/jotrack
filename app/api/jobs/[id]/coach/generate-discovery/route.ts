import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { executePrompt } from '@/lib/analysis/promptExecutor';
import { getJobAnalysisVariants } from '@/lib/analysis/promptExecutor';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    console.log(`🎯 Generating discovery questions for job ${jobId}...`);

    // Load job data
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Get JD and Resume variants
    const { jdVariant, resumeVariant } = await getJobAnalysisVariants(jobId);

    // Load match score analysis (should already exist)
    let matchScoreAnalysis = null;
    let gapsList = '';
    
    if (job.matchScoreData) {
      try {
        const matchData = JSON.parse(job.matchScoreData);
        matchScoreAnalysis = matchData.matchScore;
        
        // Extract gaps for context
        const gaps = matchData.matchScore?.topGaps || [];
        const missingSkills = matchData.skillsMatch?.missingCriticalSkills || [];
        
        gapsList = [
          ...gaps.map((g: string) => `- ${g}`),
          ...missingSkills.map((s: string) => `- Missing skill: ${s}`)
        ].join('\n');
        
        console.log(`📊 Loaded match analysis: ${gaps.length} gaps, ${missingSkills.length} missing skills`);
      } catch (error) {
        console.error('Failed to parse match score data:', error);
      }
    }

    if (!matchScoreAnalysis) {
      return NextResponse.json(
        { error: 'Match Score analysis required. Please run Match Score analysis first.' },
        { status: 400 }
      );
    }

    // Execute discovery questions prompt
    const result = await executePrompt({
      promptName: 'coach-discovery',
      promptVersion: 'v1',
      variables: {
        jobDescription: jdVariant.content,
        resumeText: resumeVariant.content,
        matchScoreAnalysis: JSON.stringify(matchScoreAnalysis, null, 2),
        gapsList,
      },
      jobId,
      sourceType: 'jd',
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to generate discovery questions');
    }

    const questionsData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;

    console.log(`✅ Discovery questions generated: ${questionsData.totalQuestions} questions in ${Object.keys(questionsData.categories).length} categories`);
    console.log(`📊 Categories:`, questionsData.categories);

    // Update job coach status
    await db.update(jobs)
      .set({ 
        coachStatus: 'profile-building',
        updatedAt: Date.now(),
      })
      .where(eq(jobs.id, jobId));

    return NextResponse.json({
      success: true,
      questions: questionsData.questions,
      totalQuestions: questionsData.totalQuestions,
      estimatedTime: questionsData.estimatedTime,
      categories: questionsData.categories,
      metadata: {
        tokensUsed: result.tokensUsed,
        cost: result.cost,
      },
    });
  } catch (error: any) {
    console.error('Discovery questions generation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate discovery questions' },
      { status: 500 }
    );
  }
}


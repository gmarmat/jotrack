import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
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
    const body = await request.json();
    const { currentAiResume, userEdits } = body;

    if (!userEdits) {
      return NextResponse.json(
        { error: 'User edits required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Re-optimizing resume with user edits for job ${jobId}...`);

    // Load job
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Get JD variant
    const { jdVariant } = await getJobAnalysisVariants(jobId);

    // Create a simplified prompt for re-optimization
    // This merges user edits with AI polish
    const reOptimizePrompt = `
You are refining a resume based on user edits.

Job Description:
${jdVariant.content}

Current AI-Optimized Resume:
${currentAiResume}

User's Edited Version:
${userEdits}

Task:
1. Identify what the user changed
2. Keep user's intent and additions
3. Polish the language for ATS optimization
4. Ensure keywords are still present
5. Fix any grammar/formatting issues
6. Maintain user's voice while improving clarity

Return ONLY a JSON object:
{
  "optimizedResume": "The improved version incorporating user edits",
  "changes": ["Change 1", "Change 2", "Change 3"],
  "keywordsMaintained": true,
  "atsScore": 0.90
}

Return JSON only, no markdown.
    `.trim();

    // Use Claude directly for quick optimization
    const result = await executePrompt({
      promptName: 'coach-resume-optimize',  // Reuse same prompt
      promptVersion: 'v1',
      variables: {
        jobDescription: jdVariant.content,
        resumeText: currentAiResume,
        profileData: `User Edits:\n${userEdits}`,
        companyPrinciples: 'Maintain from original',
        skillsToEmphasize: 'Maintain from original',
        skillsToDeemphasize: 'None',
      },
      jobId,
      sourceType: 'resume',
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to optimize resume');
    }

    const optimizedData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;

    console.log(`✅ Resume re-optimized: ${optimizedData.changes?.length || 0} improvements`);

    return NextResponse.json({
      success: true,
      optimizedResume: optimizedData.resume || optimizedData.optimizedResume,
      changes: optimizedData.changes || [],
      metadata: {
        tokensUsed: result.tokensUsed,
        cost: result.cost,
      },
    });
  } catch (error: any) {
    console.error('Resume optimization failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to optimize resume' },
      { status: 500 }
    );
  }
}


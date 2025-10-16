import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { executePrompt, getJobAnalysisVariants } from '@/lib/analysis/promptExecutor';
import { db } from '@/db/client';
import { jobs, userProfile } from '@/db/schema';
import { eq } from 'drizzle-orm';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

/**
 * POST /api/jobs/[id]/analyze-user-profile
 * Builds job-specific user profile and updates global profile
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: jobId } = paramsSchema.parse(params);
    
    console.log(`👤 Starting user profile analysis for job ${jobId}...`);
    
    // Fetch job
    const job = await db.query.jobs.findFirst({
      where: (j, { eq }) => eq(j.id, jobId),
    });
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // Get resume and JD variants
    const { resumeVariant, jdVariant } = await getJobAnalysisVariants(jobId);
    
    // Fetch existing global profile (singleton)
    const existingGlobalProfile = await db
      .select()
      .from(userProfile)
      .limit(1);
    
    const globalProfileData = existingGlobalProfile.length > 0 
      ? existingGlobalProfile[0].profileData 
      : null;
    
    // TODO: Fetch existing job-specific profile if any
    const existingJobProfile = null;
    
    // TODO: Fetch match analysis if available (provides context)
    const matchAnalysis = null;
    
    // Execute user profile prompt
    const result = await executePrompt({
      promptName: 'userProfile',
      promptVersion: 'v1',
      variables: {
        resumeVariant: JSON.stringify(resumeVariant, null, 2),
        jdVariant: JSON.stringify(jdVariant, null, 2),
        matchAnalysis: matchAnalysis ? JSON.stringify(matchAnalysis, null, 2) : 'null',
        existingJobProfile: existingJobProfile ? JSON.stringify(existingJobProfile, null, 2) : 'null',
        globalProfile: globalProfileData ? JSON.stringify(globalProfileData, null, 2) : 'null',
      },
      jobId,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Analysis failed' },
        { status: 500 }
      );
    }
    
    console.log(`✅ User profile analysis complete: ${result.tokensUsed} tokens, $${result.cost?.toFixed(4)}`);
    
    // TODO: Store job-specific profile in database (job_profiles table)
    // TODO: Merge global insights to user_profile table
    
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
    console.error('❌ POST /analyze-user-profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}


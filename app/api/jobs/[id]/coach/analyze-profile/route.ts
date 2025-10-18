import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { jobs, jobProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { executePrompt } from '@/lib/analysis/promptExecutor';
import { getJobAnalysisVariants } from '@/lib/analysis/promptExecutor';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const body = await request.json();
    const { discoveryResponses } = body;

    if (!discoveryResponses || !Array.isArray(discoveryResponses)) {
      return NextResponse.json(
        { error: 'Discovery responses required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Analyzing profile from ${discoveryResponses.length} discovery responses...`);

    // Load job data
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Get JD and Resume variants
    const { jdVariant, resumeVariant } = await getJobAnalysisVariants(jobId);

    // Load match score gaps
    let gapsList = '';
    if (job.matchScoreData) {
      try {
        const matchData = JSON.parse(job.matchScoreData);
        const gaps = matchData.matchScore?.topGaps || [];
        const missingSkills = matchData.skillsMatch?.missingCriticalSkills || [];
        
        gapsList = [
          ...gaps.map((g: string) => `- ${g}`),
          ...missingSkills.map((s: string) => `- ${s}`)
        ].join('\n');
      } catch (error) {
        console.error('Failed to parse match score data:', error);
      }
    }

    // Format discovery responses for prompt
    const formattedResponses = discoveryResponses
      .filter((r: any) => !r.skipped && r.answer.trim().length > 0)
      .map((r: any, idx: number) => {
        const question = r.question || `Question ${idx + 1}`;
        return `Q: ${question}\nA: ${r.answer}`;
      })
      .join('\n\n---\n\n');

    console.log(`📝 Processing ${discoveryResponses.filter((r: any) => !r.skipped).length} answered questions...`);

    // Execute profile analysis prompt
    const result = await executePrompt({
      promptName: 'coach-profile-analysis',
      promptVersion: 'v1',
      variables: {
        resumeText: resumeVariant.content,
        jobDescription: jdVariant.content,
        discoveryResponses: formattedResponses,
        gapsList,
      },
      jobId,
      sourceType: 'resume',
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to analyze profile');
    }

    const profileData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;

    console.log(`✅ Profile analysis complete: ${profileData.extractedSkills?.length || 0} skills, ${profileData.projects?.length || 0} projects, ${profileData.achievements?.length || 0} achievements`);
    console.log(`📊 Profile completeness: ${(profileData.profileCompleteness * 100).toFixed(0)}%`);
    console.log(`🎯 Gaps filled: ${profileData.gapsFilled?.length || 0} / ${gapsList.split('\n').length}`);

    // Save or update job profile
    const existingProfile = await db.select()
      .from(jobProfiles)
      .where(eq(jobProfiles.jobId, jobId))
      .limit(1);

    const profileId = existingProfile[0]?.id || uuidv4();
    const now = Date.now();

    if (existingProfile.length > 0) {
      // Update existing profile
      await db.update(jobProfiles)
        .set({
          profileData: JSON.stringify(profileData),
          discoveryResponses: JSON.stringify(discoveryResponses),
          updatedAt: now,
        })
        .where(eq(jobProfiles.id, profileId));
    } else {
      // Create new profile
      await db.insert(jobProfiles).values({
        id: profileId,
        jobId,
        profileData: JSON.stringify(profileData),
        discoveryResponses: JSON.stringify(discoveryResponses),
        createdAt: now,
        updatedAt: now,
      });
    }

    // Link profile to job
    await db.update(jobs)
      .set({
        jobProfileId: profileId,
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId));

    console.log(`💾 Saved job profile: ${profileId}`);

    return NextResponse.json({
      success: true,
      profileData,
      profileId,
      metadata: {
        tokensUsed: result.tokensUsed,
        cost: result.cost,
        skillsExtracted: profileData.extractedSkills?.length || 0,
        projectsRevealed: profileData.projects?.length || 0,
        achievementsQuantified: profileData.achievements?.length || 0,
        completeness: profileData.profileCompleteness,
      },
    });
  } catch (error: any) {
    console.error('Profile analysis failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze profile' },
      { status: 500 }
    );
  }
}


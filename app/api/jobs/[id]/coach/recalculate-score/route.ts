import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { jobs, jobProfiles, coachSessions } from '@/db/schema';
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

    console.log(`🔄 Recalculating match score with extended profile for job ${jobId}...`);

    // Load job and profile
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const [profile] = job.jobProfileId 
      ? await db.select().from(jobProfiles).where(eq(jobProfiles.id, job.jobProfileId)).limit(1)
      : [];

    if (!profile) {
      return NextResponse.json(
        { error: 'Job profile not found. Complete discovery wizard first.' },
        { status: 400 }
      );
    }

    // Get original match score (before profile)
    let originalScore = 0;
    if (job.matchScoreData) {
      try {
        const matchData = JSON.parse(job.matchScoreData);
        originalScore = matchData.matchScore?.overallScore || 0;
      } catch (error) {
        console.error('Failed to parse original match score:', error);
      }
    }

    // Get JD and Resume variants
    const { jdVariant, resumeVariant } = await getJobAnalysisVariants(jobId);

    // Parse profile data
    const profileData = profile.profileData ? JSON.parse(profile.profileData) : {};

    // Format extended profile for prompt
    const formattedProfile = `
## Extended Profile (From Discovery)

### Additional Skills
${profileData.extractedSkills?.map((s: any) => `- ${s.skill} (${s.yearsExperience} years, ${s.proficiencyLevel})`).join('\n') || 'None'}

### Projects Not on Resume
${profileData.projects?.map((p: any) => `- ${p.title}: ${p.description} (Skills: ${p.skillsDemonstrated.join(', ')})`).join('\n') || 'None'}

### Achievements & Impact
${profileData.achievements?.map((a: any) => `- ${a.achievement} (${a.metrics})`).join('\n') || 'None'}

### Hidden Strengths
${profileData.hiddenStrengths?.map((h: any) => `- ${h.strength}: ${h.evidence}`).join('\n') || 'None'}
    `.trim();

    console.log(`📊 Profile data: ${profileData.extractedSkills?.length || 0} skills, ${profileData.projects?.length || 0} projects`);

    // Execute match score prompt with extended profile
    const result = await executePrompt({
      promptName: 'matchScore',
      promptVersion: 'v1',
      variables: {
        jobDescription: jdVariant.content,
        resumeText: resumeVariant.content,
        userProfile: formattedProfile,  // NEW: Extended profile
      },
      jobId,
      sourceType: 'jd',
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to recalculate match score');
    }

    const newMatchData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
    const newScore = newMatchData.matchScore?.overallScore || 0;
    const improvement = newScore - originalScore;

    console.log(`✅ Match score recalculated: ${(originalScore * 100).toFixed(0)}% → ${(newScore * 100).toFixed(0)}% (+${(improvement * 100).toFixed(0)} points)`);

    // Create coach session record
    const sessionId = uuidv4();
    await db.insert(coachSessions).values({
      id: sessionId,
      jobId,
      sessionType: 'profile-building',
      matchScoreBefore: Math.round(originalScore * 100),
      matchScoreAfter: Math.round(newScore * 100),
      createdAt: Date.now(),
    });

    // Don't overwrite original matchScoreData - keep both!
    // We'll store the new score separately for coach mode display

    return NextResponse.json({
      success: true,
      matchScore: {
        before: originalScore,
        after: newScore,
        improvement: improvement,
        fromResume: originalScore,  // Resume-only score
        fromProfile: improvement,  // Contribution from profile
        improvementPercent: Math.round(improvement * 100),
      },
      analysis: newMatchData,
      metadata: {
        tokensUsed: result.tokensUsed,
        cost: result.cost,
        sessionId,
      },
    });
  } catch (error: any) {
    console.error('Match score recalculation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to recalculate match score' },
      { status: 500 }
    );
  }
}


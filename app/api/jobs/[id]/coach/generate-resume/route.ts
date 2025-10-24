import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { jobs, jobProfiles, attachments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { executePrompt } from '@/lib/analysis/promptExecutor';
import { getJobAnalysisVariants } from '@/lib/analysis/promptExecutor';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    console.log(`📄 Generating optimized resume for job ${jobId}...`);

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
        { error: 'Profile not found. Complete discovery wizard first.' },
        { status: 400 }
      );
    }

    // Get JD and Resume variants
    const { jdVariant, resumeVariant } = await getJobAnalysisVariants(jobId);

    // Parse profile data
    const profileData = profile.profileData ? JSON.parse(profile.profileData) : {};

    // Load company principles if available
    let companyPrinciples = '';
    if (job.companyIntelligenceData) {
      try {
        const companyIntel = JSON.parse(job.companyIntelligenceData);
        const principles = companyIntel.principles || [];
        companyPrinciples = principles.join(', ');
      } catch (error) {
        console.error('Failed to parse company intelligence:', error);
      }
    }

    // Extract skills to emphasize and de-emphasize from match analysis
    let skillsToEmphasize = '';
    let skillsToDeemphasize = '';
    
    if (job.matchScoreData) {
      try {
        const matchData = JSON.parse(job.matchScoreData);
        const strengths = matchData.matchScore?.topStrengths || [];
        const gaps = matchData.matchScore?.topGaps || [];
        
        skillsToEmphasize = strengths.join(', ');
        skillsToDeemphasize = gaps.join(', ');
      } catch (error) {
        console.error('Failed to parse match score data:', error);
      }
    }

    // Format profile data for prompt
    const formattedProfile = JSON.stringify(profileData, null, 2);

    console.log(`🎯 Optimizing with: ${companyPrinciples ? 'Company principles' : 'No principles'}, ${skillsToEmphasize ? 'Strengths' : 'No strengths'}`);

    // Execute resume optimization prompt
    const result = await executePrompt({
      promptName: 'coach-resume-optimize',
      promptVersion: 'v1',
      variables: {
        jobDescription: jdVariant.content,
        resumeText: resumeVariant.content,
        profileData: formattedProfile,
        companyPrinciples: companyPrinciples || 'Not available',
        skillsToEmphasize: skillsToEmphasize || 'Not specified',
        skillsToDeemphasize: skillsToDeemphasize || 'None',
      },
      jobId,
      sourceType: 'resume',
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to generate resume');
    }

    const resumeData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;

    console.log(`✅ Resume generated: ${resumeData.formatting?.totalWords || 0} words, ${resumeData.changes?.length || 0} optimizations made`);
    console.log(`📊 ATS readability: ${(resumeData.keywordOptimization?.atsReadabilityScore * 100 || 0).toFixed(0)}%`);

    // Save generated resume as attachment
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `Optimized_Resume_${timestamp}.txt`;
      const filePath = `${jobId}/${filename}`;
      const fullPath = join(process.cwd(), 'data', 'attachments', filePath);
      
      // Ensure directory exists
      await mkdir(join(process.cwd(), 'data', 'attachments', jobId), { recursive: true });
      
      // Write file
      await writeFile(fullPath, resumeData.resume, 'utf8');
      
      // Deactivate all existing resume attachments for this job
      await db.update(attachments)
        .set({ isActive: false })
        .where(and(
          eq(attachments.jobId, jobId),
          eq(attachments.kind, 'resume')
        ));
      
      // Save new optimized resume as active
      await db.insert(attachments).values({
        id: randomUUID(),
        jobId,
        filename,
        path: filePath,
        kind: 'resume',
        size: Buffer.byteLength(resumeData.resume, 'utf8'),
        isActive: true,
        version: 1,
        createdAt: Date.now(),
      });
      
      console.log(`💾 Saved optimized resume: ${filename} (marked as active)`);
    } catch (error) {
      console.error('Failed to save generated resume:', error);
    }

    return NextResponse.json({
      success: true,
      resume: resumeData.resume,
      changes: resumeData.changes || [],
      keywordOptimization: resumeData.keywordOptimization,
      formatting: resumeData.formatting,
      metadata: {
        tokensUsed: result.tokensUsed,
        cost: result.cost,
      },
    });
  } catch (error: any) {
    console.error('Resume generation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate resume' },
      { status: 500 }
    );
  }
}


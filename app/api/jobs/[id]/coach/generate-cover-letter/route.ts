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

    console.log(`💌 Generating cover letter for job ${jobId}...`);

    // Load job and profile
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Get JD variant (resume will come from latest optimized version)
    const { jdVariant } = await getJobAnalysisVariants(jobId);

    // Get latest optimized resume from coach session or use original
    // For now, we'll assume the resume has been optimized in coach mode
    const resumeText = jdVariant.content;  // Placeholder - should load optimized resume

    // Load company intelligence for principles
    let companyPrinciples = 'Not available';
    let companyIntelligence = '';
    
    if (job.companyIntelligenceData) {
      try {
        const intel = JSON.parse(job.companyIntelligenceData);
        companyPrinciples = (intel.principles || []).join(', ');
        companyIntelligence = JSON.stringify({
          name: intel.name,
          description: intel.description,
          culture: intel.cultureOfficial || intel.culture,
        }, null, 2);
      } catch (error) {
        console.error('Failed to parse company intelligence:', error);
      }
    }

    // Load hiring manager info from people profiles
    let hiringManagerInfo = 'Not available';
    if (job.peopleProfilesData) {
      try {
        const peopleData = JSON.parse(job.peopleProfilesData);
        const hiringManager = peopleData.profiles?.find((p: any) => 
          p.role?.toLowerCase().includes('manager') || 
          p.role?.toLowerCase().includes('director')
        );
        
        if (hiringManager) {
          hiringManagerInfo = `Name: ${hiringManager.name}\nRole: ${hiringManager.role}\nBackground: ${hiringManager.background || 'Unknown'}`;
        }
      } catch (error) {
        console.error('Failed to parse people profiles:', error);
      }
    }

    console.log(`📊 Context: Principles=${companyPrinciples !== 'Not available'}, HM=${hiringManagerInfo !== 'Not available'}`);

    // Execute cover letter prompt
    const result = await executePrompt({
      promptName: 'coach-cover-letter',
      promptVersion: 'v1',
      variables: {
        jobDescription: jdVariant.content,
        resumeText,
        companyPrinciples,
        hiringManagerInfo,
        companyIntelligence,
      },
      jobId,
      sourceType: 'jd',
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to generate cover letter');
    }

    const coverLetterData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;

    console.log(`✅ Cover letter generated: ${coverLetterData.wordCount || 0} words, ${coverLetterData.principleMentions || 0} principles`);

    // Save generated cover letter as attachment
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `Cover_Letter_${timestamp}.txt`;
      const filePath = `${jobId}/${filename}`;
      const fullPath = join(process.cwd(), 'data', 'attachments', filePath);
      
      // Ensure directory exists
      await mkdir(join(process.cwd(), 'data', 'attachments', jobId), { recursive: true });
      
      // Write file
      await writeFile(fullPath, coverLetterData.coverLetter, 'utf8');
      
      // Deactivate all existing cover letter attachments for this job
      await db.update(attachments)
        .set({ isActive: false })
        .where(and(
          eq(attachments.jobId, jobId),
          eq(attachments.kind, 'cover_letter')
        ));
      
      // Save new cover letter as active
      await db.insert(attachments).values({
        id: randomUUID(),
        jobId,
        filename,
        path: filePath,
        kind: 'cover_letter',
        size: Buffer.byteLength(coverLetterData.coverLetter, 'utf8'),
        isActive: true,
        version: 1,
        createdAt: Date.now(),
      });
      
      console.log(`💾 Saved cover letter: ${filename} (marked as active)`);
    } catch (error) {
      console.error('Failed to save generated cover letter:', error);
    }

    return NextResponse.json({
      success: true,
      coverLetter: coverLetterData.coverLetter,
      metadata: {
        tone: coverLetterData.tone,
        keywordsUsed: coverLetterData.keywordsUsed,
        principleMentions: coverLetterData.principleMentions,
        wordCount: coverLetterData.wordCount,
        tokensUsed: result.tokensUsed,
        cost: result.cost,
      },
    });
  } catch (error: any) {
    console.error('Cover letter generation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate cover letter' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { jobs, attachments } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { extractFileContent } from '@/lib/fileContent';
import { getCachedEcosystemData } from '@/db/companyEcosystemCacheRepository';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const jobId = context.params.id;

    // Get job
    const job = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!job || job.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const jobData = job[0];

    // Get attachments
    const jobAttachments = await db
      .select()
      .from(attachments)
      .where(eq(attachments.jobId, jobId))
      .orderBy(desc(attachments.createdAt));

    // Extract JD text
    let jobDescription = '';
    const jdAttachment = jobAttachments.find(a => a.kind === 'jd' && a.isActive);
    if (jdAttachment?.path) {
      try {
        const fullPath = `data/attachments/${jdAttachment.path}`;
        const jdContent = await extractFileContent(fullPath);
        jobDescription = jdContent?.text || '';
      } catch (error) {
        console.error('Failed to extract JD:', error);
      }
    }

    // Extract Resume text
    let resume = '';
    const resumeAttachment = jobAttachments.find(a => a.kind === 'resume' && a.isActive);
    if (resumeAttachment?.path) {
      try {
        const fullPath = `data/attachments/${resumeAttachment.path}`;
        const resumeContent = await extractFileContent(fullPath);
        resume = resumeContent?.text || '';
      } catch (error) {
        console.error('Failed to extract resume:', error);
      }
    }

    // Get coach session data (for URLs and additional context)
    let coachData: any = null;
    try {
      const coachRes = await fetch(
        `${request.nextUrl.origin}/api/coach/${jobId}/save`,
        { cache: 'no-store' }
      );
      if (coachRes.ok) {
        const data = await coachRes.json();
        coachData = data.data || null;
      }
    } catch (error) {
      console.error('Failed to fetch coach session:', error);
    }

    // Load cached ecosystem data if available
    let companyEcosystem = null;
    let ecosystemMetadata = null;
    if (jobData.company) {
      console.log(`🔍 Looking for cached ecosystem for company: "${jobData.company}"`);
      try {
        const cachedEcosystem = await getCachedEcosystemData(jobData.company);
        console.log(`🔍 Cache lookup result:`, cachedEcosystem ? 'FOUND' : 'NOT FOUND');
        if (cachedEcosystem) {
          const researchData = JSON.parse(cachedEcosystem.researchData);
          companyEcosystem = researchData.companies || null;
          
          // Calculate cache age
          const cacheAgeMs = Date.now() - (cachedEcosystem.createdAt * 1000);
          const cacheAgeDays = Math.floor(cacheAgeMs / (1000 * 60 * 60 * 24));
          const cacheAgeHours = Math.floor(cacheAgeMs / (1000 * 60 * 60));
          const cacheAgeStr = cacheAgeDays > 0 
            ? `${cacheAgeDays} day${cacheAgeDays > 1 ? 's' : ''} ago`
            : `${cacheAgeHours} hour${cacheAgeHours > 1 ? 's' : ''} ago`;
          
          ecosystemMetadata = {
            cached: true,
            cacheAge: cacheAgeStr,
            analyzedAt: cachedEcosystem.createdAt * 1000,
            companyCount: cachedEcosystem.companyCount,
            tokensUsed: cachedEcosystem.tokensUsed,
            costUsd: cachedEcosystem.costUsd,
          };
          
          console.log(`✅ Loaded cached ecosystem for ${jobData.company}: ${companyEcosystem?.length || 0} companies`);
        }
      } catch (error) {
        console.error('Failed to load cached ecosystem:', error);
      }
    }

    // Build response
    const response = {
      jobId,
      jobTitle: jobData.title,
      companyName: jobData.company,
      jobDescription,
      resume,
      // URLs from coach session (if available)
      companyUrls: coachData?.otherCompanyUrls || [],
      recruiterUrl: coachData?.recruiterUrl || '',
      peerUrls: (coachData?.peerUrls || []).map((p: any) => typeof p === 'string' ? p : p.url),
      skipLevelUrls: coachData?.skipLevelUrls || [],
      // Additional context
      notes: jobData.notes || '',
      postingUrl: jobData.postingUrl || '',
      // Analysis results (cached)
      companyEcosystem,
      ecosystemMetadata,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Analysis data fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analysis data' },
      { status: 500 }
    );
  }
}


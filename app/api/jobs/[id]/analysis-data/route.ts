import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { jobs, attachments } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { extractFileContent } from '@/lib/fileContent';

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


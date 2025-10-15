import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createJob, listJobs, searchJobs, getAttachmentSummaries } from '@/db/repository';
import { ORDERED_STATUSES } from '@/lib/status';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  company: z.string().min(1, 'Company is required'),
  status: z.enum(['ON_RADAR', 'APPLIED', 'PHONE_SCREEN', 'ONSITE', 'OFFER', 'REJECTED']),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createJobSchema.parse(body);
    
    const job = await createJob(validatedData);
    
    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating job:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    
    let jobs;
    if (query && query.trim()) {
      jobs = searchJobs(query.trim());
    } else {
      jobs = await listJobs();
    }
    
    // Fetch attachment summaries for all jobs
    const jobIds = jobs.map((j) => j.id);
    const attachmentSummaries = getAttachmentSummaries(jobIds);
    
    // Map summaries to jobs
    const summaryMap = new Map<string, Record<string, { count: number; latest: number | null }>>();
    attachmentSummaries.forEach((s) => {
      if (!summaryMap.has(s.jobId)) {
        summaryMap.set(s.jobId, {});
      }
      summaryMap.get(s.jobId)![s.kind] = { count: s.count, latest: s.latest };
    });
    
    const jobsWithAttachments = jobs.map((job) => ({
      ...job,
      attachmentSummary: summaryMap.get(job.id) || {},
    }));
    
    const response = NextResponse.json({ success: true, jobs: jobsWithAttachments });
    
    // Force no caching for attachment counts
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/client';
import { jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  jobId: z.string().uuid('Invalid job id'),
});

async function jobExists(jobId: string): Promise<boolean> {
  const rows = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.id, jobId)).limit(1);
  return rows.length > 0;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId } = bodySchema.parse(body);

    if (!(await jobExists(jobId))) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Get the original job
    const [originalJob] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    
    if (!originalJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Generate incremental copy title
    let newTitle = originalJob.title;
    const copyPattern = /^(.+?)\s*\(copy(?:\s+(\d+))?\)$/i;
    const match = newTitle.match(copyPattern);
    
    if (match) {
      // Already has (copy) or (copy N)
      const baseName = match[1].trim();
      const copyNum = match[2] ? parseInt(match[2], 10) : 1;
      newTitle = `${baseName} (copy ${copyNum + 1})`;
    } else {
      // First copy
      newTitle = `${newTitle} (copy)`;
    }

    // Create duplicate with new ID and timestamps
    const newJob = {
      id: crypto.randomUUID(),
      title: newTitle,
      company: originalJob.company,
      status: originalJob.status,
      postingUrl: originalJob.postingUrl,
      notes: originalJob.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.insert(jobs).values(newJob);

    return NextResponse.json({ 
      job: newJob,
      message: 'Job duplicated successfully'
    });
  } catch (err) {
    console.error('POST /duplicate error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

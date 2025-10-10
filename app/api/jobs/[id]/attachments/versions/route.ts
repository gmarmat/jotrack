import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/client';
import { jobs, attachments, ATTACHMENT_KINDS, type AttachmentKind } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { listVersions } from '@/db/repository';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().uuid('Invalid job id'),
});

const querySchema = z.object({
  kind: z.enum(['resume', 'jd', 'cover_letter', 'other']),
});

async function jobExists(jobId: string): Promise<boolean> {
  const rows = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.id, jobId)).limit(1);
  return rows.length > 0;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: jobId } = paramsSchema.parse(params);
    const { searchParams } = new URL(req.url);
    const kindParam = searchParams.get('kind');
    const parsed = querySchema.safeParse({ kind: kindParam });
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid kind parameter' }, { status: 400 });
    }

    if (!(await jobExists(jobId))) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const versions = listVersions(jobId, parsed.data.kind);

    return NextResponse.json({ versions });
  } catch (err) {
    console.error('GET /versions error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}


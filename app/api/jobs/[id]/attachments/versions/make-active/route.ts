import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/client';
import { jobs, attachments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().uuid('Invalid job id'),
});

const bodySchema = z.object({
  version: z.number().int().positive(),
  kind: z.enum(['resume', 'jd', 'cover_letter', 'other']),
});

async function jobExists(jobId: string): Promise<boolean> {
  const rows = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.id, jobId)).limit(1);
  return rows.length > 0;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: jobId } = paramsSchema.parse(params);
    const body = await req.json();
    const { version, kind } = bodySchema.parse(body);

    if (!(await jobExists(jobId))) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Find the target attachment to activate
    const targetRow = await db.query.attachments.findFirst({
      where: (a, { eq, and }) => 
        and(
          eq(a.jobId, jobId),
          eq(a.kind, kind),
          eq(a.version, version)
        ) as any,
    });

    if (!targetRow) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    if (targetRow.deletedAt !== null) {
      return NextResponse.json({ error: 'Cannot activate a deleted version' }, { status: 400 });
    }

    // Set is_active=0 for all attachments of this (jobId, kind)
    await db
      .update(attachments)
      .set({ isActive: false })
      .where(and(eq(attachments.jobId, jobId), eq(attachments.kind, kind)));

    // Set is_active=1 for the target version
    await db
      .update(attachments)
      .set({ isActive: true })
      .where(eq(attachments.id, targetRow.id));

    return NextResponse.json({
      ok: true,
      activeVersion: version,
    });
  } catch (err) {
    console.error('POST /make-active error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}


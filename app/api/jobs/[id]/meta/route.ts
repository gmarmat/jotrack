import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/client';
import { jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().uuid('Invalid job id'),
});

const bodySchema = z.object({
  postingUrl: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
});

async function jobExists(jobId: string): Promise<boolean> {
  const rows = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.id, jobId)).limit(1);
  return rows.length > 0;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: jobId } = paramsSchema.parse(params);
    const body = await req.json();
    const { postingUrl, notes } = bodySchema.parse(body);

    if (!(await jobExists(jobId))) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (postingUrl !== undefined) {
      updateData.postingUrl = postingUrl || null;
    }
    if (notes !== undefined) {
      updateData.notes = notes || '';
    }
    updateData.updatedAt = Date.now();

    await db.update(jobs).set(updateData).where(eq(jobs.id, jobId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PATCH /meta error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

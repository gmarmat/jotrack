import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { db } from '@/db/client';
import { jobs, attachments, ATTACHMENT_KINDS, type AttachmentKind } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getMaxVersion } from '@/db/repository';
import { ensureJobDir, relativeAttachmentPath } from '@/lib/attachments';

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

    // Find the source attachment
    const sourceRow = await db.query.attachments.findFirst({
      where: (a, { eq, and, isNull }) => 
        and(
          eq(a.jobId, jobId),
          eq(a.kind, kind),
          eq(a.version, version)
        ) as any,
    });

    if (!sourceRow) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    if (sourceRow.deletedAt !== null) {
      return NextResponse.json({ error: 'Cannot activate a deleted version' }, { status: 400 });
    }

    // Compute new version number
    const maxVersion = getMaxVersion(jobId, kind);
    const newVersion = maxVersion + 1;

    // Copy file on disk
    const sourcePath = path.join(process.cwd(), sourceRow.path);
    const jobDir = await ensureJobDir(jobId);
    const newFilename = `${randomUUID()}__${sourceRow.filename}`;
    const newPath = path.join(jobDir, newFilename);
    
    // Read and write file
    const fileBuffer = await fs.readFile(sourcePath);
    await fs.writeFile(newPath, fileBuffer);

    const relPath = relativeAttachmentPath(jobId, newFilename);
    const newId = randomUUID();
    const now = Date.now();

    // Insert new attachment row
    await db.insert(attachments).values({
      id: newId,
      jobId: jobId,
      filename: sourceRow.filename, // Keep original filename
      path: relPath,
      size: sourceRow.size,
      kind,
      version: newVersion,
      createdAt: now,
      deletedAt: null,
    });

    return NextResponse.json({
      ok: true,
      newVersion,
      id: newId,
    });
  } catch (err) {
    console.error('POST /make-active error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}


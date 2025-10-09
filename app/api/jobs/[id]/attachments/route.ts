import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/db/client';
import { jobs, attachments } from '@/db/schema';
import {
  ATTACHMENTS_ROOT,
  ensureJobDir,
  sanitizeFilename,
  relativeAttachmentPath,
  inferExtFromType,
  isAllowedExtension,
} from '@/lib/attachments';

export const dynamic = 'force-dynamic';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const paramsSchema = z.object({
  id: z.string().uuid('Invalid job id'),
});

const downloadSchema = z.object({
  download: z.string().uuid().optional(),
});

async function jobExists(jobId: string): Promise<boolean> {
  const rows = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.id, jobId)).limit(1);
  return rows.length > 0;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: jobId } = paramsSchema.parse(params);
    const { searchParams } = new URL(req.url);
    const downloadParam = searchParams.get('download');
    const parsed = downloadSchema.safeParse({ download: downloadParam || undefined });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
    }
    const downloadId = parsed.data.download ?? null;

    if (!(await jobExists(jobId))) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Download path
    if (downloadId) {
      const row = await db.query.attachments.findFirst({
        where: (a, { eq }) => eq(a.id, downloadId),
      });
      if (!row || row.jobId !== jobId) {
        return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
      }
      const abs = path.join(process.cwd(), row.path);
      const fileBuffer = await fs.readFile(abs);
      const headers = new Headers();
      headers.set('Content-Type', 'application/octet-stream');
      headers.set('Content-Disposition', `attachment; filename="${row.filename}"`);
      return new NextResponse(fileBuffer.buffer as ArrayBuffer, { headers });
    }

    // List path
    const rows = await db
      .select({
        id: attachments.id,
        filename: attachments.filename,
        size: attachments.size,
        created_at: attachments.createdAt,
      })
      .from(attachments)
      .where(eq(attachments.jobId, jobId))
      .orderBy(desc(attachments.createdAt));

    const list = rows.map((r) => ({
      id: r.id,
      filename: r.filename,
      size: r.size,
      created_at: r.created_at,
      url: `/api/jobs/${jobId}/attachments?download=${r.id}`,
    }));

    return NextResponse.json(list);
  } catch (err) {
    console.error('GET /attachments error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: jobId } = paramsSchema.parse(params);

    if (!(await jobExists(jobId))) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Missing file field' }, { status: 400 });
    }

    const originalName =
      'name' in file && typeof (file as any).name === 'string' ? (file as any).name : 'upload';
    const safeBase = sanitizeFilename(originalName);
    const type = (file as File).type || null;

    // Determine extension (prefer filename, fallback mime)
    const providedExt = safeBase.includes('.') ? safeBase.split('.').pop()! : '';
    const mimeExt = inferExtFromType(type);
    const ext = (providedExt || mimeExt || '').toLowerCase();

    if (!ext || !isAllowedExtension(ext)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
    }

    const bytes = await (file as File).arrayBuffer();
    if (bytes.byteLength > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 });
    }

    // Ensure storage area exists
    await fs.mkdir(ATTACHMENTS_ROOT, { recursive: true });
    const jobDir = await ensureJobDir(jobId);

    // Ensure unique target filename
    let finalName = safeBase.toLowerCase().endsWith(`.${ext}`) ? safeBase : `${safeBase}.${ext}`;
    let candidate = path.join(jobDir, finalName);
    const baseNoExt = finalName.replace(new RegExp(`\\.${ext}$`, 'i'), '');
    for (let i = 1; ; i++) {
      try {
        await fs.access(candidate); // exists -> try next
        candidate = path.join(jobDir, `${baseNoExt}(${i}).${ext}`);
      } catch {
        break; // free to use
      }
    }

    // Write file
    await fs.writeFile(candidate, Buffer.from(bytes));
    const relPath = relativeAttachmentPath(jobId, path.basename(candidate));
    const attId = randomUUID();
    const now = Date.now();
    const size = bytes.byteLength;

    await db.insert(attachments).values({
      id: attId,
      jobId: jobId,
      filename: path.basename(candidate),
      path: relPath,
      size,
      createdAt: now,
    });

    return NextResponse.json({
      id: attId,
      filename: path.basename(candidate),
      size,
      created_at: now,
      url: `/api/jobs/${jobId}/attachments?download=${attId}`,
    });
  } catch (err) {
    console.error('POST /attachments error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: jobId } = paramsSchema.parse(params);
    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get('attachment');
    if (!attachmentId) {
      return NextResponse.json({ error: 'Missing ?attachment=<id>' }, { status: 400 });
    }

    if (!(await jobExists(jobId))) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const row = await db.query.attachments.findFirst({
      where: (a, { eq }) => eq(a.id, attachmentId),
    });
    if (!row || row.jobId !== jobId) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Remove DB row first so UI lists reflect instantly; then best-effort unlink.
    await db.delete(attachments).where(eq(attachments.id, attachmentId));
    try {
      const abs = path.join(process.cwd(), row.path);
      await fs.unlink(abs);
    } catch {
      // ignore missing files; DB is source of truth
    }

    return NextResponse.json({ ok: true, id: attachmentId });
  } catch (err) {
    console.error('DELETE /attachments error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}


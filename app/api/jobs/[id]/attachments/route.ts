import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq, desc, and, isNull, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { jobs, attachments, ATTACHMENT_KINDS, type AttachmentKind } from '@/db/schema';
import { getMaxVersion } from '@/db/repository';
import {
  ATTACHMENTS_ROOT,
  ensureJobDir,
  sanitizeFilename,
  relativeAttachmentPath,
  inferExtFromType,
  isAllowedExtension,
  MAX_FILE_BYTES,
  MAX_FILE_MB,
  MAX_PER_JOB_BYTES,
  MAX_PER_JOB_MB,
  MAX_GLOBAL_BYTES,
  MAX_GLOBAL_MB,
} from '@/lib/attachments';

export const dynamic = 'force-dynamic';

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

    // List path (only active, non-deleted files)
    const rows = await db
      .select({
        id: attachments.id,
        filename: attachments.filename,
        size: attachments.size,
        kind: attachments.kind,
        version: attachments.version,
        created_at: attachments.createdAt,
      })
      .from(attachments)
      .where(and(eq(attachments.jobId, jobId), isNull(attachments.deletedAt), eq(attachments.isActive, true)))
      .orderBy(desc(attachments.createdAt));

    const list = rows.map((r) => ({
      id: r.id,
      filename: r.filename,
      size: r.size,
      kind: r.kind,
      version: r.version,
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

    // Parse and validate kind (optional, defaults to 'other')
    const kindRaw = form.get('kind');
    const kind: AttachmentKind = 
      kindRaw && typeof kindRaw === 'string' && ATTACHMENT_KINDS.includes(kindRaw as AttachmentKind)
        ? (kindRaw as AttachmentKind)
        : 'other';

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
    const fileSize = bytes.byteLength;

    // Check file size limit
    if (fileSize > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: 'FILE_TOO_LARGE', maxMb: MAX_FILE_MB },
        { status: 400 }
      );
    }

    // Check job quota (exclude soft-deleted)
    const jobTotalResult = await db
      .select({ total: sql<number>`COALESCE(SUM(${attachments.size}), 0)` })
      .from(attachments)
      .where(and(eq(attachments.jobId, jobId), isNull(attachments.deletedAt)));
    const jobTotal = jobTotalResult[0]?.total || 0;

    if (jobTotal + fileSize > MAX_PER_JOB_BYTES) {
      const remainingMb = Math.max(0, (MAX_PER_JOB_BYTES - jobTotal) / (1024 * 1024));
      return NextResponse.json(
        { error: 'JOB_QUOTA_EXCEEDED', remainingMb: remainingMb.toFixed(1) },
        { status: 400 }
      );
    }

    // Check global quota (exclude soft-deleted)
    const globalTotalResult = await db
      .select({ total: sql<number>`COALESCE(SUM(${attachments.size}), 0)` })
      .from(attachments)
      .where(isNull(attachments.deletedAt));
    const globalTotal = globalTotalResult[0]?.total || 0;

    if (globalTotal + fileSize > MAX_GLOBAL_BYTES) {
      const remainingMb = Math.max(0, (MAX_GLOBAL_BYTES - globalTotal) / (1024 * 1024));
      return NextResponse.json(
        { error: 'GLOBAL_QUOTA_EXCEEDED', remainingMb: remainingMb.toFixed(1) },
        { status: 400 }
      );
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

    // Auto-increment version per (jobId, kind)
    const maxVersion = getMaxVersion(jobId, kind);
    const newVersion = maxVersion + 1;

    // First, set is_active=0 for all existing attachments of this kind (non-deleted)
    await db
      .update(attachments)
      .set({ isActive: false })
      .where(and(eq(attachments.jobId, jobId), eq(attachments.kind, kind), isNull(attachments.deletedAt)));

    // Then insert the new file with is_active=1
    await db.insert(attachments).values({
      id: attId,
      jobId: jobId,
      filename: path.basename(candidate),
      path: relPath,
      size: fileSize,
      kind,
      version: newVersion,
      isActive: true,
      createdAt: now,
      deletedAt: null,
    });

    return NextResponse.json({
      id: attId,
      filename: path.basename(candidate),
      size: fileSize,
      kind,
      version: newVersion,
      isActive: true,
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


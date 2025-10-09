import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { eq, isNull } from 'drizzle-orm';
import { db } from '@/db/client';
import { attachments } from '@/db/schema';
import { TRASH_ROOT, registerUndo } from '@/lib/trash';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const attachmentId = params.id;

    // Find attachment
    const [attachment] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, attachmentId))
      .limit(1);

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Already deleted
    if (attachment.deletedAt) {
      return NextResponse.json({ ok: true, alreadyDeleted: true });
    }

    // Move file to trash
    const originalPath = path.join(process.cwd(), attachment.path);
    await fs.mkdir(TRASH_ROOT, { recursive: true });
    const trashFilename = `${attachmentId}__${attachment.filename}`;
    const trashPath = path.join(TRASH_ROOT, trashFilename);

    try {
      await fs.rename(originalPath, trashPath);
    } catch (err) {
      console.error('Failed to move file to trash:', err);
      // Continue anyway - DB is source of truth
    }

    // Mark as deleted
    const now = Date.now();
    await db
      .update(attachments)
      .set({ deletedAt: now })
      .where(eq(attachments.id, attachmentId));

    // Register undo (10s window)
    registerUndo(attachmentId, trashPath, originalPath);

    return NextResponse.json({ ok: true, undoAvailable: true });
  } catch (err) {
    console.error('DELETE attachment error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { attachments } from '@/db/schema';
import { getUndoEntry, clearUndo } from '@/lib/trash';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const attachmentId = params.id;

    // Check undo window
    const undoEntry = getUndoEntry(attachmentId);
    if (!undoEntry) {
      return NextResponse.json(
        { error: 'Undo window expired or not found' },
        { status: 400 }
      );
    }

    // Move file back from trash
    try {
      await fs.rename(undoEntry.trashPath, undoEntry.originalPath);
    } catch (err) {
      console.error('Failed to restore file from trash:', err);
      // Continue anyway if file already exists or is missing
    }

    // Clear deleted_at
    await db
      .update(attachments)
      .set({ deletedAt: null })
      .where(eq(attachments.id, attachmentId));

    // Clear undo entry
    clearUndo(attachmentId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('RESTORE attachment error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}


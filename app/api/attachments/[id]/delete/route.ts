import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { attachments } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attachmentId = params.id;

    // Find the attachment
    const attachment = await db.query.attachments.findFirst({
      where: (a, { eq }) => eq(a.id, attachmentId),
    });

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Soft delete: set deleted_at timestamp
    const now = Date.now();
    await db
      .update(attachments)
      .set({ deletedAt: now })
      .where(eq(attachments.id, attachmentId));

    return NextResponse.json({ ok: true, id: attachmentId });
  } catch (err) {
    console.error('DELETE /api/attachments/[id]/delete error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}


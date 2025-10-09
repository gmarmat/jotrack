import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { attachments } from '@/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attachmentId = params.id;

    // Find the soft-deleted attachment
    const attachment = await db.query.attachments.findFirst({
      where: (a, { eq, isNotNull }) => 
        and(eq(a.id, attachmentId), isNotNull(a.deletedAt)) as any,
    });

    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found or not deleted' },
        { status: 400 }
      );
    }

    // Restore: clear deleted_at timestamp
    await db
      .update(attachments)
      .set({ deletedAt: null })
      .where(eq(attachments.id, attachmentId));

    return NextResponse.json({ ok: true, id: attachmentId });
  } catch (err) {
    console.error('POST /api/attachments/[id]/restore error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

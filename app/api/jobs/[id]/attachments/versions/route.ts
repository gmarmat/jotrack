import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { attachments } from '@/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const kind = req.nextUrl.searchParams.get('kind');

    if (!kind) {
      return NextResponse.json({ error: 'Missing kind parameter' }, { status: 400 });
    }

    const versions = await db
      .select({
        id: attachments.id,
        filename: attachments.filename,
        path: attachments.path,
        mime: attachments.mime,
        size: attachments.size,
        isActive: attachments.isActive,
        createdAt: attachments.createdAt,
      })
      .from(attachments)
      .where(
        and(
          eq(attachments.jobId, jobId),
          eq(attachments.kind, kind),
          isNull(attachments.deletedAt)
        )
      )
      .orderBy(desc(attachments.createdAt));

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('GET /api/jobs/[id]/attachments/versions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

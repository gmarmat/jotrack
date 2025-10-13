import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/db/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/jobs/[id]/archive
 * Archive or unarchive a job
 * Body: { archive: boolean }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;

  try {
    const body = await request.json();
    const { archive } = body;

    const now = Date.now();
    const archivedAt = archive ? now : null;

    const stmt = sqlite.prepare(`
      UPDATE jobs 
      SET 
        archived_at = ?,
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(archivedAt, now, jobId);

    return NextResponse.json({
      success: true,
      message: archive ? 'Job archived' : 'Job unarchived',
      archivedAt,
    });
  } catch (error) {
    console.error('Error archiving job:', error);
    return NextResponse.json(
      { error: 'Failed to archive job' },
      { status: 500 }
    );
  }
}

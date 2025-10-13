import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/db/client';

export const dynamic = 'force-dynamic';

const TRASH_TTL_DAYS = 5;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * POST /api/jobs/[id]/delete
 * Soft delete a job (moves to trash with 5-day auto-purge)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;

  try {
    const now = Date.now();
    const permanentDeleteAt = now + (TRASH_TTL_DAYS * MS_PER_DAY);

    // Soft delete: set deletedAt and permanentDeleteAt
    const stmt = sqlite.prepare(`
      UPDATE jobs 
      SET 
        deleted_at = ?,
        permanent_delete_at = ?,
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(now, permanentDeleteAt, now, jobId);

    return NextResponse.json({
      success: true,
      message: 'Job moved to trash',
      deletedAt: now,
      permanentDeleteAt,
      daysUntilPurge: TRASH_TTL_DAYS,
    });
  } catch (error) {
    console.error('Error soft deleting job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}

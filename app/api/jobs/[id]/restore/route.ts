import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/db/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/jobs/[id]/restore
 * Restore a job from trash or archive
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;

  try {
    const now = Date.now();

    // Clear deletedAt, archivedAt, and permanentDeleteAt
    const stmt = sqlite.prepare(`
      UPDATE jobs 
      SET 
        deleted_at = NULL,
        archived_at = NULL,
        permanent_delete_at = NULL,
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(now, jobId);

    return NextResponse.json({
      success: true,
      message: 'Job restored successfully',
    });
  } catch (error) {
    console.error('Error restoring job:', error);
    return NextResponse.json(
      { error: 'Failed to restore job' },
      { status: 500 }
    );
  }
}

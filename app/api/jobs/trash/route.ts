import { NextResponse } from 'next/server';
import { sqlite } from '@/db/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/jobs/trash
 * Get all deleted jobs (in trash)
 */
export async function GET() {
  try {
    const stmt = sqlite.prepare(`
      SELECT 
        id,
        title,
        company,
        status,
        notes,
        created_at as createdAt,
        updated_at as updatedAt,
        deleted_at as deletedAt,
        archived_at as archivedAt,
        permanent_delete_at as permanentDeleteAt
      FROM jobs
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `);

    const jobs = stmt.all();

    // Calculate days until purge for each job
    const now = Date.now();
    const jobsWithCountdown = jobs.map((job: any) => ({
      ...job,
      daysUntilPurge: job.permanentDeleteAt 
        ? Math.ceil((job.permanentDeleteAt - now) / (24 * 60 * 60 * 1000))
        : null,
    }));

    return NextResponse.json({
      success: true,
      jobs: jobsWithCountdown,
    });
  } catch (error) {
    console.error('Error fetching trash:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trash' },
      { status: 500 }
    );
  }
}

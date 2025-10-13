import { NextResponse } from 'next/server';
import { sqlite } from '@/db/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/jobs/archived
 * Get all archived jobs
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
        archived_at as archivedAt
      FROM jobs
      WHERE archived_at IS NOT NULL AND deleted_at IS NULL
      ORDER BY archived_at DESC
    `);

    const jobs = stmt.all();

    return NextResponse.json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error('Error fetching archived jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch archived jobs' },
      { status: 500 }
    );
  }
}

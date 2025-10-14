import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { sqlite } from '@/db/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/jobs/bulk-delete
 * Bulk delete jobs (soft or permanent)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobIds, permanent } = body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { error: 'jobIds array is required' },
        { status: 400 }
      );
    }

    if (typeof permanent !== 'boolean') {
      return NextResponse.json(
        { error: 'permanent flag is required' },
        { status: 400 }
      );
    }

    const placeholders = jobIds.map(() => '?').join(',');

    if (permanent) {
      // Permanent delete: remove from database
      const stmt = sqlite.prepare(`DELETE FROM jobs WHERE id IN (${placeholders})`);
      stmt.run(...jobIds);

      return NextResponse.json({
        success: true,
        deleted: jobIds.length,
        permanent: true,
      });
    } else {
      // Soft delete: set deletedAt and permanentDeleteAt (5 days from now)
      const now = Date.now();
      const permanentDeleteAt = now + (5 * 24 * 60 * 60 * 1000); // 5 days

      const stmt = sqlite.prepare(`
        UPDATE jobs 
        SET deletedAt = ?, permanentDeleteAt = ?
        WHERE id IN (${placeholders})
      `);
      stmt.run(now, permanentDeleteAt, ...jobIds);

      return NextResponse.json({
        success: true,
        deleted: jobIds.length,
        permanent: false,
        restoreBefore: new Date(permanentDeleteAt).toISOString(),
      });
    }
  } catch (error: any) {
    console.error('Bulk delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete jobs' },
      { status: 500 }
    );
  }
}


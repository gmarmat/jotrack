import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/db/client';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * POST /api/jobs/[id]/purge
 * Permanently delete a job and all its attachments
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;

  try {
    // Get all attachments to delete files
    const attachments = sqlite
      .prepare('SELECT path FROM attachments WHERE job_id = ?')
      .all(jobId) as Array<{ path: string }>;

    // Delete attachment files from disk
    for (const attachment of attachments) {
      try {
        const fullPath = path.join(process.cwd(), 'data', 'attachments', attachment.path);
        await fs.unlink(fullPath);
      } catch (error) {
        console.error('Failed to delete file:', attachment.path, error);
        // Continue even if file deletion fails
      }
    }

    // Delete job (cascade will delete attachments, status_history, etc.)
    const stmt = sqlite.prepare('DELETE FROM jobs WHERE id = ?');
    stmt.run(jobId);

    return NextResponse.json({
      success: true,
      message: 'Job permanently deleted',
      deletedAttachments: attachments.length,
    });
  } catch (error) {
    console.error('Error purging job:', error);
    return NextResponse.json(
      { error: 'Failed to purge job' },
      { status: 500 }
    );
  }
}

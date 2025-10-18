import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { jobs, attachments } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    console.log(`✅ Marking job ${jobId} as applied...`);

    // Load job
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Find active resume version
    const [activeResume] = await db.select()
      .from(attachments)
      .where(
        and(
          eq(attachments.jobId, jobId),
          eq(attachments.kind, 'resume'),
          eq(attachments.isActive, true)
        )
      )
      .orderBy(desc(attachments.version))
      .limit(1);

    if (!activeResume) {
      return NextResponse.json(
        { error: 'No active resume found. Please finalize your resume first.' },
        { status: 400 }
      );
    }

    const now = Date.now();

    // Update job status
    await db.update(jobs)
      .set({
        coachStatus: 'applied',
        appliedAt: now,
        appliedResumeVersion: activeResume.version,
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId));

    console.log(`🔒 Resume locked: version ${activeResume.version}`);
    console.log(`📅 Applied at: ${new Date(now).toISOString()}`);

    return NextResponse.json({
      success: true,
      appliedAt: now,
      lockedResumeVersion: activeResume.version,
      message: 'Congratulations! Resume locked. You can now access interview prep.',
    });
  } catch (error: any) {
    console.error('Mark as applied failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark as applied' },
      { status: 500 }
    );
  }
}


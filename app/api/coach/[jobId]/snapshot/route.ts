import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/db/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const SnapshotRequestSchema = z.object({
  persona: z.enum(['recruiter', 'hiring-manager', 'peer']).optional(),
  label: z.string().min(1).max(100),
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  flags: z.array(z.string()).optional().default([])
});

interface RouteContext {
  params: { jobId: string };
}

/**
 * POST /api/coach/[jobId]/snapshot
 * Save a snapshot of current interview coach state
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { jobId } = context.params;
    
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON',
          timestamp: Date.now()
        },
        { status: 400 }
      );
    }
    
    const validation = SnapshotRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          issues: validation.error.issues,
          timestamp: Date.now()
        },
        { status: 400 }
      );
    }
    
    const { persona, label, score, confidence, flags } = validation.data;
    
    // Get existing coach state
    const coachStateRow = sqlite.prepare(`
      SELECT interview_coach_json FROM coach_state WHERE job_id = ?
    `).get(jobId);
    
    let interviewCoachData: any = {};
    if (coachStateRow?.interview_coach_json) {
      try {
        interviewCoachData = JSON.parse(coachStateRow.interview_coach_json);
      } catch (error) {
        console.warn('Failed to parse existing coach data, starting fresh');
      }
    }
    
    // Initialize snapshots array if it doesn't exist
    if (!interviewCoachData.snapshots) {
      interviewCoachData.snapshots = [];
    }
    
    // Create new snapshot
    const snapshot = {
      id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      persona: persona || null,
      label,
      score,
      confidence,
      flags,
      at: Math.floor(Date.now() / 1000)
    };
    
    // Add snapshot to array
    interviewCoachData.snapshots.push(snapshot);
    
    // Keep only last 50 snapshots to prevent bloat
    if (interviewCoachData.snapshots.length > 50) {
      interviewCoachData.snapshots = interviewCoachData.snapshots.slice(-50);
    }
    
    // Save to database
    const now = Math.floor(Date.now() / 1000);
    sqlite.prepare(`
      UPDATE coach_state 
      SET interview_coach_json = ?, updated_at = ?
      WHERE job_id = ?
    `).run(JSON.stringify(interviewCoachData), now, jobId);
    
    console.log(`💾 Saved snapshot: ${snapshot.id} for job ${jobId}`);
    
    return NextResponse.json({
      success: true,
      snapshot,
      version: 'v2',
      totalSnapshots: interviewCoachData.snapshots.length
    });
    
  } catch (error: any) {
    console.error('❌ Snapshot save failed:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to save snapshot',
        code: 'SAVE_ERROR',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}

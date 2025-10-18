import { NextResponse } from 'next/server';
import { sqlite } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;
    const body = await request.json();

    // Store coach data in coach_state table (NOT coach_sessions - that's for score tracking)
    const query = `
      INSERT INTO coach_state (job_id, data_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(job_id) DO UPDATE SET
        data_json = excluded.data_json,
        updated_at = excluded.updated_at
    `;

    const stmt = sqlite.prepare(query);
    stmt.run(jobId, JSON.stringify(body), Date.now());

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Coach save error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;

    const query = `SELECT data_json FROM coach_state WHERE job_id = ? LIMIT 1`;
    const stmt = sqlite.prepare(query);
    const result = stmt.get(jobId) as any;

    if (result) {
      return NextResponse.json({
        data: JSON.parse(result.data_json),
      });
    }

    return NextResponse.json({ data: null });
  } catch (error: any) {
    console.error('Coach load error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load' },
      { status: 500 }
    );
  }
}


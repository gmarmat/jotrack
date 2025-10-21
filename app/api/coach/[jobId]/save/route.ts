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

    // Handle both Application Coach (body directly) and Interview Coach (body.interviewCoachJson)
    let dataJson = body;
    let interviewCoachJson = '{}';
    
    // If body has interviewCoachJson, update Interview Coach data only
    if (body.interviewCoachJson) {
      interviewCoachJson = body.interviewCoachJson;
      
      // Get existing data_json to preserve it
      const existing = sqlite.prepare(`SELECT data_json FROM coach_state WHERE job_id = ? LIMIT 1`).get(jobId) as any;
      dataJson = existing ? existing.data_json : '{}';
      
      // Update only interview_coach_json
      const query = `
        INSERT INTO coach_state (job_id, data_json, interview_coach_json, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(job_id) DO UPDATE SET
          interview_coach_json = excluded.interview_coach_json,
          updated_at = excluded.updated_at
      `;
      const stmt = sqlite.prepare(query);
      stmt.run(jobId, dataJson, interviewCoachJson, Math.floor(Date.now() / 1000));
    } else {
      // Update Application Coach data (preserve interview_coach_json)
      const existing = sqlite.prepare(`SELECT interview_coach_json FROM coach_state WHERE job_id = ? LIMIT 1`).get(jobId) as any;
      interviewCoachJson = existing?.interview_coach_json || '{}';
      
      const query = `
        INSERT INTO coach_state (job_id, data_json, interview_coach_json, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(job_id) DO UPDATE SET
          data_json = excluded.data_json,
          updated_at = excluded.updated_at
      `;
      const stmt = sqlite.prepare(query);
      stmt.run(jobId, JSON.stringify(dataJson), interviewCoachJson, Math.floor(Date.now() / 1000));
    }

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

    const query = `SELECT data_json, interview_coach_json FROM coach_state WHERE job_id = ? LIMIT 1`;
    const stmt = sqlite.prepare(query);
    const result = stmt.get(jobId) as any;

    if (result) {
      return NextResponse.json({
        success: true,
        data: {
          ...JSON.parse(result.data_json),
          interview_coach_json: result.interview_coach_json || '{}'
        }
      });
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error: any) {
    console.error('Coach load error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load' },
      { status: 500 }
    );
  }
}


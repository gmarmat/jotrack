import { NextRequest, NextResponse } from "next/server";
import { sqlite } from "@/db/client";

/**
 * GET /api/jobs/[id]
 * Fetch a single job by ID
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    const rows = sqlite.prepare(`SELECT * FROM jobs WHERE id=? LIMIT 1`).all(id);

    if (!rows || rows.length === 0) {
      return new Response("Job not found", { status: 404 });
    }

    const job = rows[0] as any;
    
    // Transform snake_case to camelCase for frontend
    const transformed = {
      ...job,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      postingUrl: job.posting_url,
      deletedAt: job.deleted_at,
      archivedAt: job.archived_at,
      permanentDeleteAt: job.permanent_delete_at,
      analysisState: job.analysis_state,
      analysisFingerprint: job.analysis_fingerprint,
      lastFullAnalysisAt: job.last_full_analysis_at,
    };

    return Response.json(transformed);
  } catch (error) {
    console.error("Failed to fetch job:", error);
    return Response.json({ error: "Failed to fetch job" }, { status: 500 });
  }
}

/**
 * PATCH /api/jobs/[id]
 * Update job fields (notes, etc.)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    const body = await req.json();
    
    // Build dynamic UPDATE query based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    
    if (body.notes !== undefined) {
      updates.push('notes = ?');
      values.push(body.notes);
    }
    
    if (body.title !== undefined) {
      updates.push('title = ?');
      values.push(body.title);
    }
    
    if (body.company !== undefined) {
      updates.push('company = ?');
      values.push(body.company);
    }
    
    if (body.posting_url !== undefined || body.postingUrl !== undefined) {
      updates.push('posting_url = ?');
      values.push(body.posting_url || body.postingUrl);
    }
    
    if (updates.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No fields to update' 
      }, { status: 400 });
    }
    
    // Always update updated_at
    updates.push('updated_at = ?');
    values.push(Date.now());
    
    // Add id for WHERE clause
    values.push(id);
    
    const query = `UPDATE jobs SET ${updates.join(', ')} WHERE id = ?`;
    sqlite.prepare(query).run(...values);
    
    // Fetch and return updated job
    const rows = sqlite.prepare(`SELECT * FROM jobs WHERE id=? LIMIT 1`).all(id);
    
    if (!rows || rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Job not found after update' 
      }, { status: 404 });
    }
    
    const job = rows[0] as any;
    
    // Transform to camelCase
    const transformed = {
      ...job,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      postingUrl: job.posting_url,
      deletedAt: job.deleted_at,
      archivedAt: job.archived_at,
      permanentDeleteAt: job.permanent_delete_at,
      analysisState: job.analysis_state,
      analysisFingerprint: job.analysis_fingerprint,
      lastFullAnalysisAt: job.last_full_analysis_at,
    };
    
    return NextResponse.json({ success: true, job: transformed });
  } catch (error) {
    console.error("Failed to update job:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update job" 
    }, { status: 500 });
  }
}


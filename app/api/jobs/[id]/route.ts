import { NextRequest } from "next/server";
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


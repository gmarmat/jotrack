import { NextRequest } from "next/server";
import { sqlite } from "@/db/client";

/**
 * GET /api/jobs/[id]/attachments/trash
 * List all trashed attachments for a job
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;

  try {
    const rows = sqlite
      .prepare(`SELECT * FROM attachments WHERE job_id=? AND deleted_at IS NOT NULL ORDER BY created_at DESC`)
      .all(jobId) as any[];

    return Response.json({ trash: rows });
  } catch (error) {
    console.error("Failed to fetch trash:", error);
    return Response.json({ error: "Failed to fetch trash" }, { status: 500 });
  }
}


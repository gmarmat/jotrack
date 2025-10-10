import { NextRequest } from "next/server";
import { sqlite } from "@/db/client";

/**
 * GET /api/jobs/[id]/notes/all
 * Aggregate all notes from all statuses for a job
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;

  try {
    const rows = sqlite
      .prepare(
        `SELECT id, status, notes, updated_at 
         FROM status_details 
         WHERE job_id=? AND notes IS NOT NULL AND notes != ''
         ORDER BY updated_at DESC`
      )
      .all(jobId) as Array<{
        id: string;
        status: string;
        notes: string;
        updated_at: number;
      }>;

    const notes = rows.map((row) => ({
      id: row.id,
      status: row.status,
      excerpt: row.notes.substring(0, 150) + (row.notes.length > 150 ? "..." : ""),
      fullText: row.notes,
      updatedAt: row.updated_at,
    }));

    return Response.json({ notes });
  } catch (error) {
    console.error("Failed to fetch all notes:", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}


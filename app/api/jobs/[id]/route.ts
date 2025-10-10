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

    return Response.json(rows[0]);
  } catch (error) {
    console.error("Failed to fetch job:", error);
    return Response.json({ error: "Failed to fetch job" }, { status: 500 });
  }
}


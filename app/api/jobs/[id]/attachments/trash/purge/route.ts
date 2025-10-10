import { NextRequest } from "next/server";
import { unlink } from "node:fs/promises";
import { sqlite } from "@/db/client";

/**
 * POST /api/jobs/[id]/attachments/trash/purge
 * Hard delete all trashed attachments for a job (file + DB row)
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;

  try {
    // Get all trashed items
    const rows = sqlite
      .prepare(`SELECT id, path FROM attachments WHERE job_id=? AND deleted_at IS NOT NULL`)
      .all(jobId) as Array<{ id: string; path: string }>;

    // Delete files (ignore errors if file already deleted)
    for (const r of rows) {
      try {
        await unlink(r.path).catch(() => {});
      } catch {}
    }

    // Delete DB rows
    sqlite
      .prepare(`DELETE FROM attachments WHERE job_id=? AND deleted_at IS NOT NULL`)
      .run(jobId);

    return Response.json({ ok: true, purged: rows.length });
  } catch (error) {
    console.error("Failed to purge trash:", error);
    return Response.json({ error: "Failed to purge trash" }, { status: 500 });
  }
}


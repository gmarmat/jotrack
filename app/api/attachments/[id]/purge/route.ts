import { NextRequest } from "next/server";
import { unlink } from "node:fs/promises";
import { sqlite } from "@/db/client";

/**
 * POST /api/attachments/[id]/purge
 * Hard delete a single attachment (file + DB row)
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    // Get attachment path
    const rows = sqlite
      .prepare(`SELECT path FROM attachments WHERE id=?`)
      .all(id) as Array<{ path: string }>;
    
    if (!rows || rows.length === 0) {
      return new Response("Attachment not found", { status: 404 });
    }

    const row = rows[0];

    // Delete file (ignore errors if file already deleted)
    try {
      await unlink(row.path).catch(() => {});
    } catch {}

    // Delete DB row
    sqlite.prepare(`DELETE FROM attachments WHERE id=?`).run(id);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to purge attachment:", error);
    return Response.json(
      { error: "Failed to purge attachment" },
      { status: 500 }
    );
  }
}


import { NextRequest } from "next/server";
import { sqlite } from "@/db/client";
import { STATUS_LABELS } from "@/lib/status";

/**
 * GET /api/export/csv
 * Export all jobs as CSV with key fields + timeline deltas
 */
export async function GET(_req: NextRequest) {
  try {
    const jobs = sqlite.prepare(`
      SELECT 
        id, title, company, status, posting_url, notes, created_at, updated_at
      FROM jobs
      ORDER BY updated_at DESC
    `).all() as any[];

    // Build CSV
    const headers = [
      "ID",
      "Title",
      "Company",
      "Status",
      "Posting URL",
      "Notes",
      "Created",
      "Updated",
      "Time in Status",
    ];

    const rows = jobs.map((job) => {
      // Get current status event
      const events = sqlite.prepare(`
        SELECT entered_at FROM job_status_events 
        WHERE job_id=? AND left_at IS NULL 
        LIMIT 1
      `).all(job.id) as any[];

      let timeInStatus = "";
      if (events.length > 0) {
        const enteredAt = events[0].entered_at;
        const diff = Date.now() - enteredAt;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        timeInStatus = `${days}d`;
      }

      return [
        job.id,
        job.title,
        job.company,
        STATUS_LABELS[job.status as keyof typeof STATUS_LABELS] || job.status,
        job.posting_url || "",
        (job.notes || "").replace(/"/g, '""'), // Escape quotes
        new Date(job.created_at).toISOString(),
        new Date(job.updated_at).toISOString(),
        timeInStatus,
      ];
    });

    // Generate CSV content
    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="jotrack-export-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("CSV export failed:", error);
    return Response.json({ error: "Export failed" }, { status: 500 });
  }
}


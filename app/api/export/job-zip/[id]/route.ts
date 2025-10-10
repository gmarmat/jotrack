import { NextRequest } from "next/server";
import { sqlite } from "@/db/client";
import { readFile } from "fs/promises";
import archiver from "archiver";
import { Readable } from "stream";

/**
 * GET /api/export/job-zip/[id]
 * Export single job with active attachments as ZIP
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;

  try {
    // Get job
    const jobs = sqlite.prepare(`SELECT * FROM jobs WHERE id=?`).all(jobId) as any[];
    if (!jobs.length) {
      return new Response("Job not found", { status: 404 });
    }
    const job = jobs[0];

    // Get active attachments
    const attachments = sqlite.prepare(`
      SELECT * FROM attachments 
      WHERE job_id=? AND deleted_at IS NULL AND is_active=1
      ORDER BY kind, version DESC
    `).all(jobId) as any[];

    // Get status events for timeline data
    const events = sqlite.prepare(`
      SELECT * FROM job_status_events 
      WHERE job_id=? 
      ORDER BY entered_at DESC
    `).all(jobId) as any[];

    // Create ZIP
    const archive = archiver("zip", { zlib: { level: 9 } });

    // Add job metadata as JSON
    const metadata = {
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        status: job.status,
        posting_url: job.posting_url,
        notes: job.notes,
        created_at: job.created_at,
        updated_at: job.updated_at,
      },
      timeline: events.map((e: any) => ({
        status: e.status,
        entered_at: e.entered_at,
        left_at: e.left_at,
        duration_days: e.left_at
          ? Math.floor((e.left_at - e.entered_at) / (1000 * 60 * 60 * 24))
          : Math.floor((Date.now() - e.entered_at) / (1000 * 60 * 60 * 24)),
      })),
      attachments_count: attachments.length,
      exported_at: new Date().toISOString(),
    };

    archive.append(JSON.stringify(metadata, null, 2), { name: "job-metadata.json" });

    // Add attachments
    for (const att of attachments) {
      try {
        const buffer = await readFile(att.path);
        archive.append(buffer, { name: `${att.kind}/${att.filename}` });
      } catch (err) {
        console.error(`Failed to add ${att.filename}:`, err);
      }
    }

    archive.finalize();

    // Convert to Web Stream
    const webStream = Readable.toWeb(archive as any) as ReadableStream;

    return new Response(webStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="jotrack-${job.company}-${job.title.replace(/[^a-z0-9]/gi, "-")}-${Date.now()}.zip"`,
      },
    });
  } catch (error) {
    console.error("Job ZIP export failed:", error);
    return Response.json({ error: "Export failed" }, { status: 500 });
  }
}


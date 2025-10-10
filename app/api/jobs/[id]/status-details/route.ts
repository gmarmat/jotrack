import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { statusDetails } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { JobStatus } from "@/lib/status";

/**
 * GET /api/jobs/[id]/status-details?status=PHONE_SCREEN
 * Fetch details for a specific status
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;
  const status = req.nextUrl.searchParams.get("status") as JobStatus;

  if (!status) {
    return Response.json({ error: "status query param required" }, { status: 400 });
  }

  try {
    const detail = await db.query.statusDetails.findFirst({
      where: (sd, { eq, and }) =>
        and(eq(sd.jobId, jobId), eq(sd.status, status)) as any,
    });

    if (!detail) {
      // Return empty structure
      return Response.json({
        interviewerBlocks: [],
        aiBlob: null,
        keywordsAuto: [],
        keywordsManual: [],
        notes: "",
        notesHistory: [],
        aiRefreshedAt: null,
      });
    }

    // Parse JSON columns
    return Response.json({
      interviewerBlocks: JSON.parse(detail.interviewerBlocks || "[]"),
      aiBlob: detail.aiBlob,
      keywordsAuto: JSON.parse(detail.keywordsAuto || "[]"),
      keywordsManual: JSON.parse(detail.keywordsManual || "[]"),
      notes: detail.notes || "",
      notesHistory: JSON.parse(detail.notesHistory || "[]"),
      aiRefreshedAt: detail.aiRefreshedAt,
    });
  } catch (error) {
    console.error("Failed to fetch status details:", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST /api/jobs/[id]/status-details
 * Update status details (upsert)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;

  try {
    const body = await req.json();
    const { status, interviewerBlocks, aiBlob, keywordsAuto, keywordsManual, notes, notesHistory } = body;

    if (!status) {
      return Response.json({ error: "status required" }, { status: 400 });
    }

    const now = Date.now();

    // Check if exists
    const existing = await db.query.statusDetails.findFirst({
      where: (sd, { eq, and }) =>
        and(eq(sd.jobId, jobId), eq(sd.status, status)) as any,
    });

    if (existing) {
      // Update
      await db
        .update(statusDetails)
        .set({
          interviewerBlocks: JSON.stringify(interviewerBlocks || []),
          aiBlob: aiBlob || null,
          keywordsAuto: JSON.stringify(keywordsAuto || []),
          keywordsManual: JSON.stringify(keywordsManual || []),
          notes: notes || "",
          notesHistory: JSON.stringify(notesHistory || []),
          updatedAt: now,
          aiRefreshedAt: body.aiRefreshedAt || existing.aiRefreshedAt,
        })
        .where(
          and(
            eq(statusDetails.jobId, jobId),
            eq(statusDetails.status, status)
          )
        );
    } else {
      // Insert
      await db.insert(statusDetails).values({
        id: randomUUID(),
        jobId,
        status,
        interviewerBlocks: JSON.stringify(interviewerBlocks || []),
        aiBlob: aiBlob || null,
        keywordsAuto: JSON.stringify(keywordsAuto || []),
        keywordsManual: JSON.stringify(keywordsManual || []),
        notes: notes || "",
        notesHistory: JSON.stringify(notesHistory || []),
        updatedAt: now,
        aiRefreshedAt: body.aiRefreshedAt || null,
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to update status details:", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}


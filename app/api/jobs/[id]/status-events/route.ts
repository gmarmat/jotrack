import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { jobStatusEvents } from "@/db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";
import type { JobStatus } from "@/lib/status";

/**
 * GET /api/jobs/[id]/status-events
 * Fetch status entry/exit events for timeline delta calculation
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;

  try {
    const events = await db
      .select()
      .from(jobStatusEvents)
      .where(eq(jobStatusEvents.jobId, jobId))
      .orderBy(desc(jobStatusEvents.enteredAt));

    return Response.json({ events });
  } catch (error) {
    console.error("Failed to fetch status events:", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * Get current event (no leftAt set)
 */
export async function getCurrentEvent(jobId: string): Promise<any | null> {
  const events = await db
    .select()
    .from(jobStatusEvents)
    .where(and(eq(jobStatusEvents.jobId, jobId), isNull(jobStatusEvents.leftAt)))
    .limit(1);

  return events[0] || null;
}


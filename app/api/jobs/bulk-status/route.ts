import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { jobs, statusHistory } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { isJobStatus, type JobStatus } from "@/lib/status";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ids = Array.isArray(body?.ids) ? body.ids.map(String) : [];
    const nextStatus = String(body?.status ?? "");

    if (!ids.length || !isJobStatus(nextStatus)) {
      return NextResponse.json(
        { success: false, message: "Invalid payload" },
        { status: 400 }
      );
    }

    const now = Date.now();

    // Update jobs
    await db
      .update(jobs)
      .set({ status: nextStatus as JobStatus, updatedAt: now })
      .where(inArray(jobs.id, ids));

    // Append history rows
    const historyRows = ids.map((id: string) => ({
      id: uuidv4(),
      jobId: id,
      status: nextStatus as JobStatus,
      changedAt: now,
    }));
    await db.insert(statusHistory).values(historyRows);

    return NextResponse.json({ success: true, count: ids.length }, { status: 200 });
  } catch (error) {
    console.error("Error updating bulk status:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update statuses" },
      { status: 500 }
    );
  }
}


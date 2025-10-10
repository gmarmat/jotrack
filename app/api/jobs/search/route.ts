import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { jobs, attachments } from '@/db/schema';
import { sql, inArray, like, or, and, isNotNull, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const q = (sp.get("q") ?? "").trim();
    const statuses = (sp.get("statuses") ?? "").split(",").filter(Boolean);
    const has = (sp.get("has") ?? "").split(",").filter(Boolean);
    const sort = (sp.get("sort") ?? "recent") as "recent" | "created";

    // Build query conditions
    let query = db.select().from(jobs);
    const conditions: any[] = [];

    // Text search
    if (q) {
      conditions.push(
        or(
          like(jobs.title, `%${q}%`),
          like(jobs.notes, `%${q}%`)
        )
      );
    }

    // Status filter
    if (statuses.length > 0) {
      conditions.push(inArray(jobs.status, statuses as any));
    }

    // Has filters - check for attachments or notes
    if (has.includes("notes")) {
      conditions.push(
        and(
          isNotNull(jobs.notes),
          sql`LENGTH(TRIM(${jobs.notes})) > 0`
        )
      );
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Sorting
    if (sort === "created") {
      query = query.orderBy(desc(jobs.createdAt)) as any;
    } else {
      // Default: recent (by updated_at)
      query = query.orderBy(desc(jobs.updatedAt)) as any;
    }

    // Limit results
    query = query.limit(200) as any;

    const results = await query;

    // For "has" attachment filters, we need to filter in-memory
    // (Drizzle doesn't easily support EXISTS subqueries in this pattern)
    let filtered = results;
    if (has.some(h => h !== "notes")) {
      const jobIds = results.map(j => j.id);
      if (jobIds.length > 0) {
        const atts = await db
          .select({ jobId: attachments.jobId, kind: attachments.kind })
          .from(attachments)
          .where(
            and(
              inArray(attachments.jobId, jobIds),
              sql`${attachments.deletedAt} IS NULL`
            )
          );

        const jobHasKind = new Map<string, Set<string>>();
        atts.forEach(a => {
          if (!jobHasKind.has(a.jobId)) jobHasKind.set(a.jobId, new Set());
          jobHasKind.get(a.jobId)!.add(a.kind);
        });

        filtered = results.filter(job => {
          const kinds = jobHasKind.get(job.id) || new Set();
          return has.every(h => {
            if (h === "notes") return true; // Already filtered above
            return kinds.has(h);
          });
        });
      }
    }

    return NextResponse.json({ jobs: filtered });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ jobs: [] }, { status: 500 });
  }
}


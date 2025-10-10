import { NextRequest } from "next/server";
import { sqlite } from "@/db/client";

const DEFAULT_STALE_DAYS = 10;

/**
 * GET /api/settings/stale-threshold
 * Returns stale threshold in days
 */
export async function GET(_req: NextRequest) {
  try {
    const rows = sqlite
      .prepare(`SELECT value FROM app_settings WHERE key='stale_threshold'`)
      .all() as Array<{ value: string }>;

    const days = rows.length > 0 ? parseInt(rows[0].value) : DEFAULT_STALE_DAYS;

    return Response.json({ days });
  } catch (error) {
    console.error("Failed to get stale threshold:", error);
    return Response.json({ days: DEFAULT_STALE_DAYS });
  }
}

/**
 * POST /api/settings/stale-threshold
 * Update stale threshold
 */
export async function POST(req: NextRequest) {
  try {
    const { days } = await req.json();

    if (typeof days !== "number" || days < 1 || days > 365) {
      return Response.json(
        { error: "days must be between 1 and 365" },
        { status: 400 }
      );
    }

    // Upsert
    sqlite
      .prepare(
        `INSERT INTO app_settings (key, value) VALUES ('stale_threshold', ?)
         ON CONFLICT(key) DO UPDATE SET value=excluded.value`
      )
      .run(String(days));

    return Response.json({ ok: true, days });
  } catch (error) {
    console.error("Failed to update stale threshold:", error);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
}


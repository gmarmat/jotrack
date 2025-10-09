import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { DATA_DIR } from '@/lib/backup';
import { findMainDbFile } from '@/lib/dedup';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function safeCount(db: Database, table: string): number {
  try {
    const row = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get() as { c: number };
    return typeof row?.c === 'number' ? row.c : 0;
  } catch {
    return 0; // table may not exist
  }
}

export async function GET() {
  try {
    const dbPath = await findMainDbFile(DATA_DIR);
    if (!dbPath) {
      return NextResponse.json({ ok: false, error: 'db_not_found', now: Date.now() }, { status: 500 });
    }
    const db = new Database(dbPath, { readonly: true });
    const jobs = safeCount(db, 'jobs');
    const attachments = safeCount(db, 'attachments');
    db.close();

    return NextResponse.json({
      ok: true,
      jobs,
      attachments,
      now: Date.now(),
      env: process.env.NODE_ENV || 'development',
    });
  } catch (err) {
    console.error('GET /api/health error', err);
    return NextResponse.json({ ok: false, error: 'internal_error', now: Date.now() }, { status: 500 });
  }
}


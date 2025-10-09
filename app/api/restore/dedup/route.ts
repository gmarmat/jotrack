import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import Database from 'better-sqlite3';
import { BACKUPS_DIR, DATA_DIR } from '@/lib/backup';
import {
  selectJobs,
  detectDuplicates,
  detectOverlap,
  findMainDbFile,
} from '@/lib/dedup';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stagingId = searchParams.get('stagingId');
    if (!stagingId) {
      return NextResponse.json({ error: 'Missing stagingId' }, { status: 400 });
    }

    // Locate current DB
    const currentDbPath = await findMainDbFile(DATA_DIR);
    if (!currentDbPath) {
      return NextResponse.json({ error: 'Current DB not found' }, { status: 500 });
    }

    // Locate staged DB (under /data/backups/staging/<id>/)
    const stagingDir = path.join(BACKUPS_DIR, 'staging', stagingId);
    const stagedDbPath = await findMainDbFile(stagingDir);
    if (!stagedDbPath) {
      return NextResponse.json({ error: 'Staged DB not found' }, { status: 400 });
    }

    // Open both DBs, read jobs, then close
    const currDb = new Database(currentDbPath, { readonly: true });
    const stagedDb = new Database(stagedDbPath, { readonly: true });

    const currentJobs = selectJobs(currDb);
    const stagedJobs = selectJobs(stagedDb);

    currDb.close();
    stagedDb.close();

    const currentDup = detectDuplicates(currentJobs);
    const stagedDup = detectDuplicates(stagedJobs);
    const overlap = detectOverlap(currentJobs, stagedJobs);

    // Trim samples to keep payload small
    const trimGroups = (g: any[], n = 10) => g.slice(0, n);
    const trimMatches = (m: any[], n = 20) => m.slice(0, n);

    return NextResponse.json({
      stagingId,
      current: { count: currentDup.count, groups: trimGroups(currentDup.groups) },
      staged: { count: stagedDup.count, groups: trimGroups(stagedDup.groups) },
      overlap: { count: overlap.count, matches: trimMatches(overlap.matches) },
    });
  } catch (err) {
    console.error('GET /api/restore/dedup error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}


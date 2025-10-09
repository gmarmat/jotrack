import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import path from 'path';
import Database from 'better-sqlite3';
import { promises as fs } from 'fs';
import { DATA_DIR, BACKUPS_DIR } from '@/lib/backup';
import { createBackupZip, timestampName } from '@/lib/backup';
import { findMainDbFile, selectJobs, normalizeText, normalizeUrl } from '@/lib/dedup';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const Body = z.object({
  stagingId: z.string().min(1),
  strategy: z.enum(['skip-duplicates', 'import-all']).default('skip-duplicates'),
  attachmentsMode: z.enum(['merge', 'replace']).default('merge'),
});

type JobRow = Record<string, any>;

function fingerprint(row: JobRow): string {
  const company = row.company ?? row.org ?? '';
  const title = row.title ?? row.role ?? row.position ?? '';
  const url = row.url ?? row.link ?? row.application_url ?? '';
  return `${normalizeText(company)}|${normalizeText(title)}|${normalizeUrl(url)}`;
}

function intersectCols(a: string[], b: string[]) {
  const A = new Set(a.map((x) => x.toLowerCase()));
  return b.filter((x) => A.has(x.toLowerCase()));
}

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { stagingId, strategy, attachmentsMode } = parsed.data;

    // Resolve paths
    const currentDbPath = await findMainDbFile(DATA_DIR);
    if (!currentDbPath) return NextResponse.json({ error: 'Current DB not found' }, { status: 500 });

    const stagingDir = path.join(BACKUPS_DIR, 'staging', stagingId);
    const stagedDbPath = await findMainDbFile(stagingDir);
    if (!stagedDbPath) return NextResponse.json({ error: 'Staged DB not found' }, { status: 400 });

    // 0) Autosave BEFORE any changes
    const autosaveName = `jotrack-autosave-before-ui-restore-${timestampName()}.zip`;
    const autosavePath = path.join(BACKUPS_DIR, autosaveName);
    const { size: autosaveSize } = await createBackupZip(autosavePath);

    // 1) Open DBs
    const curr = new Database(currentDbPath);
    const staged = new Database(stagedDbPath, { readonly: true });

    // 2) Read rows
    const currentRows = selectJobs(curr);
    const stagedRows = selectJobs(staged);

    // 3) Prepare duplicate set (fingerprints of current)
    const currentFp = new Set<string>(currentRows.map(fingerprint));

    // 4) Columns intersection for INSERT
    const currColsStmt = curr.prepare(`PRAGMA table_info(jobs)`).all() as { name: string }[];
    const stagedColsStmt = staged.prepare(`PRAGMA table_info(jobs)`).all() as { name: string }[];
    const currCols = currColsStmt.map(c => c.name);
    const stagedCols = stagedColsStmt.map(c => c.name);
    const cols = intersectCols(currCols, stagedCols);
    if (cols.length === 0) {
      curr.close(); staged.close();
      return NextResponse.json({ error: 'No compatible columns between current and staged jobs tables' }, { status: 400 });
    }

    const placeholders = cols.map(() => '?').join(',');
    const insertSql = `INSERT INTO jobs (${cols.join(',')}) VALUES (${placeholders})`;
    const insertStmt = curr.prepare(insertSql);

    // 5) Transactionally insert
    let attempted = 0;
    let inserted = 0;
    let skippedDuplicates = 0;

    const toRowValues = (row: any) => cols.map((c) => row[c]);

    const tx = curr.transaction((rows: any[]) => {
      for (const r of rows) {
        attempted++;
        const fp = fingerprint(r);
        if (strategy === 'skip-duplicates' && currentFp.has(fp)) {
          skippedDuplicates++;
          continue;
        }
        try {
          insertStmt.run(...toRowValues(r));
          inserted++;
          // track newly inserted to avoid intra-batch dupes (rare)
          if (strategy === 'skip-duplicates') currentFp.add(fp);
        } catch {
          // Ignore row-level errors (e.g., PK conflict) and continue
          skippedDuplicates++;
        }
      }
    });
    tx(stagedRows);

    // 6) Attachments copy
    const srcAtt = path.join(stagingDir, 'attachments');
    const destAtt = path.join(DATA_DIR, 'attachments');
    let attachmentsCopied = false;
    if (await fs.stat(srcAtt).then(() => true).catch(() => false)) {
      if (attachmentsMode === 'replace') {
        await fs.rm(destAtt, { recursive: true, force: true }).catch(() => {});
      }
      await fs.mkdir(path.dirname(destAtt), { recursive: true });
      // Node 22 supports recursive copy
      await fs.cp(srcAtt, destAtt, { recursive: true, force: true });
      attachmentsCopied = true;
    }

    curr.close();
    staged.close();

    const result = {
      stagingId,
      strategy,
      attachmentsMode,
      attempted,
      inserted,
      skippedDuplicates,
      autosavePath,
      autosaveSize,
      attachmentsCopied,
      dataDir: DATA_DIR,
    };
    return NextResponse.json(result);
  } catch (err) {
    console.error('POST /api/restore/apply-ui error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}


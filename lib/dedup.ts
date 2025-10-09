import Database from 'better-sqlite3';
import path from 'path';
import { promises as fs } from 'fs';

export type JobRow = Record<string, any>;

export function normalizeText(s: unknown): string {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\._\-\/: ]+/g, ''); // keep letters, numbers, basic symbols
}

export function normalizeUrl(u: unknown): string {
  const raw = normalizeText(u);
  if (!raw) return '';
  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`);
    // drop query + hash; keep host + pathname
    const host = url.host.toLowerCase();
    const path = url.pathname.replace(/\/+$/, '');
    return `${host}${path}`;
  } catch {
    return raw; // fallback to normalized text
  }
}

export function fingerprint(row: JobRow): string {
  const company = row.company ?? row.org ?? '';
  const title = row.title ?? row.role ?? row.position ?? '';
  const url = row.url ?? row.link ?? row.application_url ?? '';
  return `${normalizeText(company)}|${normalizeText(title)}|${normalizeUrl(url)}`;
}

export function listColumns(db: Database.Database, table: string): string[] {
  const stmt = db.prepare(`PRAGMA table_info(${table})`);
  const cols = stmt.all() as { name: string }[];
  return cols.map((c) => c.name);
}

export function selectJobs(db: Database.Database): JobRow[] {
  const cols = listColumns(db, 'jobs');
  if (!cols.length) return [];
  // Read all rows; we'll pick fields dynamically
  const rows = db.prepare(`SELECT * FROM jobs`).all() as JobRow[];
  return rows.map((r) => {
    const pick = (k: string) => (k in r ? r[k] : undefined);
    return {
      id: pick('id'),
      title: pick('title') ?? pick('role') ?? pick('position'),
      company: pick('company') ?? pick('org'),
      url: pick('url') ?? pick('link') ?? pick('application_url'),
      location: pick('location') ?? pick('city'),
    };
  });
}

export function detectDuplicates(rows: JobRow[]) {
  const map = new Map<string, JobRow[]>();
  for (const r of rows) {
    const fp = fingerprint(r);
    if (!map.has(fp)) map.set(fp, []);
    map.get(fp)!.push(r);
  }
  const groups = Array.from(map.entries())
    .filter(([, arr]) => arr.length > 1)
    .map(([fp, arr]) => ({ fp, count: arr.length, ids: arr.map(x => x.id).filter(Boolean) }))
    .sort((a, b) => b.count - a.count);
  return {
    count: groups.reduce((n, g) => n + (g.count - 1), 0), // number of extra items beyond the first
    groups,
  };
}

export function detectOverlap(curr: JobRow[], staged: JobRow[]) {
  const toFp = (r: JobRow) => fingerprint(r);
  const currIndex = new Map<string, JobRow[]>();
  for (const r of curr) {
    const fp = toFp(r);
    if (!currIndex.has(fp)) currIndex.set(fp, []);
    currIndex.get(fp)!.push(r);
  }
  const matches: { fp: string; currentIds: any[]; stagedIds: any[] }[] = [];
  const seen = new Set<string>();
  for (const s of staged) {
    const fp = toFp(s);
    if (currIndex.has(fp) && !seen.has(fp)) {
      seen.add(fp);
      matches.push({
        fp,
        currentIds: currIndex.get(fp)!.map(r => r.id).filter(Boolean),
        stagedIds: staged.filter(x => toFp(x) === fp).map(r => r.id).filter(Boolean),
      });
    }
  }
  return { count: matches.length, matches };
}

export async function findMainDbFile(dir: string): Promise<string | null> {
  const entries = await fs.readdir(dir).catch(() => []);
  // Prefer *.db, then *.sqlite, ignore -wal/-shm here
  const mainDb = entries.find(e => /\.(db|sqlite)$/i.test(e) && !/\-(wal|shm)$/i.test(e));
  return mainDb ? path.join(dir, mainDb) : null;
}


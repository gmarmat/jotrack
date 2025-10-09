import { promises as fs } from 'fs';
import fssync from 'fs';
import path from 'path';
import archiver from 'archiver';

export const DATA_DIR = path.join(process.cwd(), 'data');
export const ATTACHMENTS_DIR = path.join(DATA_DIR, 'attachments');
export const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

export function timestampName(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const name = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return name;
}

export async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

export async function listDbFiles(): Promise<string[]> {
  try {
    const entries = await fs.readdir(DATA_DIR);
    // Include sqlite DB and its -wal/-shm files
    return entries
      .filter((e) => /\.(sqlite|db)$/.test(e) || /(\.sqlite|\.db)\-(wal|shm)$/.test(e) || /(sqlite|db)\-(wal|shm)$/.test(e))
      .map((e) => path.join(DATA_DIR, e));
  } catch {
    return [];
  }
}

export async function pathExists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}

export async function createBackupZip(toDiskPath: string): Promise<{ zipPath: string; size: number; }> {
  await ensureDir(BACKUPS_DIR);

  const output = fssync.createWriteStream(toDiskPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  // pipe archive data to the file
  archive.pipe(output);

  // Add DB files at root of zip (relative to /data)
  const dbFiles = await listDbFiles();
  for (const abs of dbFiles) {
    const rel = path.relative(DATA_DIR, abs);
    archive.file(abs, { name: rel });
  }

  // Add attachments folder (if exists)
  if (await pathExists(ATTACHMENTS_DIR)) {
    archive.directory(ATTACHMENTS_DIR, 'attachments');
  }

  await archive.finalize();

  // Wait for stream finish
  await new Promise<void>((resolve, reject) => {
    output.on('close', () => resolve());
    output.on('error', (e) => reject(e));
  });

  const stat = await fs.stat(toDiskPath);
  return { zipPath: toDiskPath, size: stat.size };
}


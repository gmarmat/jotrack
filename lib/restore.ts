import { promises as fs } from 'fs';
import path from 'path';
import extract from 'extract-zip';
import { BACKUPS_DIR, DATA_DIR, ATTACHMENTS_DIR, ensureDir, timestampName } from '@/lib/backup';

export type RestorePlan = {
  stagingId: string;
  zipSavedPath: string;
  stagingPath: string;
  dbFiles: { src: string; dest: string }[]; // dest is under ./data/<basename>
  attachments: { srcDir: string; destDir: string } | null; // destDir = ./data/attachments
};

export async function saveUploadZip(file: File): Promise<{ savedPath: string; name: string }> {
  const id = timestampName();
  const uploadsDir = path.join(BACKUPS_DIR, 'uploads');
  await ensureDir(uploadsDir);
  const name = `jotrack-restore-${id}.zip`;
  const savedPath = path.join(uploadsDir, name);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(savedPath, buf);
  return { savedPath, name };
}

export async function extractToStaging(zipPath: string): Promise<{ stagingId: string; stagingPath: string }> {
  const id = timestampName();
  const stagingPath = path.join(BACKUPS_DIR, 'staging', id);
  await ensureDir(stagingPath);
  await extract(zipPath, { dir: stagingPath });
  return { stagingId: id, stagingPath };
}

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      await walk(p, out);
    } else {
      out.push(p);
    }
  }
  return out;
}

function isDbFile(base: string): boolean {
  return (
    /\.sqlite$/i.test(base) ||
    /\.db$/i.test(base) ||
    /\.sqlite\-(wal|shm)$/i.test(base) ||
    /\.db\-(wal|shm)$/i.test(base)
  );
}

async function findAttachmentsDir(root: string): Promise<string | null> {
  // Find a folder literally named "attachments" anywhere under root.
  const parts = root.split(path.sep);
  if (parts[parts.length - 1].toLowerCase() === 'attachments') return root;
  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      const p = path.join(root, e.name);
      if (e.name.toLowerCase() === 'attachments') return p;
      const nested = await findAttachmentsDir(p);
      if (nested) return nested;
    }
  }
  return null;
}

export async function buildRestorePlan(stagingPath: string): Promise<RestorePlan> {
  const files = await walk(stagingPath);
  const dbFilesAbs = files.filter((p) => isDbFile(path.basename(p)));
  const dbFiles = dbFilesAbs.map((abs) => ({
    src: abs,
    dest: path.join(DATA_DIR, path.basename(abs)),
  }));

  const attachmentsSrc = await findAttachmentsDir(stagingPath);
  const attachments = attachmentsSrc
    ? { srcDir: attachmentsSrc, destDir: ATTACHMENTS_DIR }
    : null;

  // Persist PLAN.json
  const stagingId = path.basename(stagingPath);
  const plan: RestorePlan = {
    stagingId,
    zipSavedPath: '', // filled by route
    stagingPath,
    dbFiles,
    attachments,
  };
  return plan;
}

export async function savePlan(stagingPath: string, plan: RestorePlan & { zipSavedPath: string }) {
  const planPath = path.join(stagingPath, 'PLAN.json');
  await fs.writeFile(planPath, JSON.stringify(plan, null, 2), 'utf8');
}


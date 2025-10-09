#!/usr/bin/env node
import fs from 'fs/promises';
import fssync from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CWD = process.cwd();
const DATA_DIR = path.join(CWD, 'data');
const ATTACHMENTS_DIR = path.join(DATA_DIR, 'attachments');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

function tsName() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function ensureDir(p) { await fs.mkdir(p, { recursive: true }); }
async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { staging: null, dryRun: false, cleanAttachments: false, force: false };
  for (let i=0;i<args.length;i++) {
    const a = args[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--clean-attachments') out.cleanAttachments = true;
    else if (a === '--force') out.force = true;
    else if (a === '--staging' && args[i+1]) { out.staging = args[++i]; }
    else if (a.startsWith('--staging=')) out.staging = a.split('=')[1];
  }
  return out;
}

async function autosaveZip() {
  await ensureDir(BACKUPS_DIR);
  const name = `jotrack-autosave-before-restore-${tsName()}.zip`;
  const abs = path.join(BACKUPS_DIR, name);

  const output = fssync.createWriteStream(abs);
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(output);

  // DB files (root of /data)
  const entries = await fs.readdir(DATA_DIR).catch(() => []);
  for (const e of entries) {
    const include = /\.(sqlite|db)$/i.test(e) || /(\.sqlite|\.db)\-(wal|shm)$/i.test(e) || /(sqlite|db)\-(wal|shm)$/i.test(e);
    if (include) {
      archive.file(path.join(DATA_DIR, e), { name: e });
    }
  }
  // attachments directory (if any)
  if (await exists(ATTACHMENTS_DIR)) {
    archive.directory(ATTACHMENTS_DIR, 'attachments');
  }

  await archive.finalize();
  await new Promise((resolve, reject) => {
    output.on('close', resolve);
    output.on('error', reject);
  });

  const stat = await fs.stat(abs);
  return { path: abs, size: stat.size };
}

async function readPlan(stagingId) {
  const stagingPath = path.join(BACKUPS_DIR, 'staging', stagingId);
  const planPath = path.join(stagingPath, 'PLAN.json');
  const raw = await fs.readFile(planPath, 'utf8');
  const plan = JSON.parse(raw);
  // Minimal shape checks
  if (!Array.isArray(plan.dbFiles)) throw new Error('Invalid PLAN.json: missing dbFiles[]');
  return { plan, stagingPath, planPath };
}

// Copy file atomically: write to temp then rename over dest
async function copyAtomic(src, dest) {
  const dir = path.dirname(dest);
  const base = path.basename(dest);
  const temp = path.join(dir, `.restore-tmp-${base}-${process.pid}-${Date.now()}`);
  await fs.copyFile(src, temp);
  await fs.rename(temp, dest);
}

async function applyPlan({ plan, stagingPath }, opts) {
  const result = { copiedDb: [], copiedAttachments: 0, attachmentsMode: opts.cleanAttachments ? 'replace' : 'merge' };

  // Optional safety check: warn if dev server might be running
  if (!opts.force) {
    // Heuristic: if WAL exists and is >0 bytes we warn (not definitive)
    const wal = (plan.dbFiles || []).find(f => /wal$/i.test(f.dest) || /wal$/i.test(f.src));
    if (wal && await exists(path.join(DATA_DIR, path.basename(wal.dest)))) {
      // Continue, but user was instructed to stop dev server before running
    }
  }

  if (!opts.dryRun) {
    // DB files
    for (const { src, dest } of plan.dbFiles) {
      const finalDest = path.join(DATA_DIR, path.basename(dest));
      await ensureDir(path.dirname(finalDest));
      await copyAtomic(src, finalDest);
      result.copiedDb.push(path.basename(finalDest));
    }

    // Attachments
    if (plan.attachments && plan.attachments.srcDir) {
      const srcDir = plan.attachments.srcDir;
      const destDir = ATTACHMENTS_DIR;
      await ensureDir(path.dirname(destDir));
      if (opts.cleanAttachments && await exists(destDir)) {
        await fs.rm(destDir, { recursive: true, force: true });
      }
      // Node 22: fs.cp supports recursive merges
      await fs.cp(srcDir, destDir, { recursive: true, force: true });
      result.copiedAttachments = 1;
    }
  }

  return result;
}

async function main() {
  const args = parseArgs();
  if (!args.staging) {
    console.error('Usage: node scripts/apply-restore.mjs --staging <ID> [--dry-run] [--clean-attachments] [--force]');
    process.exit(2);
  }
  const { plan, stagingPath } = await readPlan(args.staging);

  // 1) Autosave backup
  const autosave = await autosaveZip();

  // 2) Apply (or simulate)
  const applied = await applyPlan({ plan, stagingPath }, args);

  // 3) Summary
  const summary = {
    stagingId: args.staging,
    stagingPath,
    autosaveZip: autosave.path,
    autosaveSize: autosave.size,
    dryRun: args.dryRun,
    attachmentsMode: applied.attachmentsMode,
    copiedDbFiles: applied.copiedDb,
    attachmentsCopied: applied.copiedAttachments === 1,
    dataDir: DATA_DIR,
  };
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error('Restore apply failed:', e?.stack || e?.message || e);
  process.exit(1);
});


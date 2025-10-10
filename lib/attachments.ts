import { promises as fs } from 'fs';
import path from 'path';

export const ATTACHMENTS_ROOT = path.join(process.cwd(), 'data', 'attachments');

// Configurable limits (in MB)
export const MAX_FILE_MB = parseInt(process.env.JOTRACK_MAX_FILE_MB || '20', 10);
export const MAX_PER_JOB_MB = parseInt(process.env.JOTRACK_MAX_PER_JOB_MB || '200', 10);
export const MAX_GLOBAL_MB = parseInt(process.env.JOTRACK_MAX_GLOBAL_MB || '1024', 10);

// Convert to bytes
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
export const MAX_PER_JOB_BYTES = MAX_PER_JOB_MB * 1024 * 1024;
export const MAX_GLOBAL_BYTES = MAX_GLOBAL_MB * 1024 * 1024;

export function sanitizeFilename(name: string): string {
  // allow [a-zA-Z0-9._-], replace others with '_'
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function ensureJobDir(jobId: string): Promise<string> {
  const dir = path.join(ATTACHMENTS_ROOT, jobId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function relativeAttachmentPath(jobId: string, filename: string): string {
  return path.join(jobId, filename);
}

export function inferExtFromType(type: string | null | undefined): string | null {
  if (!type) return null;
  const map: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'text/plain': 'txt',
    'text/markdown': 'md',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/rtf': 'rtf',
    'text/rtf': 'rtf',
  };
  return map[type] ?? null;
}

export function isAllowedExtension(ext: string): boolean {
  const allowed = new Set(['pdf', 'doc', 'docx', 'txt', 'md', 'rtf', 'png', 'jpg', 'jpeg', 'webp']);
  return allowed.has(ext.toLowerCase());
}


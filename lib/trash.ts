import path from 'path';

export const TRASH_ROOT = path.join(process.cwd(), 'data', '.trash');

interface TrashEntry {
  trashPath: string;
  originalPath: string;
  expiresAt: number;
}

// In-memory map for undo tokens (ephemeral, lost on restart)
const undoMap = new Map<string, TrashEntry>();

export function registerUndo(attachmentId: string, trashPath: string, originalPath: string): void {
  const expiresAt = Date.now() + 10000; // 10 seconds
  undoMap.set(attachmentId, { trashPath, originalPath, expiresAt });
  
  // Auto-cleanup after expiry
  setTimeout(() => {
    undoMap.delete(attachmentId);
  }, 10000);
}

export function getUndoEntry(attachmentId: string): TrashEntry | null {
  const entry = undoMap.get(attachmentId);
  if (!entry) return null;
  
  if (Date.now() > entry.expiresAt) {
    undoMap.delete(attachmentId);
    return null;
  }
  
  return entry;
}

export function clearUndo(attachmentId: string): void {
  undoMap.delete(attachmentId);
}


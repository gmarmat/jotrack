export const ACCEPT_EXTS = ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'] as const;

export const MIME_MAP: Record<string, string[]> = {
  pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  txt: ['text/plain'],
  md: ['text/markdown', 'text/x-markdown'],
  rtf: ['application/rtf', 'text/rtf'],
};

export function isAllowed(mime: string, ext: string): boolean {
  const normalizedExt = ext.toLowerCase().replace(/^\./, '');
  if (!ACCEPT_EXTS.includes(normalizedExt as any)) {
    return false;
  }
  // If mime is provided, check if it matches the extension
  if (mime && MIME_MAP[normalizedExt]) {
    return MIME_MAP[normalizedExt].some(m => mime.includes(m) || m.includes(mime));
  }
  return true;
}

export function isPreviewable(extOrMime: string): boolean {
  const lower = extOrMime.toLowerCase();
  return lower.includes('pdf') || lower.includes('txt') || lower.includes('text/plain') || lower.includes('markdown') || lower.endsWith('.md');
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


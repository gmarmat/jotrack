export const ACCEPT_EXTS = ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf', 'png', 'jpg', 'jpeg', 'webp'] as const;

export const MIME_MAP: Record<string, string[]> = {
  pdf: ['application/pdf'],
  doc: ['application/msword', 'application/vnd.ms-word'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  txt: ['text/plain'],
  md: ['text/markdown', 'text/x-markdown'],
  rtf: ['application/rtf', 'text/rtf'],
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  webp: ['image/webp'],
};

export function isAllowed(mime: string, ext: string): boolean {
  const normalizedExt = ext.toLowerCase().replace(/^\./, '');
  
  // First check if extension is in whitelist
  if (!ACCEPT_EXTS.includes(normalizedExt as any)) {
    return false;
  }
  
  // If mime is provided and we have a MIME map, do a lenient check
  // But if MIME doesn't match, still allow based on extension (browsers can send wrong/empty MIMEs)
  if (mime && MIME_MAP[normalizedExt]) {
    const matches = MIME_MAP[normalizedExt].some(m => mime.includes(m) || m.includes(mime));
    if (matches) return true;
    // Even if MIME doesn't match, trust the extension if it's whitelisted
    // This handles cases where browsers send empty or incorrect MIME types
    console.warn(`MIME mismatch for .${normalizedExt}: got "${mime}", allowing based on extension`);
  }
  
  return true;
}

export function isPreviewable(filename: string, size?: number): boolean {
  const ext = filename.toLowerCase().split('.').pop() || '';
  const sizeOk = !size || size <= 10 * 1024 * 1024; // 10MB limit for docx/rtf
  
  if (['pdf', 'png', 'jpg', 'jpeg', 'webp', 'txt', 'md'].includes(ext)) {
    return true;
  }
  if (['docx', 'rtf'].includes(ext) && sizeOk) {
    return true;
  }
  return false;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


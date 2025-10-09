/**
 * MIME type mapping for supported file extensions
 */

export const EXT_TO_MIME: Record<string, string> = {
  // Documents
  pdf: 'application/pdf',
  txt: 'text/plain',
  md: 'text/markdown',
  
  // Images
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  
  // Office formats
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  rtf: 'application/rtf',
};

/**
 * Get MIME type from file extension
 */
export function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return 'application/octet-stream';
  return EXT_TO_MIME[ext] || 'application/octet-stream';
}

/**
 * Check if a file type is previewable in browser
 */
export function isPreviewable(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return false;
  return ['pdf', 'txt', 'md', 'png', 'jpg', 'jpeg', 'webp', 'docx'].includes(ext);
}


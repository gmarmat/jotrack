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

/**
 * Extract file extension from filename
 */
export function extOf(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Unified preview detection with size check
 */
export function canPreview({ ext, mime, size }: { ext?: string; mime?: string; size?: number }): boolean {
  const MAX_DOCX_SIZE = 10 * 1024 * 1024; // 10MB
  
  // Get extension from mime if not provided
  const fileExt = ext?.toLowerCase() || '';
  
  // Check if type is previewable
  const previewableExts = ['pdf', 'txt', 'md', 'png', 'jpg', 'jpeg', 'webp', 'docx'];
  const isSupported = previewableExts.includes(fileExt) || 
    (mime && (
      mime.startsWith('image/') ||
      mime === 'application/pdf' ||
      mime === 'text/plain' ||
      mime === 'text/markdown' ||
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ));
  
  if (!isSupported) return false;
  
  // For DOCX, check size limit
  if (fileExt === 'docx' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    if (size && size > MAX_DOCX_SIZE) return false;
  }
  
  return true;
}


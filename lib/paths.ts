import path from 'path';

/**
 * Safely resolve a relative path against a base directory
 * and ensure the result stays within the base directory.
 */
export function safeResolve(base: string, relativePath: string): { safe: boolean; resolved: string } {
  // Normalize base directory
  const normalizedBase = path.resolve(base);
  
  // Resolve the relative path against the base
  const resolved = path.resolve(normalizedBase, relativePath);
  
  // Check if the resolved path is within the base directory
  const safe = isInside(normalizedBase, resolved);
  
  return { safe, resolved };
}

/**
 * Check if a target path is inside a base directory
 */
export function isInside(base: string, target: string): boolean {
  const normalizedBase = path.resolve(base);
  const normalizedTarget = path.resolve(target);
  
  // Ensure target starts with base (must have separator or be exact match)
  const baseSep = normalizedBase.endsWith(path.sep) ? normalizedBase : normalizedBase + path.sep;
  return normalizedTarget.startsWith(baseSep) || normalizedTarget === normalizedBase;
}


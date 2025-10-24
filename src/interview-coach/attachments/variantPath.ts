let _warnedOnce = false;

export function getNormalizedPathFromVersion(v: any): string | undefined {
  const va = v?.variants || {};
  return (
    va?.normalized?.path ??
    va?.ai_optimized?.path ??
    va?.normalized_txt?.path ??
    Object.values(va).find((x: any) =>
      x && typeof x.path === 'string' && /norm|ai|opt/i.test(x.path)
    )?.path
  );
}

export function warnIfNoNormalized(v: any, label: string) {
  if (_warnedOnce) return;
  if (!getNormalizedPathFromVersion(v)) {
    _warnedOnce = true;
    console.warn(`[ATT] No normalized path for ${label}. variant keys:`, Object.keys(v?.variants || {}));
  }
}

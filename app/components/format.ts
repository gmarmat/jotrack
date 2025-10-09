export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return `${n}`;
  const units = ['B','KB','MB','GB'];
  let i = 0, v = n;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const abs = Math.abs(diff);
  const secs = Math.round(abs / 1000);
  const mins = Math.round(secs / 60);
  const hours = Math.round(mins / 60);
  const days = Math.round(hours / 24);
  const fmt = (v: number, s: string) => `${v} ${s}${v===1?'':'s'} ${diff>=0?'ago':'from now'}`;
  if (secs < 60) return fmt(secs, 'sec');
  if (mins < 60) return fmt(mins, 'min');
  if (hours < 24) return fmt(hours, 'hour');
  return fmt(days, 'day');
}


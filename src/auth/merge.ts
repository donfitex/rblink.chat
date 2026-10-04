// Pure helpers (no imports) so they can be unit-tested directly by Node.
export const SYNC_KEYS = ['rblink_workspace', 'rblink_users', 'rblink_channels', 'rblink_dms', 'rblink_messages'];

// Union by id; items from `a` win. Used when two people changed the workspace at the same time.
export function union(a: any[], b: any[]): any[] {
  const ids = new Set(a.map((x) => x.id));
  return [...a, ...b.filter((x) => !ids.has(x.id))];
}

const byTime = (x: any, y: any) => String(x.timestamp).localeCompare(String(y.timestamp));

export function mergeSnapshots(local: Record<string, string | null>, remote: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of SYNC_KEYS) {
    const l = local[k], r = remote[k];
    if (!r) { if (l) out[k] = l; continue; }
    if (!l) { out[k] = r; continue; }
    try {
      const lv = JSON.parse(l), rv = JSON.parse(r);
      if (k === 'rblink_messages') {
        const m: Record<string, any[]> = { ...rv };
        for (const t of Object.keys(lv)) m[t] = union(lv[t], rv[t] || []).sort(byTime);
        out[k] = JSON.stringify(m);
      } else if (Array.isArray(lv) && Array.isArray(rv)) out[k] = JSON.stringify(union(lv, rv));
      else out[k] = l;
    } catch { out[k] = l; }
  }
  return out;
}

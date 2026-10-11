// Optional free cloud storage via Supabase (REST only, no extra packages).
// Set SUPABASE_URL and SUPABASE_SERVICE_KEY to keep the database snapshot and uploads in Supabase,
// so the app host can be a free stateless server. Without them everything stays on local disk.
const URL_ = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const KEY = process.env.SUPABASE_SERVICE_KEY || '';
const BUCKET = process.env.SUPABASE_BUCKET || 'rblink-uploads';
export const remote = !!(URL_ && KEY);
export const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif', '.heic': 'image/heic', '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.pdf': 'application/pdf', '.txt': 'text/plain' };

// New-style "sb_secret_..." keys go in apikey only; classic JWT keys are also sent as a Bearer token.
const H = (extra = {}) => ({ apikey: KEY, ...(KEY.startsWith('sb_') ? {} : { Authorization: 'Bearer ' + KEY }), ...extra });
const fail = async (what, r) => { throw new Error(`${what}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`); };

export async function loadRemote() {
  const r = await fetch(`${URL_}/rest/v1/rblink_kv?id=eq.db&select=data`, { headers: H() });
  if (!r.ok) await fail('Supabase read failed', r);
  const rows = await r.json();
  return rows[0] ? rows[0].data : null;
}
export async function pingRemote() {
  const r = await fetch(`${URL_}/rest/v1/rblink_kv?id=eq.db&select=id`, { headers: H() });
  if (!r.ok) await fail('Supabase ping failed', r);
}
export async function saveRemote(db) {
  const r = await fetch(`${URL_}/rest/v1/rblink_kv?on_conflict=id`, {
    method: 'POST',
    headers: H({ 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify([{ id: 'db', data: db, updated_at: new Date().toISOString() }])
  });
  if (!r.ok) await fail('Supabase save failed', r);
}
export async function putFile(name, buf, type) {
  const r = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${encodeURIComponent(name)}`, {
    method: 'POST',
    headers: H({ 'Content-Type': type || 'application/octet-stream', 'x-upsert': 'true' }),
    body: buf
  });
  if (!r.ok) await fail('Supabase upload failed', r);
}
export const publicUrl = (name) => `${URL_}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(name)}`;

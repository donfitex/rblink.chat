import { SYNC_KEYS, mergeSnapshots } from './merge';
import { initialUsers, initialChannels } from '../data/initialData';

let rev = 0, dirty = false, suppress = false, timer: any, poller: any, last = '', onRemote: () => void = () => {}, patched = false;
const api = (m: string, p: string, b?: unknown) =>
  fetch(p, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined });
const local = () => Object.fromEntries(SYNC_KEYS.map((k) => [k, localStorage.getItem(k)]));
const snapshot = () => JSON.stringify(local());
function writeLocal(data: Record<string, string>) {
  suppress = true;
  try { for (const k of SYNC_KEYS) if (typeof data[k] === 'string') localStorage.setItem(k, data[k]); } finally { suppress = false; }
  last = snapshot();
}
const schedule = (ms = 800) => { clearTimeout(timer); timer = setTimeout(push, ms); };

async function push() {
  if (!dirty) return;
  const snap = snapshot();
  if (snap === last) { dirty = false; return; }
  dirty = false;
  try {
    const data = Object.fromEntries(Object.entries(local()).filter(([, v]) => v !== null));
    const r = await api('PUT', '/api/sync', { baseRev: rev, data });
    if (r.ok) { rev = (await r.json()).rev; last = snap; }
    else if (r.status === 409) { // someone else saved first: merge their changes with ours, then save again
      const j = await r.json();
      writeLocal(mergeSnapshots(local(), j.data)); rev = j.rev; last = ''; dirty = true; onRemote(); schedule();
    } else { dirty = true; schedule(5000); }
  } catch { dirty = true; schedule(5000); }
}

async function poll() {
  if (dirty) return;
  try {
    const { rev: r } = await (await api('GET', '/api/sync/rev')).json();
    if (r > rev) {
      const s = await (await api('GET', '/api/sync')).json();
      if (dirty) return;
      writeLocal(s.data); rev = s.rev; onRemote();
    }
  } catch { /* offline: try again next tick */ }
}

export async function startSync(remount: () => void) {
  onRemote = remount;
  if (!patched) {
    patched = true;
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k: string, v: string) {
      orig.call(this, k, v);
      if (!suppress && this === window.localStorage && SYNC_KEYS.includes(k)) { dirty = true; schedule(); }
    };
  }
  const s = await (await api('GET', '/api/sync')).json();
  rev = s.rev;
  if (s.rev > 0) writeLocal(s.data); // the server copy is the truth
  clearInterval(poller); poller = setInterval(poll, 3000);
}

export function pauseSync() { clearInterval(poller); }

export function stopSync() {
  clearInterval(poller); clearTimeout(timer);
  Object.keys(localStorage).filter((k) => k.startsWith('rblink_')).forEach((k) => localStorage.removeItem(k));
}

// Make sure the logged-in account exists as a workspace member and is the active user.
export function ensureUser(me: { id: string; name: string; email: string; avatar: string; role: string }) {
  const users: any[] = JSON.parse(localStorage.getItem('rblink_users') || 'null') || [...initialUsers];
  if (!users.some((u) => u.id === me.id)) {
    const base = me.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'user';
    const now = new Date().toISOString();
    users.push({
      id: me.id, name: me.name, email: me.email,
      username: users.some((u) => u.username === base) ? `${base}.${me.id.slice(-4)}` : base,
      avatar: me.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(me.name)}`,
      role: me.role === 'owner' ? 'owner' : 'member', presence: 'online', joinedAt: now, lastActive: now
    });
    localStorage.setItem('rblink_users', JSON.stringify(users));
    const chs: any[] = JSON.parse(localStorage.getItem('rblink_channels') || 'null') || [...initialChannels];
    localStorage.setItem('rblink_channels', JSON.stringify(chs.map((c) => (c.isPrivate || c.memberIds.includes(me.id) ? c : { ...c, memberIds: [...c.memberIds, me.id] }))));
  }
  localStorage.setItem('rblink_active_user', me.id);
}

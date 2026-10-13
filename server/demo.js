// Removes the sample people, groups and messages that shipped with the original template.
// Works on the shared chat snapshot ({ rblink_users: "json", rblink_channels: "json", ... }). Returns true if anything changed.
const U = new Set(['u1', 'u2', 'u3', 'u4', 'u5', 'u6']);
const CH = new Set(['c_announcements', 'c_engineering', 'c_design_system', 'c_random', 'c_internship_cohort']);
const DM = new Set(['dm_u1_u2', 'dm_u1_u3', 'dm_group_leads']);
const pj = (s, f) => { try { const v = JSON.parse(s); return v == null ? f : v; } catch { return f; } };

export function purgeDemo(sync) {
  if (!sync || typeof sync !== 'object') return false;
  let changed = false;
  const set = (k, v) => { sync[k] = JSON.stringify(v); changed = true; };

  if (typeof sync.rblink_users === 'string') {
    const a = pj(sync.rblink_users, null);
    if (Array.isArray(a)) { const b = a.filter((u) => !U.has(u && u.id)); if (b.length !== a.length) set('rblink_users', b); }
  }
  if (typeof sync.rblink_channels === 'string') {
    const a = pj(sync.rblink_channels, null);
    if (Array.isArray(a)) {
      let dirty = false;
      const b = a.filter((c) => { const keep = !CH.has(c && c.id); if (!keep) dirty = true; return keep; }).map((c) => {
        const members = Array.isArray(c.memberIds) ? c.memberIds.filter((x) => !U.has(x)) : c.memberIds;
        const demoOwned = U.has(c.createdBy);
        if (members !== c.memberIds && members.length !== c.memberIds.length) dirty = true;
        if (demoOwned) {
          dirty = true;
          return { ...c, memberIds: members, createdBy: '', description: 'Welcome! Say hello and share what you are working on.', topic: 'Company-wide conversation', canvas: '# Welcome to rblink.chat\n\nUse this canvas for shared notes, guidelines and links.' };
        }
        return { ...c, memberIds: members };
      });
      if (dirty) set('rblink_channels', b);
    }
  }
  if (typeof sync.rblink_dms === 'string') {
    const a = pj(sync.rblink_dms, null);
    if (Array.isArray(a)) { const b = a.filter((d) => !DM.has(d && d.id) && !(d.participantIds || []).some((x) => U.has(x))); if (b.length !== a.length) set('rblink_dms', b); }
  }
  if (typeof sync.rblink_messages === 'string') {
    const m = pj(sync.rblink_messages, null);
    if (m && typeof m === 'object' && !Array.isArray(m)) {
      let dirty = false;
      for (const k of Object.keys(m)) {
        if (CH.has(k) || DM.has(k)) { delete m[k]; dirty = true; continue; }
        if (!Array.isArray(m[k])) continue;
        const kept = m[k].filter((x) => !U.has(x && x.senderId));
        if (kept.length !== m[k].length) { m[k] = kept; dirty = true; }
      }
      if (dirty) set('rblink_messages', m);
    }
  }
  if (typeof sync.rblink_workspace === 'string') {
    const w = pj(sync.rblink_workspace, null);
    if (w && U.has(w.ownerId)) set('rblink_workspace', { ...w, ownerId: '' });
  }
  return changed;
}

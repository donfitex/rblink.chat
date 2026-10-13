// Private chat sync: every member only receives (and can only change) what they are allowed to see.
// Private groups and direct messages are never sent to people who are not in them.
import crypto from 'crypto';
import { purgeDemo } from './demo.js';

const KEYS = ['rblink_workspace', 'rblink_users', 'rblink_channels', 'rblink_dms', 'rblink_messages'];
const pj = (s, f) => { try { const v = JSON.parse(s); return v == null ? f : v; } catch { return f; } };

export default function (R, c) {
  const { db, flush, save, send, json, bcast } = c;
  db.reads ??= {};
  const isAdmin = (u) => u && (u.role === 'owner' || u.role === 'admin');
  const parts = (sync) => ({ users: pj(sync.rblink_users, []), chans: pj(sync.rblink_channels, null), dms: pj(sync.rblink_dms, []), msgs: pj(sync.rblink_messages, {}) });
  // ids of conversations this person must NOT see
  const hiddenFor = (st, uid) => {
    const h = new Set();
    (st.chans || []).forEach((ch) => { if (ch.isPrivate && !(ch.memberIds || []).includes(uid)) h.add(ch.id); });
    (st.dms || []).forEach((d) => { if (!(d.participantIds || []).includes(uid)) h.add(d.id); });
    return h;
  };
  function view(uid) {
    const sync = db.sync, st = parts(sync), h = hiddenFor(st, uid), out = {};
    if (sync.rblink_workspace) out.rblink_workspace = sync.rblink_workspace;
    if (sync.rblink_users) out.rblink_users = JSON.stringify(st.users.map((x) => (x.id === uid ? x : { ...x, email: '' })));
    if (st.chans) out.rblink_channels = JSON.stringify(st.chans.filter((x) => !h.has(x.id)));
    if (sync.rblink_dms) out.rblink_dms = JSON.stringify(st.dms.filter((x) => !h.has(x.id)));
    if (sync.rblink_messages) out.rblink_messages = JSON.stringify(Object.fromEntries(Object.entries(st.msgs).filter(([k]) => !h.has(k))));
    return out;
  }
  const byTime = (a, b) => String(a.timestamp || '').localeCompare(String(b.timestamp || ''));

  // Merge what a member sent into the full workspace, but only inside what they may see and change.
  function mergeIn(me, inc) {
    const sync = db.sync, st = parts(sync), h = hiddenFor(st, me.id), uid = me.id, adm = isAdmin(me), adds = [];
    if (typeof inc.rblink_workspace === 'string' && (adm || !sync.rblink_workspace)) sync.rblink_workspace = inc.rblink_workspace;

    if (typeof inc.rblink_users === 'string') {
      const iu = pj(inc.rblink_users, null);
      if (Array.isArray(iu)) {
        const full = new Map(st.users.map((x) => [x.id, x]));
        for (const x of iu) {
          if (!x || typeof x.id !== 'string') continue;
          const old = full.get(x.id);
          if (!old) { if (x.id === uid) full.set(x.id, { ...x, role: me.role === 'owner' ? 'owner' : 'member', email: me.email || '' }); }
          else if (x.id === uid) full.set(x.id, { ...x, role: old.role, email: old.email });
          else if (adm) full.set(x.id, { ...old, ...x, email: old.email });
        }
        sync.rblink_users = JSON.stringify([...full.values()]);
      }
    }
    if (typeof inc.rblink_channels === 'string') {
      const ic = pj(inc.rblink_channels, null);
      if (Array.isArray(ic)) {
        const full = new Map((st.chans || []).map((x) => [x.id, x])), seen = new Set();
        for (const x of ic) {
          if (!x || typeof x.id !== 'string') continue;
          seen.add(x.id);
          const old = full.get(x.id);
          if (!old) { const nc = { ...x, createdBy: uid }; if (nc.isPrivate && !(nc.memberIds || []).includes(uid)) nc.memberIds = [...(nc.memberIds || []), uid]; full.set(x.id, nc); }
          else if (!h.has(x.id)) full.set(x.id, { ...x });
        }
        if (st.chans) for (const [id, old] of full) if (!seen.has(id) && !h.has(id) && (old.createdBy === uid || adm)) full.delete(id);
        sync.rblink_channels = JSON.stringify([...full.values()]);
      }
    }
    if (typeof inc.rblink_dms === 'string') {
      const idm = pj(inc.rblink_dms, null);
      if (Array.isArray(idm)) {
        const full = new Map(st.dms.map((x) => [x.id, x]));
        for (const x of idm) {
          if (!x || typeof x.id !== 'string') continue;
          const old = full.get(x.id);
          if (!old) full.set(x.id, { ...x, participantIds: [...new Set([...(Array.isArray(x.participantIds) ? x.participantIds : []), uid])], createdBy: uid });
          else if (!h.has(x.id)) full.set(x.id, { ...x, participantIds: old.participantIds });
        }
        sync.rblink_dms = JSON.stringify([...full.values()]);
      }
    }
    if (typeof inc.rblink_messages === 'string') {
      const im = pj(inc.rblink_messages, null);
      if (im && typeof im === 'object' && !Array.isArray(im)) {
        const full = { ...st.msgs };
        for (const [k, list] of Object.entries(im)) {
          if (!Array.isArray(list) || h.has(k)) continue;
          const oldList = full[k] || [], old = new Map(oldList.map((m) => [m.id, m])), out = [], keep = new Set();
          for (const m of list) {
            if (!m || typeof m.id !== 'string') continue;
            const o = old.get(m.id);
            keep.add(m.id);
            if (!o) { if (m.senderId !== uid) continue; out.push(m); adds.push([k, m]); }               // you can only post as yourself
            else if (o.senderId === uid || adm) out.push({ ...m, senderId: o.senderId });                   // edit your own (or admin moderation)
            else out.push({ ...o, reactions: m.reactions, isPinned: m.isPinned, pinnedBy: m.pinnedBy, pinnedAt: m.pinnedAt, replyCount: m.replyCount, latestReplyAt: m.latestReplyAt, replyUserIds: m.replyUserIds, poll: m.poll, checklist: m.checklist });
          }
          for (const o of oldList) if (!keep.has(o.id) && !(o.senderId === uid || adm)) out.push(o);      // nobody else can delete your messages
          full[k] = out.sort(byTime);
        }
        sync.rblink_messages = JSON.stringify(full);
      }
    }
    return adds;
  }
  const actorOf = (u) => ({ id: u.id, name: u.name, avatar: u.avatar || '' });
  function notifyAdds(me, adds) {
    if (!adds.length || !c.notify) return;
    const st = parts(db.sync);
    for (const [k, m] of adds) {
      const snippet = String(m.content || '').replace(/\s+/g, ' ').slice(0, 100) || 'sent an attachment';
      const dm = st.dms.find((d) => d.id === k);
      if (dm) for (const p of dm.participantIds || []) c.notify({ to: p, type: 'dm', actor: actorOf(me), text: snippet, link: 'inbox', ref: k, key: 'dm:' + k + ':' + me.id });
      for (const t of m.mentions || []) {
        if (typeof t !== 'string' || t.startsWith('@')) continue;
        const ch = (st.chans || []).find((x) => x.id === k);
        const canSee = dm ? (dm.participantIds || []).includes(t) : !ch || !ch.isPrivate || (ch.memberIds || []).includes(t);
        if (canSee) c.notify({ to: t, type: 'mention', actor: actorOf(me), text: 'mentioned you: ' + snippet, link: 'chat', ref: k });
      }
    }
  }

  R['GET /api/sync'] = (q, s, u) => send(s, 200, { rev: db.rev, data: view(u.id) });
  R['PUT /api/sync'] = async (q, s, u) => {
    const b = await json(q);
    if (b.baseRev !== db.rev) return send(s, 409, { rev: db.rev, data: view(u.id) });
    const inc = {};
    for (const k of KEYS) if (typeof (b.data || {})[k] === 'string') inc[k] = b.data[k];
    purgeDemo(inc);
    const adds = mergeIn(u, inc);
    purgeDemo(db.sync);
    db.rev++;
    save();
    bcast({ type: 'sync', payload: { rev: db.rev } });
    notifyAdds(u, adds);
    send(s, 200, { rev: db.rev });
  };

  // ---- who may receive a live chat event (used by the WebSocket relay). null = everyone signed in.
  c.chatRecipients = (m) => {
    const p = m.payload || {};
    if (m.type === 'user:status') return null;
    const st = parts(db.sync);
    let conv = p.dmId || p.channelId;
    if (!conv && m.type === 'reaction:toggle') for (const [k, list] of Object.entries(st.msgs)) if (Array.isArray(list) && list.some((x) => x.id === p.messageId)) { conv = k; break; }
    if (!conv) return null;
    const dm = st.dms.find((d) => d.id === conv);
    if (dm) { const set = new Set(dm.participantIds || []); return set.has(p.senderId || p.userId) ? set : new Set(); }
    const ch = (st.chans || []).find((x) => x.id === conv);
    if (ch && ch.isPrivate) { const set = new Set(ch.memberIds || []); return set.has(p.senderId || p.userId) ? set : new Set(); }
    return null;
  };

  // ---- inbox (direct messages)
  const userCard = (st, id) => { const v = st.users.find((x) => x.id === id) || db.users.find((x) => x.id === id); return v ? { id: v.id, name: v.name, avatar: v.avatar || '' } : { id, name: 'Unknown', avatar: '' }; };
  function inbox(uid) {
    const st = parts(db.sync), reads = db.reads[uid] || {};
    return st.dms.filter((d) => (d.participantIds || []).includes(uid)).map((d) => {
      const ms = (st.msgs[d.id] || []).filter((m) => !m.threadParentId), last = ms[ms.length - 1], rd = reads[d.id] || '';
      return {
        id: d.id, isGroup: !!d.isGroup, name: d.name || '', others: d.participantIds.filter((x) => x !== uid).map((x) => userCard(st, x)),
        last: last ? { content: String(last.content || '').slice(0, 120), attach: !!(last.attachments && last.attachments.length), timestamp: last.timestamp, senderId: last.senderId } : null,
        unread: ms.filter((m) => m.senderId !== uid && String(m.timestamp) > rd).length
      };
    }).sort((a, b) => String((b.last && b.last.timestamp) || '').localeCompare(String((a.last && a.last.timestamp) || '')));
  }
  c.inboxUnread = (uid) => inbox(uid).reduce((n, x) => n + x.unread, 0);
  R['GET /api/inbox'] = (q, s, u) => send(s, 200, inbox(u.id));
  R['POST /api/inbox/read'] = async (q, s, u) => {
    const { id } = await json(q), st = parts(db.sync);
    if (st.dms.some((d) => d.id === id && (d.participantIds || []).includes(u.id))) {
      (db.reads[u.id] ??= {})[id] = new Date().toISOString();
      for (const n of db.notifs || []) if (n.to === u.id && n.type === 'dm' && n.ref === id) n.read = true;
      save();
    }
    send(s, 200, { ok: true });
  };
  const chatUser = (x) => {
    const base = String(x.email || x.name || 'user').split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'user', now = new Date().toISOString();
    return { id: x.id, name: x.name, email: '', username: `${base}.${x.id.slice(-4)}`, avatar: x.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(x.name)}`, role: x.role === 'owner' ? 'owner' : 'member', presence: 'online', joinedAt: now, lastActive: now };
  };
  R['POST /api/dms'] = async (q, s, u) => {
    const { userId } = await json(q), t = db.users.find((x) => x.id === userId);
    if (!t || t.id === u.id) return send(s, 400, { error: 'Choose another member' });
    if ((u.blockedUserIds || []).includes(t.id) || (t.blockedUserIds || []).includes(u.id)) return send(s, 403, { error: 'This user is not available for direct messaging' });
    const tp = t.privacy || {}, mode = tp.messageVisibility || 'everyone';
    if (mode === 'nobody') return send(s, 403, { error: 'This user does not accept messages right now' });
    if (mode === 'contacts' && !((db.sync && db.sync.rblink_dms) ? JSON.parse(db.sync.rblink_dms || '[]').some((x) => (x.participantIds || []).includes(u.id) && (x.participantIds || []).includes(t.id)) : false)) return send(s, 403, { error: 'This user only accepts messages from contacts' });
    const st = parts(db.sync);
    let d = st.dms.find((x) => !x.isGroup && (x.participantIds || []).length === 2 && x.participantIds.includes(u.id) && x.participantIds.includes(t.id));
    if (!d) {
      d = { id: 'dm_' + crypto.randomBytes(6).toString('hex'), isGroup: false, participantIds: [u.id, t.id], createdBy: u.id, createdAt: new Date().toISOString() };
      st.dms.push(d);
      for (const x of [u, t]) if (!st.users.some((y) => y.id === x.id)) st.users.push(chatUser(x));
      db.sync.rblink_dms = JSON.stringify(st.dms);
      db.sync.rblink_users = JSON.stringify(st.users);
      db.rev++;
      flush();
      bcast({ type: 'sync', payload: { rev: db.rev } });
    }
    send(s, 200, { id: d.id });
  };
}

// In-app notifications: comments, replies, reactions, reshares, WhatsApp requests, job applications, direct messages, mentions.
import crypto from 'crypto';
export default function (R, c) {
  const { db, save, send, json } = c;
  db.notifs ??= [];
  // n = { to, type, actor:{id,name,avatar}, text, link, ref, key }. Never notifies you about your own actions.
  c.notify = (n) => {
    if (!n || !n.to || (n.actor && n.actor.id === n.to)) return;
    if (n.key) {
      const ex = db.notifs.find((x) => x.to === n.to && x.key === n.key && !x.read);
      if (ex) { ex.at = Date.now(); ex.text = String(n.text || '').slice(0, 200); save(); return; } // repeated reaction toggles do not spam
    }
    db.notifs.push({ id: 'n_' + crypto.randomBytes(6).toString('hex'), to: n.to, type: n.type, actor: n.actor || null, text: String(n.text || '').slice(0, 200), link: n.link || '', ref: n.ref || '', key: n.key || '', at: Date.now(), read: false });
    const mine = db.notifs.filter((x) => x.to === n.to);
    if (mine.length > 300) { const drop = new Set(mine.slice(0, mine.length - 300).map((x) => x.id)); db.notifs = db.notifs.filter((x) => !drop.has(x.id)); }
    save();
  };
  const summary = (u) => ({ unread: db.notifs.filter((x) => x.to === u.id && !x.read).length, inbox: c.inboxUnread ? c.inboxUnread(u.id) : 0 });
  R['GET /api/notifications/summary'] = (q, s, u) => send(s, 200, summary(u));
  R['GET /api/notifications'] = (q, s, u) => {
    const items = db.notifs.filter((x) => x.to === u.id).sort((a, b) => b.at - a.at).slice(0, 60).map(({ key, to, ...rest }) => rest);
    send(s, 200, { items, ...summary(u) });
  };
  R['POST /api/notifications/read'] = async (q, s, u) => {
    const b = await json(q);
    for (const x of db.notifs) if (x.to === u.id && (b.all || x.id === b.id)) x.read = true;
    save();
    send(s, 200, summary(u));
  };
}

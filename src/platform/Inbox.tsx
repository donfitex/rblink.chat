import React, { useEffect, useState } from 'react';
import { api } from './api';
import { go, useMe } from './hooks';
import { Avatar, ago, btn, btn2, card, field } from './ui';

// Direct messages in one list, with unread counts. Opening one jumps straight into that chat.
export const InboxPage = () => {
  const { me, needLogin } = useMe();
  const [list, setList] = useState<any[] | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [q, setQ] = useState('');
  const [people, setPeople] = useState<any[]>([]);
  const [err, setErr] = useState('');

  const load = () => api('GET', '/api/inbox').then(setList).catch(() => setList([]));
  useEffect(() => {
    if (!me) return;
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [me && me.id]);
  useEffect(() => {
    if (!newOpen) return;
    const t = setTimeout(() => api('GET', '/api/users?q=' + encodeURIComponent(q)).then((r) => setPeople(r.filter((u: any) => me && u.id !== me.id))).catch(() => setPeople([])), 250);
    return () => clearTimeout(t);
  }, [q, newOpen]);

  if (!me) return (
    <div className="mx-auto max-w-md p-6 text-center"><div className={`${card} p-6`}><div className="text-4xl">🔒</div><p className="mt-2 text-white">Log in to see your messages.</p>
      <button className={`${btn} mt-4`} onClick={needLogin}>Log in or sign up</button></div></div>
  );

  const openChat = async (id: string) => {
    localStorage.setItem('rblink_current_channel', id);
    await api('POST', '/api/inbox/read', { id }).catch(() => {});
    window.dispatchEvent(new Event('rblink:counts'));
    go('chat');
  };
  const startWith = async (userId: string) => {
    setErr('');
    try { const r = await api('POST', '/api/dms', { userId }); await openChat(r.id); } catch (e: any) { setErr(e.message); }
  };
  const title = (d: any) => d.name || d.others.map((o: any) => o.name).join(', ') || 'Conversation';

  return (
    <div className="mx-auto w-full max-w-2xl space-y-3 p-3 sm:p-4">
      <div className="flex items-center gap-2"><h1 className="mr-auto text-xl font-bold text-white">Inbox</h1><button className={btn} onClick={() => setNewOpen(true)}>✉ New message</button></div>
      {list === null && <p className="text-sm text-[#8D9197]">Loading...</p>}
      {list && !list.length && <div className={`${card} p-8 text-center text-[#8D9197]`}>No direct messages yet. Press New message, or open someone's profile and tap Message.</div>}
      <div className="space-y-2">
        {(list || []).map((d) => (
          <button key={d.id} onClick={() => openChat(d.id)} className={`${card} flex w-full items-center gap-3 p-3 text-left hover:border-[#1D9BD1]`}>
            <Avatar user={d.others[0] || { name: '?' }} size={46} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2"><span className={`truncate ${d.unread ? 'font-bold text-white' : 'font-semibold text-[#D1D2D3]'}`}>{title(d)}</span>{d.last && <span className="ml-auto shrink-0 text-xs text-[#8D9197]">{ago(d.last.timestamp)}</span>}</div>
              <div className={`truncate text-sm ${d.unread ? 'text-white' : 'text-[#8D9197]'}`}>
                {d.last ? `${d.last.senderId === me.id ? 'You: ' : ''}${d.last.content || (d.last.attach ? '📎 Attachment' : '')}` : 'No messages yet'}
              </div>
            </div>
            {d.unread > 0 && <span className="shrink-0 rounded-full bg-[#1D9BD1] px-2 py-0.5 text-xs font-bold text-white">{d.unread}</span>}
          </button>
        ))}
      </div>
      {newOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-20" onClick={() => setNewOpen(false)}>
          <div className={`${card} w-full max-w-md space-y-3 p-4`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center"><h2 className="mr-auto font-semibold text-white">New message</h2><button className="text-2xl leading-none text-[#8D9197]" onClick={() => setNewOpen(false)}>×</button></div>
            <input className={field} autoFocus placeholder="Search people by name" value={q} onChange={(e) => setQ(e.target.value)} />
            {err && <p className="text-sm text-red-400">{err}</p>}
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {people.map((u) => (
                <button key={u.id} onClick={() => startWith(u.id)} className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-[#222529]">
                  <Avatar user={u} size={34} /><div className="min-w-0 text-sm text-white"><div className="truncate">{u.name}</div><div className="truncate text-xs text-[#8D9197]">{u.headline || u.location || ''}</div></div>
                </button>
              ))}
              {!people.length && <p className="p-2 text-sm text-[#8D9197]">No people found.</p>}
            </div>
            <button className={btn2} onClick={() => setNewOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

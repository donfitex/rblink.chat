import React, { useEffect, useState } from 'react';
import { api } from './api';
import { go, useMe } from './hooks';
import { Avatar, ago, btn, btn2, card } from './ui';

const ICON: any = {
  comment: '💬', reply: '↩️', reaction_post: '❤️', reaction_comment: '👍', reshare: '🔁', whatsapp_request: '🔒',
  whatsapp_approved: '✅', whatsapp_denied: '🚫', application: '📄', application_status: '📌', dm: '✉️', mention: '@'
};

// Everything that happened to you: comments, replies, reactions, reshares, messages, WhatsApp requests, job updates.
export const NotificationsPage = () => {
  const { me, needLogin } = useMe();
  const [items, setItems] = useState<any[] | null>(null);
  const [tab, setTab] = useState('all');
  const load = () => api('GET', '/api/notifications').then((r) => setItems(r.items)).catch(() => setItems([]));
  useEffect(() => {
    if (!me) return;
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [me && me.id]);

  if (!me) return (
    <div className="mx-auto max-w-md p-6 text-center"><div className={`${card} p-6`}><div className="text-4xl">🔒</div><p className="mt-2 text-white">Log in to see your notifications.</p>
      <button className={`${btn} mt-4`} onClick={needLogin}>Log in or sign up</button></div></div>
  );

  const refreshCounts = () => window.dispatchEvent(new Event('rblink:counts'));
  const open = async (n: any) => {
    if (!n.read) { await api('POST', '/api/notifications/read', { id: n.id }).catch(() => {}); refreshCounts(); }
    if (n.type === 'dm' || n.type === 'mention') { if (n.ref) localStorage.setItem('rblink_current_channel', n.ref); go('chat'); }
    else go(n.link || 'feed');
  };
  const readAll = async () => { await api('POST', '/api/notifications/read', { all: true }).catch(() => {}); refreshCounts(); load(); };
  const shown = (items || []).filter((n) => tab === 'all' || !n.read);
  const unread = (items || []).filter((n) => !n.read).length;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-3 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-xl font-bold text-white">Notifications</h1>
        {(['all', 'unread'] as string[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full border px-3 py-1 text-sm capitalize ${tab === t ? 'border-[#1D9BD1] bg-[#1D9BD1] text-white' : 'border-[#383F45] text-[#B9BBBE]'}`}>{t === 'unread' ? `Unread (${unread})` : 'All'}</button>
        ))}
        <button className={btn2} disabled={!unread} onClick={readAll}>Mark all read</button>
      </div>
      {items === null && <p className="text-sm text-[#8D9197]">Loading...</p>}
      {items && !shown.length && <div className={`${card} p-8 text-center text-[#8D9197]`}>{tab === 'unread' ? 'You are all caught up.' : 'Nothing yet. When people comment, react or message you, it shows here.'}</div>}
      <div className="space-y-2">
        {shown.map((n) => (
          <button key={n.id} onClick={() => open(n)} className={`${card} flex w-full items-start gap-3 p-3 text-left hover:border-[#1D9BD1] ${n.read ? 'opacity-70' : ''}`}>
            <div className="relative shrink-0">
              <Avatar user={n.actor || { name: '?' }} size={40} />
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#222529] text-[11px]">{ICON[n.type] || '🔔'}</span>
            </div>
            <div className="min-w-0 flex-1 text-sm text-[#D1D2D3]">
              <span className="font-semibold text-white">{n.actor ? n.actor.name : 'Someone'}</span>{' '}
              <span className="break-words">{n.type === 'dm' ? `sent you a message: ${n.text}` : n.text}</span>
              <div className="mt-0.5 text-xs text-[#8D9197]">{ago(new Date(n.at).toISOString())}</div>
            </div>
            {!n.read && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#1D9BD1]" />}
          </button>
        ))}
      </div>
    </div>
  );
};

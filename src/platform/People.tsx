import React, { useEffect, useState } from 'react';
import { api } from './api';
import { go, useMe } from './hooks';
import { Avatar, btn, card, field } from './ui';

export const People = () => {
  const { me, needLogin } = useMe();
  const [q, setQ] = useState('');
  const [list, setList] = useState<any[]>([]);
  useEffect(() => {
    const t = setTimeout(() => api('GET', '/api/users?q=' + encodeURIComponent(q)).then(setList).catch(() => setList([])), 250);
    return () => clearTimeout(t);
  }, [q, me && me.id]);
  return (
    <div className="mx-auto w-full max-w-3xl space-y-3 p-3 sm:p-4">
      <input className={field} placeholder="Search people" value={q} onChange={(e) => setQ(e.target.value)} />
      {!me && <p className="text-sm text-[#8D9197]">Visitors see names only. <button className="font-semibold text-[#1D9BD1]" onClick={needLogin}>Log in</button> to view profiles.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((u) => (
          <button key={u.id} onClick={() => (me ? go('profile/' + u.id) : needLogin())} className={`${card} flex items-center gap-3 p-3 text-left hover:bg-[#222529]`}>
            <Avatar user={u} size={48} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-white">{u.name}</div>
              <div className="truncate text-xs text-[#8D9197]">{me ? u.headline || u.location || u.role : '🔒 Log in to view profile'}</div>
            </div>
          </button>
        ))}
        {!list.length && <p className="text-[#8D9197]">No people found.</p>}
      </div>
    </div>
  );
};

export const Groups = () => {
  const { me, needLogin } = useMe();
  const [list, setList] = useState<any[] | null>(null);
  useEffect(() => { api('GET', '/api/public/groups').then(setList).catch(() => setList([])); }, []);
  return (
    <div className="mx-auto w-full max-w-3xl space-y-3 p-3 sm:p-4">
      <h2 className="text-lg font-bold text-white">Groups</h2>
      {!me && <p className="text-sm text-[#8D9197]">You can see group names. Log in to open them.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {(list || []).map((g) => (
          <div key={g.id} className={`${card} p-4`}>
            <div className="font-semibold text-white"># {g.name}</div>
            <p className="mt-1 line-clamp-2 text-sm text-[#8D9197]">{me ? g.description : '🔒 Members only'}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-[#8D9197]">
              <span>{g.members} members</span>
              <button className={btn} onClick={() => (me ? go('chat') : needLogin())}>{me ? 'Open' : 'Log in to open'}</button>
            </div>
          </div>
        ))}
        {list && !list.length && <p className="text-[#8D9197]">No groups yet.</p>}
      </div>
    </div>
  );
};

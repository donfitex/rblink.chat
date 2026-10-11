import React, { useEffect, useState } from 'react';
import { api } from './api';
import { go, useMe } from './hooks';
import { Avatar, btn, btn2, card, field } from './ui';

const Locked = ({ text }: { text: string }) => {
  const { needLogin } = useMe();
  return (
    <div className={`${card} p-6 text-center`}><div className="text-3xl">🔒</div><p className="mt-2 text-sm text-white">{text}</p>
      <button className={`${btn} mt-3`} onClick={needLogin}>Log in or sign up</button></div>
  );
};

// ---------- Meetings: start one or join with a code / link
export const MeetLobby = () => {
  const { me } = useMe();
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const start = async () => {
    setBusy(true); setErr('');
    try { const r = await api('POST', '/api/rooms', { type: 'meeting', title }); go('room/' + r.code); } catch (e: any) { setErr(e.message); }
    setBusy(false);
  };
  const join = () => {
    const m = /([a-z]{3}-[a-z]{4}-[a-z]{3})/i.exec(code.trim());
    if (!m) { setErr('Enter a meeting code like abc-defg-hij or paste the invite link'); return; }
    go('room/' + m[1].toLowerCase());
  };
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-3 sm:p-4">
      <h1 className="text-xl font-bold text-white">Meetings</h1>
      <p className="text-sm text-[#8D9197]">Free video meetings for up to 8 people: screen sharing, raise hand, chat and voice notes.</p>
      {!me ? <Locked text="Log in to start or join a meeting." /> : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={`${card} space-y-3 p-5`}>
            <h2 className="font-semibold text-white">Start a meeting</h2>
            <input className={field} placeholder="Meeting title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <button className={`${btn} w-full py-2`} disabled={busy} onClick={start}>{busy ? 'Creating...' : '📹 New meeting'}</button>
          </div>
          <div className={`${card} space-y-3 p-5`}>
            <h2 className="font-semibold text-white">Join with a code</h2>
            <input className={field} placeholder="abc-defg-hij or invite link" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') join(); }} />
            <button className={`${btn2} w-full py-2`} onClick={join}>Join</button>
          </div>
        </div>
      )}
      {err && <p className="text-sm text-red-400">{err}</p>}
      <p className="text-xs text-[#8D9197]">Tip: after you start, press Invite inside the meeting to copy the link and send it to people.</p>
    </div>
  );
};

// ---------- Live: who is live now, and go live yourself
export const LiveLobby = () => {
  const { me, needLogin } = useMe();
  const [rooms, setRooms] = useState<any[] | null>(null);
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState('video');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const f = () => api('GET', '/api/rooms/live').then(setRooms).catch(() => setRooms([]));
    f();
    const t = setInterval(f, 8000);
    return () => clearInterval(t);
  }, []);
  const goLive = async () => {
    setBusy(true); setErr('');
    try { const r = await api('POST', '/api/rooms', { type: 'live', mode, title }); go('room/' + r.code); } catch (e: any) { setErr(e.message); }
    setBusy(false);
  };
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-3 sm:p-4">
      <h1 className="text-xl font-bold text-white">Live</h1>
      <div className={`${card} space-y-3 p-5`}>
        <h2 className="font-semibold text-white">Go live</h2>
        {!me ? <p className="text-sm text-[#8D9197]"><button className="font-semibold text-[#1D9BD1]" onClick={needLogin}>Log in</button> to broadcast.</p> : (
          <>
            <input className={field} placeholder="What is your live about?" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="flex flex-wrap items-center gap-4 text-sm text-white">
              <label className="flex items-center gap-2"><input type="radio" checked={mode === 'video'} onChange={() => setMode('video')} /> 🎥 Video</label>
              <label className="flex items-center gap-2"><input type="radio" checked={mode === 'audio'} onChange={() => setMode('audio')} /> 🎙 Voice only</label>
              <button className={`${btn} ml-auto`} disabled={busy} onClick={goLive}>{busy ? 'Starting...' : 'Go live'}</button>
            </div>
            {err && <p className="text-sm text-red-400">{err}</p>}
          </>
        )}
      </div>
      <h2 className="font-semibold text-white">Live now</h2>
      {rooms && !rooms.length && <div className={`${card} p-8 text-center text-[#8D9197]`}>Nobody is live right now. Be the first!</div>}
      <div className="grid gap-3 sm:grid-cols-2">
        {(rooms || []).map((r) => (
          <button key={r.code} onClick={() => (me ? go('room/' + r.code) : needLogin())} className={`${card} flex items-center gap-3 p-4 text-left hover:border-[#1D9BD1]`}>
            <Avatar user={r.host} size={46} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-white">{r.title}</div>
              <div className="truncate text-xs text-[#8D9197]">{r.host.name} · {r.mode === 'audio' ? '🎙 Voice' : '🎥 Video'} · {r.viewers} listening</div>
            </div>
            <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">LIVE</span>
          </button>
        ))}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { api, upload } from './api';
import { useMe } from './hooks';
import { Avatar, ago, btn, field } from './ui';
import { VoiceRecorder } from './VoiceRecorder';

const EMO = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];

// Threaded comments: text, voice notes, replies and emoji reactions. Visitors can read only.
export const Comments = ({ postId, onCount }: { postId: string; onCount: (n: number) => void }) => {
  const { me, needLogin } = useMe();
  const [list, setList] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);
  const [pick, setPick] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const r = await api('GET', `/api/posts/${postId}/comments`);
    setList(r);
    setLoaded(true);
    onCount(r.length);
  };
  useEffect(() => { load().catch(() => setLoaded(true)); }, [postId, me && me.id]);

  const send = async (audio?: string) => {
    if (!me) { needLogin(); return; }
    if (!text.trim() && !audio) return;
    setBusy(true);
    try {
      await api('POST', `/api/posts/${postId}/comments`, { text, audio, parentId: replyTo ? replyTo.id : null });
      setText('');
      setReplyTo(null);
      await load();
    } catch (e: any) { alert(e.message); }
    setBusy(false);
  };
  const voice = async (f: File) => {
    try { const up = await upload([f]); await send(up[0].url); } catch (e: any) { alert(e.message); }
  };
  const react = async (c: any, emoji: string) => {
    setPick('');
    if (!me) { needLogin(); return; }
    try {
      const u = await api('POST', `/api/comments/${c.id}/react`, { emoji });
      setList((l) => l.map((x) => (x.id === u.id ? u : x)));
    } catch (e: any) { alert(e.message); }
  };
  const remove = async (c: any) => {
    if (!confirm('Delete this comment and its replies?')) return;
    try { await api('DELETE', `/api/comments/${c.id}`); await load(); } catch (e: any) { alert(e.message); }
  };

  const node = (c: any, depth: number): React.ReactNode => {
    const kids = list.filter((x) => x.parentId === c.id);
    const mine = me && (me.id === c.author.id || me.role === 'owner' || me.role === 'admin');
    return (
      <div key={c.id} className={depth > 0 ? 'ml-6 border-l border-[#383F45] pl-3' : ''}>
        <div className="mt-3 flex gap-2">
          <Avatar user={c.author} size={30} />
          <div className="min-w-0 flex-1">
            <div className="inline-block max-w-full rounded-2xl bg-[#222529] px-3 py-2">
              <div className="text-xs font-semibold text-white">{c.author.name} <span className="font-normal text-[#8D9197]">{ago(c.createdAt)}</span></div>
              {c.text && <p className="whitespace-pre-wrap break-words text-sm text-[#D1D2D3]">{c.text}</p>}
              {c.audio && <audio controls preload="none" src={c.audio} className="mt-1 h-9 w-56 max-w-full" />}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#8D9197]">
              {Object.entries(c.reactionCounts || {}).map(([e, n]) => (
                <button key={e} onClick={() => react(c, e)} className={`rounded-full border px-1.5 ${c.myReaction === e ? 'border-[#1D9BD1] text-white' : 'border-[#383F45]'}`}>{e} {n as number}</button>
              ))}
              <button onClick={() => setPick(pick === c.id ? '' : c.id)} className="hover:text-white">React</button>
              <button onClick={() => (me ? setReplyTo(c) : needLogin())} className="hover:text-white">Reply</button>
              {mine && <button onClick={() => remove(c)} className="hover:text-red-400">Delete</button>}
            </div>
            {pick === c.id && (
              <div className="mt-1 inline-flex gap-1 rounded-full border border-[#383F45] bg-[#19171D] px-2 py-1">
                {EMO.map((e) => <button key={e} onClick={() => react(c, e)} className="text-lg hover:scale-125">{e}</button>)}
              </div>
            )}
          </div>
        </div>
        {kids.map((k) => node(k, Math.min(depth + 1, 4)))}
      </div>
    );
  };

  const roots = list.filter((c) => !c.parentId);
  return (
    <div className="border-t border-[#383F45] px-4 pb-4">
      {!loaded && <p className="py-3 text-sm text-[#8D9197]">Loading comments...</p>}
      {loaded && roots.length === 0 && <p className="py-3 text-sm text-[#8D9197]">No comments yet.</p>}
      {roots.map((c) => node(c, 0))}
      {me ? (
        <div className="mt-3">
          {replyTo && (
            <div className="mb-1 text-xs text-[#8D9197]">
              Replying to {replyTo.author.name} <button className="underline" onClick={() => setReplyTo(null)}>cancel</button>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <input
              className={`${field} min-w-0 flex-1`}
              placeholder="Write a comment..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            />
            <VoiceRecorder onDone={voice} disabled={busy} />
            <button className={btn} disabled={busy} onClick={() => send()}>Send</button>
          </div>
        </div>
      ) : (
        <p className="mt-3 rounded-md bg-[#222529] p-3 text-sm text-[#8D9197]">
          <button className="font-semibold text-[#1D9BD1]" onClick={needLogin}>Log in</button> to comment, reply or react.
        </p>
      )}
    </div>
  );
};

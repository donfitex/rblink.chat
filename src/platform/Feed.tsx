import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api, upload } from './api';
import { go, useMe } from './hooks';
import { Avatar, ago, btn, btn2, card, field } from './ui';
import { Comments } from './Comments';

export const CATS = ['news', 'updates', 'sports', 'tech', 'education', 'entertainment', 'business', 'health', 'lifestyle', 'other'];
const EMO = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- Rich media: grid + full-screen gallery that loops forever
const Lightbox = ({ items, start, onClose }: { items: any[]; start: number; onClose: () => void }) => {
  const [i, setI] = useState(start);
  const n = items.length;
  const next = () => setI((x) => (x + 1) % n);
  const prev = () => setI((x) => (x - 1 + n) % n);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  const m = items[i];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95" onClick={onClose}>
      <button className="absolute right-4 top-4 text-3xl text-white" onClick={onClose}>×</button>
      {n > 1 && <button className="absolute left-3 z-10 rounded-full bg-black/50 px-3 py-2 text-3xl text-white" onClick={(e) => { e.stopPropagation(); prev(); }}>‹</button>}
      <div className="max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
        {m.type === 'video'
          ? <video key={m.url} src={m.url} controls autoPlay className="max-h-[90vh] max-w-[95vw]" />
          : <img key={m.url} src={m.url} alt="" className="max-h-[90vh] max-w-[95vw] object-contain" />}
      </div>
      {n > 1 && <button className="absolute right-3 z-10 rounded-full bg-black/50 px-3 py-2 text-3xl text-white" onClick={(e) => { e.stopPropagation(); next(); }}>›</button>}
      {n > 1 && <div className="absolute bottom-4 text-sm text-white/80">{i + 1} / {n}</div>}
    </div>
  );
};

export const Media = ({ items }: { items: any[] }) => {
  const [open, setOpen] = useState<number | null>(null);
  if (!items || !items.length) return null;
  const shown = items.slice(0, 4);
  const extra = items.length - 4;
  if (items.length === 1 && items[0].type === 'video') {
    return <video src={items[0].url} controls preload="metadata" className="max-h-[32rem] w-full bg-black" />;
  }
  const tile = (m: any, i: number, cls: string) => (
    <div key={i} className={`relative cursor-pointer overflow-hidden bg-black ${cls}`} onClick={() => setOpen(i)}>
      {m.type === 'video'
        ? <video src={m.url} preload="metadata" muted className="h-full w-full object-cover" />
        : <img src={m.url} loading="lazy" alt="" className="h-full w-full object-cover" />}
      {m.type === 'video' && <span className="absolute inset-0 flex items-center justify-center text-4xl text-white/90">▶</span>}
      {i === 3 && extra > 0 && <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-2xl font-bold text-white">+{extra}</span>}
    </div>
  );
  const grid = shown.length === 1 ? 'grid-cols-1' : shown.length === 3 ? 'grid-cols-2 grid-rows-2 h-96' : shown.length === 2 ? 'grid-cols-2 h-64' : 'grid-cols-2 grid-rows-2 h-96';
  return (
    <>
      <div className={`grid gap-0.5 ${grid}`}>
        {shown.map((m, i) => tile(m, i, shown.length === 1 ? 'max-h-[32rem]' : shown.length === 3 && i === 0 ? 'row-span-2' : ''))}
      </div>
      {open !== null && <Lightbox items={items} start={open} onClose={() => setOpen(null)} />}
    </>
  );
};

// ---------- One post
export const PostCard = ({ post, onChange, onDelete, full }: { post: any; onChange: (p: any) => void; onDelete: (id: string) => void; full?: boolean }) => {
  const { me, needLogin } = useMe();
  const [showC, setShowC] = useState(!!full);
  const [pick, setPick] = useState(false);
  const [share, setShare] = useState(false);
  const url = `${location.origin}/#/post/${post.id}`;
  const snippet = encodeURIComponent((post.text || 'Check out this post').slice(0, 120));
  const eu = encodeURIComponent(url);
  const links: [string, string][] = [
    ['WhatsApp', `https://wa.me/?text=${snippet}%20${eu}`],
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${eu}`],
    ['X', `https://x.com/intent/post?text=${snippet}&url=${eu}`],
    ['Telegram', `https://t.me/share/url?url=${eu}&text=${snippet}`],
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${eu}`],
    ['Email', `mailto:?subject=${snippet}&body=${eu}`]
  ];
  const act = async (fn: () => Promise<any>) => {
    if (!me) { needLogin(); return; }
    try { onChange(await fn()); } catch (e: any) { alert(e.message); }
  };
  const react = (e: string) => { setPick(false); act(() => api('POST', `/api/posts/${post.id}/react`, { emoji: e })); };
  const save = () => act(() => api('POST', `/api/posts/${post.id}/save`));
  const reshare = async () => {
    if (!me) { needLogin(); return; }
    const t = prompt('Add a comment to your reshare (optional)', '');
    if (t === null) return;
    try {
      await api('POST', '/api/posts', { reshareOf: post.id, text: t });
      onChange({ ...post, reshareCount: post.reshareCount + 1 });
      alert('Reshared to your profile.');
    } catch (e: any) { alert(e.message); }
  };
  const remove = async () => {
    if (!confirm('Delete this post?')) return;
    try { await api('DELETE', `/api/posts/${post.id}`); onDelete(post.id); } catch (e: any) { alert(e.message); }
  };
  const openShare = () => {
    api('POST', `/api/posts/${post.id}/shared`).catch(() => {});
    const nav: any = navigator;
    if (nav.share) nav.share({ title: 'rblink.chat', text: post.text, url }).catch(() => {});
    else setShare(!share);
  };
  const total = Object.values(post.reactionCounts || {}).reduce((a: number, b: any) => a + b, 0) as number;
  const canDelete = me && (me.id === post.authorId || me.role === 'owner' || me.role === 'admin');
  const o = post.original;

  return (
    <article className={`${card} overflow-hidden`}>
      <div className="flex items-center gap-3 p-4 pb-2">
        <Avatar user={post.author} />
        <div className="min-w-0 flex-1">
          <button className="font-semibold text-white hover:underline" onClick={() => (me ? go('profile/' + post.authorId) : needLogin())}>{post.author.name}</button>
          <div className="text-xs text-[#8D9197]">{ago(post.createdAt)} · <button onClick={() => go('feed')} className="rounded bg-[#222529] px-1.5 py-0.5">{cap(post.category)}</button></div>
        </div>
        {canDelete && <button className="text-xs text-[#8D9197] hover:text-red-400" onClick={remove}>Delete</button>}
      </div>
      {post.text && <p className="whitespace-pre-wrap break-words px-4 pb-3 text-[15px] text-[#D1D2D3]">{post.text}</p>}
      {post.reshareOf && o && (
        <div className="mx-4 mb-3 overflow-hidden rounded-lg border border-[#383F45]">
          {o.deleted ? <p className="p-3 text-sm text-[#8D9197]">The original post was deleted.</p> : (
            <>
              <div className="flex items-center gap-2 p-3 pb-1"><Avatar user={o.author} size={26} /><button className="text-sm font-semibold text-white hover:underline" onClick={() => go('post/' + o.id)}>{o.author.name}</button><span className="text-xs text-[#8D9197]">{ago(o.createdAt)}</span></div>
              {o.text && <p className="whitespace-pre-wrap px-3 pb-2 text-sm text-[#D1D2D3]">{o.text}</p>}
              <Media items={o.media} />
            </>
          )}
        </div>
      )}
      <Media items={post.media} />
      {(total > 0 || post.commentCount > 0) && (
        <div className="flex items-center gap-3 px-4 pt-3 text-xs text-[#8D9197]">
          <span>{Object.keys(post.reactionCounts || {}).slice(0, 4).join('')} {total > 0 ? total : ''}</span>
          <button className="ml-auto hover:underline" onClick={() => setShowC(!showC)}>{post.commentCount} comments</button>
          <span>{post.reshareCount} reshares</span>
          <span>{post.shares} shares</span>
        </div>
      )}
      <div className="relative flex flex-wrap items-center gap-1 px-2 py-2 text-sm text-[#B9BBBE]">
        <button className={`rounded-md px-3 py-1.5 hover:bg-[#2D3136] ${post.myReaction ? 'text-white' : ''}`} onClick={() => (post.myReaction ? react(post.myReaction) : setPick(!pick))}>
          {post.myReaction || '👍'} {post.myReaction ? 'Reacted' : 'React'}
        </button>
        <button className="rounded-md px-3 py-1.5 hover:bg-[#2D3136]" onClick={() => setShowC(!showC)}>💬 Comment</button>
        <button className="rounded-md px-3 py-1.5 hover:bg-[#2D3136]" onClick={reshare}>🔁 Reshare</button>
        <button className="rounded-md px-3 py-1.5 hover:bg-[#2D3136]" onClick={openShare}>↗ Share</button>
        <button className={`ml-auto rounded-md px-3 py-1.5 hover:bg-[#2D3136] ${post.saved ? 'text-[#1D9BD1]' : ''}`} onClick={save}>{post.saved ? '🔖 Saved' : '🔖 Save'}</button>
        {pick && (
          <div className="absolute bottom-12 left-2 z-10 flex gap-1 rounded-full border border-[#383F45] bg-[#19171D] px-3 py-1.5 shadow-lg">
            {EMO.map((e) => <button key={e} onClick={() => react(e)} className="text-2xl transition hover:scale-125">{e}</button>)}
          </div>
        )}
        {share && (
          <div className="absolute bottom-12 right-2 z-10 w-48 rounded-lg border border-[#383F45] bg-[#19171D] p-2 shadow-lg">
            {links.map(([n, u]) => <a key={n} href={u} target="_blank" rel="noopener noreferrer" className="block rounded px-2 py-1.5 text-white hover:bg-[#2D3136]">{n}</a>)}
            <button className="block w-full rounded px-2 py-1.5 text-left text-white hover:bg-[#2D3136]" onClick={() => { navigator.clipboard.writeText(url).then(() => alert('Link copied'), () => prompt('Copy this link', url)); setShare(false); }}>Copy link</button>
          </div>
        )}
      </div>
      {showC && <Comments postId={post.id} onCount={(n) => { if (n !== post.commentCount) onChange({ ...post, commentCount: n }); }} />}
    </article>
  );
};

// ---------- Infinite list of posts. query example: "category=sports&q="
export const PostList = ({ query, empty }: { query: string; empty?: string }) => {
  const { me } = useMe();
  const st = useRef({ posts: [] as any[], loading: false, more: true });
  const [, force] = useState(0);
  const end = useRef<HTMLDivElement>(null);

  async function page(reset: boolean) {
    const s = st.current;
    if (s.loading || (!reset && !s.more)) return;
    s.loading = true;
    force((n) => n + 1);
    try {
      const before = !reset && s.posts.length ? `&before=${encodeURIComponent(s.posts[s.posts.length - 1].createdAt)}` : '';
      const r = await api('GET', `/api/posts?limit=10&${query}${before}`);
      s.posts = reset ? r : [...s.posts, ...r];
      s.more = r.length === 10;
    } catch { s.more = false; }
    s.loading = false;
    force((n) => n + 1);
  }
  useEffect(() => { st.current = { posts: [], loading: false, more: true }; page(true); }, [query, me && me.id]);
  useEffect(() => {
    const el = end.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) page(false); });
    io.observe(el);
    return () => io.disconnect();
  }, [query]);

  const s = st.current;
  const upd = (p: any) => { s.posts = s.posts.map((x) => (x.id === p.id ? p : x)); force((n) => n + 1); };
  const del = (id: string) => { s.posts = s.posts.filter((x) => x.id !== id); force((n) => n + 1); };
  return (
    <div className="space-y-4">
      {s.posts.map((p) => <PostCard key={p.id} post={p} onChange={upd} onDelete={del} />)}
      {!s.loading && !s.posts.length && <p className={`${card} p-6 text-center text-[#8D9197]`}>{empty || 'No posts here yet.'}</p>}
      {s.loading && <p className="py-3 text-center text-sm text-[#8D9197]">Loading...</p>}
      <div ref={end} className="h-6" />
    </div>
  );
};

// ---------- Composer: text only, photos only, videos only, or any mix
const Composer = ({ onPosted }: { onPosted: () => void }) => {
  const { me } = useMe();
  const [text, setText] = useState('');
  const [cat, setCat] = useState('news');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const previews = useMemo(() => files.map((f) => ({ url: URL.createObjectURL(f), video: f.type.startsWith('video') })), [files]);
  const pickFiles = (e: any) => {
    const add: File[] = Array.from(e.target.files || []);
    setFiles((cur) => [...cur, ...add].slice(0, 10));
    e.target.value = '';
  };
  const submit = async () => {
    if (!text.trim() && !files.length) return;
    setBusy(true);
    setErr('');
    try {
      let media: any[] = [];
      if (files.length) {
        const up = await upload(files);
        media = up.map((f: any, i: number) => ({ url: f.url, type: files[i].type.startsWith('video') ? 'video' : 'image', name: f.name }));
      }
      await api('POST', '/api/posts', { text, category: cat, media });
      setText('');
      setFiles([]);
      onPosted();
    } catch (e: any) { setErr(e.message); }
    setBusy(false);
  };
  return (
    <div className={`${card} p-4`}>
      <div className="flex gap-3">
        <Avatar user={me} />
        <textarea className={`${field} min-h-[72px] resize-y`} placeholder={`What's happening, ${me.name.split(' ')[0]}?`} value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      {previews.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {previews.map((p, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-md bg-black">
              {p.video ? <video src={p.url} className="h-full w-full object-cover" muted /> : <img src={p.url} alt="" className="h-full w-full object-cover" />}
              <button className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 text-white" onClick={() => setFiles(files.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
        </div>
      )}
      {err && <p className="mt-2 text-sm text-red-400">{err}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className={`${btn2} cursor-pointer`}>
          📷 Photos / videos
          <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={pickFiles} />
        </label>
        <select className={`${field} w-auto`} value={cat} onChange={(e) => setCat(e.target.value)}>
          {CATS.map((c) => <option key={c} value={c}>{cap(c)}</option>)}
        </select>
        <button className={`${btn} ml-auto`} disabled={busy || (!text.trim() && !files.length)} onClick={submit}>{busy ? 'Posting...' : 'Post'}</button>
      </div>
    </div>
  );
};

// ---------- Pages
export const Feed = () => {
  const { me, needLogin } = useMe();
  const [cat, setCat] = useState('');
  const [qi, setQi] = useState('');
  const [q, setQ] = useState('');
  const [rk, setRk] = useState(0);
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-3 sm:p-4">
      {me ? <Composer onPosted={() => setRk(rk + 1)} /> : (
        <div className={`${card} p-4 text-sm text-[#B9BBBE]`}>
          You are browsing as a visitor. <button className="font-semibold text-[#1D9BD1]" onClick={needLogin}>Log in or sign up</button> to post, react, comment and save.
        </div>
      )}
      <input className={field} placeholder="Search posts (press Enter)" value={qi} onChange={(e) => setQi(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') setQ(qi); }} />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['', ...CATS].map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`shrink-0 rounded-full border px-3 py-1 text-sm ${cat === c ? 'border-[#1D9BD1] bg-[#1D9BD1] text-white' : 'border-[#383F45] text-[#B9BBBE] hover:bg-[#2D3136]'}`}>{c ? cap(c) : 'All'}</button>
        ))}
      </div>
      <PostList key={`${rk}|${cat}|${q}`} query={`category=${cat}&q=${encodeURIComponent(q)}`} empty="No posts in this category yet. Be the first!" />
    </div>
  );
};

export const PostPage = ({ id }: { id: string }) => {
  const [post, setPost] = useState<any>(null);
  const [err, setErr] = useState('');
  const { me } = useMe();
  useEffect(() => { api('GET', `/api/posts/${id}`).then(setPost).catch((e) => setErr(e.message)); }, [id, me && me.id]);
  return (
    <div className="mx-auto w-full max-w-2xl space-y-3 p-3 sm:p-4">
      <button className={btn2} onClick={() => go('feed')}>← Back to feed</button>
      {err && <p className="text-red-400">{err}</p>}
      {post && <PostCard post={post} full onChange={setPost} onDelete={() => go('feed')} />}
    </div>
  );
};

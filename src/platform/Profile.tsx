import React, { useEffect, useState } from 'react';
import { api, upload } from './api';
import { go, useMe } from './hooks';
import { Avatar, SOCIALS, btn, btn2, card, field, socialUrl } from './ui';
import { PostList } from './Feed';

// ---------- Someone's profile (members only). WhatsApp stays hidden until approved.
export const Profile = ({ id }: { id: string }) => {
  const { me, needLogin } = useMe();
  const [p, setP] = useState<any>(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('posts');
  const load = () => api('GET', '/api/users/' + id).then(setP).catch((e) => setErr(e.message));
  useEffect(() => { setP(null); setErr(''); if (me) load(); }, [id, me && me.id]);

  if (!me) return (
    <div className="mx-auto max-w-md p-6 text-center">
      <div className={`${card} p-6`}>
        <div className="text-4xl">🔒</div>
        <p className="mt-2 text-white">Profiles are for registered members.</p>
        <button className={`${btn} mt-4`} onClick={needLogin}>Log in or sign up</button>
      </div>
    </div>
  );
  if (err) return <p className="p-6 text-center text-red-400">{err}</p>;
  if (!p) return <p className="p-6 text-center text-[#8D9197]">Loading...</p>;

  const self = p.waStatus === 'self';
  const requestWa = async () => { try { await api('POST', `/api/users/${p.id}/whatsapp-request`); await load(); } catch (e: any) { alert(e.message); } };
  const socials = Object.entries(p.socials || {}).filter(([, v]) => v);
  const tabs = self ? ['posts', 'reshared', 'saved'] : ['posts', 'reshared'];
  const query = tab === 'saved' ? 'tab=saved' : `author=${p.id}&tab=${tab}`;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-3 sm:p-4">
      <div className={`${card} p-5`}>
        <div className="flex items-center gap-4">
          <Avatar user={p} size={80} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold text-white">{p.name} {p.recruiter && <span title="Verified recruiter" className="rounded bg-green-900 px-1.5 py-0.5 align-middle text-xs text-green-300">Recruiter</span>}</h1>
            {p.headline && <p className="text-[#B9BBBE]">{p.headline}</p>}
            <p className="text-xs text-[#8D9197]">{[p.location, 'Joined ' + new Date(p.joinedAt).toLocaleDateString(), p.posts + ' posts'].filter(Boolean).join(' · ')}</p>
          </div>
          {self && <button className={btn2} onClick={() => go('settings')}>Edit profile</button>}
        </div>
        {p.bio && <p className="mt-4 whitespace-pre-wrap text-sm text-[#D1D2D3]">{p.bio}</p>}
        {(socials.length > 0 || p.hasWhatsapp) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {socials.map(([k, v]) => (
              <a key={k} href={socialUrl(k, v as string)} target="_blank" rel="noopener noreferrer nofollow" className="rounded-full border border-[#383F45] px-3 py-1 text-sm text-white hover:bg-[#2D3136]">
                {(SOCIALS.find((s) => s[0] === k) || [k, k])[1]}
              </a>
            ))}
            {p.hasWhatsapp && (
              p.whatsapp
                ? <a href={`https://wa.me/${String(p.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-green-700 bg-green-900/40 px-3 py-1 text-sm text-green-300">WhatsApp: {p.whatsapp}</a>
                : p.waStatus === 'pending'
                  ? <span className="rounded-full border border-[#383F45] px-3 py-1 text-sm text-[#8D9197]">WhatsApp request sent, waiting for approval</span>
                  : <button className="rounded-full border border-[#383F45] px-3 py-1 text-sm text-white hover:bg-[#2D3136]" onClick={requestWa}>🔒 {p.waStatus === 'denied' ? 'Request WhatsApp again' : 'Request WhatsApp'}</button>
            )}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full border px-4 py-1 text-sm capitalize ${tab === t ? 'border-[#1D9BD1] bg-[#1D9BD1] text-white' : 'border-[#383F45] text-[#B9BBBE]'}`}>{t}</button>
        ))}
      </div>
      <PostList key={query} query={query} empty={tab === 'saved' ? 'You have not saved any posts yet.' : tab === 'reshared' ? 'Nothing reshared yet.' : 'No posts yet.'} />
    </div>
  );
};

// ---------- My settings: avatar, details, social links, WhatsApp requests, invites
export const Settings = () => {
  const { me, refresh } = useMe();
  const [f, setF] = useState<any>(null);
  const [soc, setSoc] = useState<any>({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [reqs, setReqs] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);

  const loadSide = () => {
    api('GET', '/api/whatsapp-requests').then(setReqs).catch(() => {});
    api('GET', '/api/invites/mine').then(setInvites).catch(() => {});
  };
  useEffect(() => {
    api('GET', '/api/me/profile').then((p) => { setF({ name: p.name, headline: p.headline, bio: p.bio, location: p.location, avatar: p.avatar }); setSoc(p.socials || {}); }).catch(() => {});
    loadSide();
  }, []);
  if (!f) return <p className="p-6 text-center text-[#8D9197]">Loading...</p>;

  const pickAvatar = async (e: any) => {
    const file: File | undefined = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMsg('Choose an image file'); return; }
    if (file.size > 8 * 1024 * 1024) { setMsg('Image must be under 8 MB'); return; }
    setBusy(true); setMsg('');
    try { const up = await upload([file]); setF({ ...f, avatar: up[0].url }); } catch (er: any) { setMsg(er.message); }
    setBusy(false);
  };
  const save = async () => {
    setBusy(true); setMsg('');
    try {
      await api('PATCH', '/api/me/profile', { ...f, socials: soc });
      // keep the chat screen's copy of my profile in step
      try {
        const us = JSON.parse(localStorage.getItem('rblink_users') || 'null');
        if (us) {
          const i = us.findIndex((u: any) => u.id === me.id);
          if (i >= 0) { us[i] = { ...us[i], name: f.name, avatar: f.avatar || us[i].avatar }; localStorage.setItem('rblink_users', JSON.stringify(us)); }
        }
      } catch { /* ignore */ }
      await refresh();
      setMsg('Saved!');
    } catch (er: any) { setMsg(er.message); }
    setBusy(false);
  };
  const answer = async (r: any, approve: boolean) => { await api('POST', '/api/whatsapp-requests/' + r.id, { approve }).catch(() => {}); loadSide(); };
  const newInvite = async () => { await api('POST', '/api/invites', {}).catch(() => {}); loadSide(); };
  const copy = (t: string) => navigator.clipboard.writeText(t).then(() => alert('Link copied'), () => prompt('Copy this link', t));

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-3 sm:p-4">
      {reqs.length > 0 && (
        <div className={`${card} border-[#1D9BD1] p-4`}>
          <h3 className="mb-2 font-semibold text-white">WhatsApp requests ({reqs.length})</h3>
          {reqs.map((r) => (
            <div key={r.id} className="flex items-center gap-3 py-1.5">
              <Avatar user={r.from} size={32} /><span className="flex-1 text-sm text-white">{r.from.name} wants to see your WhatsApp number</span>
              <button className={btn} onClick={() => answer(r, true)}>Approve</button>
              <button className={btn2} onClick={() => answer(r, false)}>Decline</button>
            </div>
          ))}
        </div>
      )}
      <div className={`${card} space-y-3 p-5`}>
        <h2 className="text-lg font-bold text-white">Edit profile</h2>
        <div className="flex items-center gap-4">
          <Avatar user={{ name: f.name, avatar: f.avatar }} size={72} />
          <div className="space-x-2">
            <label className={`${btn2} inline-block cursor-pointer`}>Upload photo<input type="file" accept="image/*" className="hidden" onChange={pickAvatar} /></label>
            {f.avatar && <button className={btn2} onClick={() => setF({ ...f, avatar: '' })}>Remove</button>}
          </div>
        </div>
        <input className={field} placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className={field} placeholder="Headline, e.g. Frontend developer at Acme" value={f.headline} onChange={(e) => setF({ ...f, headline: e.target.value })} />
        <input className={field} placeholder="Location, e.g. Lagos, Nigeria" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
        <textarea className={`${field} min-h-[90px]`} placeholder="About you" value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} />
        <h3 className="pt-2 font-semibold text-white">Social links</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {SOCIALS.map(([k, label, ph]) => (
            <label key={k} className="text-xs text-[#8D9197]">{label}
              <input className={`${field} mt-1`} placeholder={ph} value={soc[k] || ''} onChange={(e) => setSoc({ ...soc, [k]: e.target.value })} />
            </label>
          ))}
        </div>
        <p className="text-xs text-[#8D9197]">🔒 Your WhatsApp number is never shown publicly. People must request it and you approve each request.</p>
        <div className="flex items-center gap-3">
          <button className={btn} disabled={busy} onClick={save}>{busy ? 'Working...' : 'Save changes'}</button>
          {msg && <span className={`text-sm ${msg === 'Saved!' ? 'text-green-400' : 'text-red-400'}`}>{msg}</span>}
        </div>
      </div>
      <div className={`${card} space-y-3 p-5`}>
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-white">Invite friends</h2><button className={btn} onClick={newInvite}>New invite link</button></div>
        {invites.length === 0 && <p className="text-sm text-[#8D9197]">Create a link and share it. You will see how many people join through it.</p>}
        {invites.map((i) => (
          <div key={i.token} className="flex flex-wrap items-center gap-2 rounded-md bg-[#222529] p-2 text-sm">
            <span className="min-w-0 flex-1 truncate text-white">{i.link}</span>
            <span className="text-xs text-[#8D9197]">{i.referred} joined</span>
            <button className={btn2} onClick={() => copy(i.link)}>Copy</button>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { api, upload } from './api';
import { go, useMe } from './hooks';
import { Avatar, ago, btn, btn2, card, field } from './ui';
import { Media } from './Feed';
import { COUNTRIES, CURRENCIES, money } from './geo';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const LoginBlock = ({ text }: { text: string }) => {
  const { needLogin } = useMe();
  return (
    <div className="mx-auto max-w-md p-6 text-center">
      <div className={`${card} p-6`}>
        <div className="text-4xl">🔒</div>
        <p className="mt-2 text-white">{text}</p>
        <button className={`${btn} mt-4`} onClick={needLogin}>Log in or sign up</button>
      </div>
    </div>
  );
};

// ---------- One product card in the grid
const ListingCard = ({ m }: { m: any }) => (
  <button onClick={() => go('market/' + m.id)} className={`${card} overflow-hidden text-left hover:border-[#1D9BD1]`}>
    <div className="relative aspect-square bg-[#222529]">
      {m.images && m.images[0]
        ? <img src={m.images[0]} loading="lazy" alt="" className="h-full w-full object-cover" />
        : <div className="flex h-full items-center justify-center text-4xl">🛍️</div>}
      {m.status === 'sold' && <span className="absolute left-2 top-2 rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">SOLD</span>}
      {m.condition === 'used' && <span className="absolute right-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">Used</span>}
    </div>
    <div className="p-3">
      <div className="font-bold text-white">{money(m.price, m.currency)}</div>
      <div className="truncate text-sm text-[#D1D2D3]">{m.title}</div>
      <div className="truncate text-xs text-[#8D9197]">📍 {[m.city, m.country].filter(Boolean).join(', ')}</div>
    </div>
  </button>
);

// ---------- Browse + search + filters (everyone can look; only members can sell)
export const Market = ({ mine }: { mine?: boolean }) => {
  const { me, needLogin } = useMe();
  const [cats, setCats] = useState<string[]>([]);
  const [f, setF] = useState({ q: '', category: '', country: '', city: '', condition: '', min: '', max: '', sort: 'new' });
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showF, setShowF] = useState(false);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  const qs = (offset: number) => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v as string); });
    if (mine && me) p.set('seller', me.id);
    p.set('limit', '24');
    p.set('offset', String(offset));
    return p.toString();
  };
  const fetchPage = async (offset: number) => {
    setLoading(true);
    try {
      const r = await api('GET', '/api/market?' + qs(offset));
      setItems((cur) => (offset ? [...cur, ...r.items] : r.items));
      setTotal(r.total);
    } catch { /* keep what we have */ }
    setLoading(false);
  };
  useEffect(() => { api('GET', '/api/market/categories').then(setCats).catch(() => {}); }, []);
  useEffect(() => {
    if (mine && !me) return;
    const t = setTimeout(() => fetchPage(0), 300);
    return () => clearTimeout(t);
  }, [f, mine, me && me.id]);

  if (mine && !me) return <LoginBlock text="Log in to see your listings." />;
  const filtersOn = ['category', 'country', 'city', 'condition', 'min', 'max'].some((k) => (f as any)[k]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-3 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-xl font-bold text-white">{mine ? 'My listings' : 'Marketplace'}</h1>
        {me && <button className={btn2} onClick={() => go(mine ? 'market' : 'market/mine')}>{mine ? 'Browse all' : 'My listings'}</button>}
        <button className={btn} onClick={() => (me ? go('market/new') : needLogin())}>+ Sell an item</button>
      </div>
      <div className="flex gap-2">
        <input className={field} placeholder="Search items, e.g. iPhone, sofa, laptop" value={f.q} onChange={set('q')} />
        <button className={btn2} onClick={() => setShowF(!showF)}>Filters{filtersOn ? ' •' : ''}</button>
      </div>
      {showF && (
        <div className={`${card} grid gap-2 p-3 sm:grid-cols-3`}>
          <select className={field} value={f.category} onChange={set('category')}>
            <option value="">All categories</option>
            {cats.map((c) => <option key={c} value={c}>{cap(c)}</option>)}
          </select>
          <select className={field} value={f.country} onChange={set('country')}>
            <option value="">All countries</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input className={field} placeholder="City (optional)" value={f.city} onChange={set('city')} />
          <select className={field} value={f.condition} onChange={set('condition')}>
            <option value="">New or used</option><option value="new">New</option><option value="used">Used</option>
          </select>
          <input className={field} type="number" min="0" placeholder="Min price" value={f.min} onChange={set('min')} />
          <input className={field} type="number" min="0" placeholder="Max price" value={f.max} onChange={set('max')} />
          <select className={field} value={f.sort} onChange={set('sort')}>
            <option value="new">Newest first</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option>
          </select>
          <button className={btn2} onClick={() => setF({ q: f.q, category: '', country: '', city: '', condition: '', min: '', max: '', sort: 'new' })}>Clear filters</button>
        </div>
      )}
      <p className="text-xs text-[#8D9197]">{loading && !items.length ? 'Searching...' : `${total} item${total === 1 ? '' : 's'} found`}</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {items.map((m) => <ListingCard key={m.id} m={m} />)}
      </div>
      {!loading && !items.length && (
        <div className={`${card} p-8 text-center text-[#8D9197]`}>
          {mine ? 'You have not listed anything yet.' : 'No items match your search.'}
          <div className="mt-3"><button className={btn} onClick={() => (me ? go('market/new') : needLogin())}>Sell the first one</button></div>
        </div>
      )}
      {items.length < total && <div className="text-center"><button className={btn2} disabled={loading} onClick={() => fetchPage(items.length)}>{loading ? 'Loading...' : 'Load more'}</button></div>}
    </div>
  );
};

// ---------- One listing
export const ListingPage = ({ id }: { id: string }) => {
  const { me, needLogin } = useMe();
  const [m, setM] = useState<any>(null);
  const [err, setErr] = useState('');
  useEffect(() => { setM(null); api('GET', '/api/market/' + id).then(setM).catch((e) => setErr(e.message)); }, [id]);
  if (err) return <p className="p-6 text-center text-red-400">{err}</p>;
  if (!m) return <p className="p-6 text-center text-[#8D9197]">Loading...</p>;

  const own = me && (me.id === m.sellerId || me.role === 'owner' || me.role === 'admin');
  const setStatus = async (status: string) => {
    try { const u = await api('PATCH', '/api/market/' + id, { status }); setM({ ...m, ...u }); } catch (e: any) { alert(e.message); }
  };
  const remove = async () => {
    if (!confirm('Delete this listing for good?')) return;
    try { await api('DELETE', '/api/market/' + id); go('market'); } catch (e: any) { alert(e.message); }
  };
  const report = async () => {
    if (!me) { needLogin(); return; }
    const reason = prompt('What is wrong with this listing?');
    if (!reason) return;
    try { await api('POST', '/api/report', { type: 'listing', target: id, reason }); alert('Thank you. Our team will review it.'); } catch (e: any) { alert(e.message); }
  };
  const share = () => {
    const url = `${location.origin}/#/market/${id}`;
    navigator.clipboard.writeText(url).then(() => alert('Link copied'), () => prompt('Copy this link', url));
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-3 p-3 sm:p-4">
      <button className={btn2} onClick={() => go('market')}>← Back to marketplace</button>
      <div className="grid gap-4 md:grid-cols-2">
        <div className={`${card} overflow-hidden`}>
          {m.images.length
            ? <Media items={m.images.map((u: string) => ({ url: u, type: 'image' }))} />
            : <div className="flex aspect-square items-center justify-center bg-[#222529] text-6xl">🛍️</div>}
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-2xl font-extrabold text-white">{money(m.price, m.currency)} {m.status === 'sold' && <span className="ml-2 rounded bg-red-600 px-2 py-0.5 align-middle text-xs">SOLD</span>}</div>
            <h1 className="text-lg text-[#D1D2D3]">{m.title}</h1>
            <p className="mt-1 text-xs text-[#8D9197]">{cap(m.condition)} · {cap(m.category)} · 📍 {[m.city, m.country].filter(Boolean).join(', ')} · {ago(m.createdAt)}</p>
          </div>
          {m.description && <p className="whitespace-pre-wrap text-sm text-[#D1D2D3]">{m.description}</p>}
          <div className={`${card} flex items-center gap-3 p-3`}>
            <Avatar user={m.seller} size={44} />
            <div className="min-w-0 flex-1"><div className="text-xs text-[#8D9197]">Seller</div><div className="truncate font-semibold text-white">{m.seller.name}</div></div>
            {me
              ? (me.id !== m.sellerId && <button className={btn} onClick={() => go('profile/' + m.sellerId)}>Contact seller</button>)
              : <button className={btn} onClick={needLogin}>Log in to contact</button>}
          </div>
          {own && (
            <div className="flex flex-wrap gap-2">
              <button className={btn2} onClick={() => setStatus(m.status === 'sold' ? 'active' : 'sold')}>{m.status === 'sold' ? 'Relist as available' : 'Mark as sold'}</button>
              <button className={`${btn2} text-red-400`} onClick={remove}>Delete</button>
            </div>
          )}
          <div className="flex gap-2"><button className={btn2} onClick={share}>↗ Share</button><button className={btn2} onClick={report}>🚩 Report</button></div>
          <div className="rounded-lg bg-[#222529] p-3 text-xs text-[#8D9197]">
            <b className="text-[#D1D2D3]">Stay safe:</b> meet in a public place, inspect the item before paying, and never send money in advance to someone you have not met.
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Sell an item (members only)
export const SellForm = () => {
  const { me } = useMe();
  const [f, setF] = useState({ title: '', price: '', currency: 'USD', category: 'other', condition: 'new', country: '', city: '', description: '' });
  const [files, setFiles] = useState<File[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const previews = useMemo(() => files.map((x) => URL.createObjectURL(x)), [files]);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  useEffect(() => { api('GET', '/api/market/categories').then(setCats).catch(() => {}); }, []);
  if (!me) return <LoginBlock text="Log in to sell items on the marketplace." />;

  const pick = (e: any) => {
    const add: File[] = Array.from(e.target.files || []);
    setFiles((cur) => [...cur, ...add.filter((x) => x.type.startsWith('image/'))].slice(0, 10));
    e.target.value = '';
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const images = files.length ? (await upload(files)).map((x: any) => x.url) : [];
      const m = await api('POST', '/api/market', { ...f, price: Number(f.price), images });
      go('market/' + m.id);
    } catch (er: any) { setErr(er.message); }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-xl space-y-3 p-3 sm:p-4">
      <button type="button" className={btn2} onClick={() => go('market')}>← Back</button>
      <div className={`${card} space-y-3 p-5`}>
        <h1 className="text-xl font-bold text-white">Sell an item</h1>
        <input className={field} placeholder="What are you selling? (title)" value={f.title} onChange={set('title')} required maxLength={120} />
        <div className="flex gap-2">
          <input className={field} type="number" min="0" step="any" placeholder="Price" value={f.price} onChange={set('price')} required />
          <select className={`${field} w-28`} value={f.currency} onChange={set('currency')}>{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <select className={field} value={f.category} onChange={set('category')}>{cats.map((c) => <option key={c} value={c}>{cap(c)}</option>)}</select>
          <select className={field} value={f.condition} onChange={set('condition')}><option value="new">Brand new</option><option value="used">Used</option></select>
          <select className={field} value={f.country} onChange={set('country')} required><option value="">Choose country</option>{COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          <input className={field} placeholder="City" value={f.city} onChange={set('city')} />
        </div>
        <textarea className={`${field} min-h-[110px]`} placeholder="Describe it: condition, size, reason for selling..." value={f.description} onChange={set('description')} />
        <div>
          <label className={`${btn2} inline-block cursor-pointer`}>📷 Add photos (up to 10)<input type="file" accept="image/*" multiple className="hidden" onChange={pick} /></label>
          {previews.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
              {previews.map((u, i) => (
                <div key={u} className="relative aspect-square overflow-hidden rounded-md bg-black">
                  <img src={u} alt="" className="h-full w-full object-cover" />
                  {i === 0 && <span className="absolute bottom-0 left-0 bg-black/70 px-1 text-[10px] text-white">Cover</span>}
                  <button type="button" className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 text-white" onClick={() => setFiles(files.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button className={`${btn} w-full py-2`} disabled={busy}>{busy ? 'Publishing...' : 'Publish listing'}</button>
      </div>
    </form>
  );
};

// ---------- Picks the right marketplace screen from the address (#/market, #/market/new, #/market/mine, #/market/ID)
export const MarketRouter = ({ arg }: { arg: string }) => {
  if (arg === 'new') return <SellForm />;
  if (arg === 'mine') return <Market mine />;
  if (arg) return <ListingPage id={arg} />;
  return <Market />;
};

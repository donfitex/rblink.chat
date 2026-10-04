import React, { useCallback, useEffect, useRef, useState } from 'react';
import { startSync, stopSync, ensureUser } from './sync';

type Me = { id: string; name: string; email: string; avatar: string; role: string };
const post = (p: string, b?: unknown) =>
  fetch(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b || {}) });
const input = 'w-full rounded-md bg-[#222529] border border-[#383F45] px-3 py-2 text-sm text-white outline-none focus:border-[#1D9BD1]';

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [gid, setGid] = useState('');
  const [key, setKey] = useState(0);
  const gbtn = useRef<HTMLDivElement>(null);

  // Reload the workspace after remote changes, but never while the user is typing.
  const remount = useCallback(() => {
    const go = () => {
      const a = document.activeElement as HTMLElement | null;
      if (a && (a.tagName === 'TEXTAREA' || a.tagName === 'INPUT' || a.isContentEditable)) setTimeout(go, 1000);
      else setKey((k) => k + 1);
    };
    go();
  }, []);

  const enter = useCallback(async (u: Me) => {
    await startSync(remount);
    ensureUser(u);
    setMe(u);
    setReady(true);
  }, [remount]);

  useEffect(() => {
    (async () => {
      try { setGid((await (await fetch('/api/config')).json()).googleClientId || ''); } catch { /* ignore */ }
      try {
        const r = await fetch('/api/auth/me');
        if (r.ok) return await enter((await r.json()).user);
      } catch { /* not logged in */ }
      setReady(true);
    })();
  }, [enter]);

  const submit = async (path: string, body: unknown) => {
    setBusy(true); setErr('');
    try {
      const r = await post(path, body), j = await r.json();
      if (r.ok) await enter(j.user); else setErr(j.error || 'Something went wrong');
    } catch { setErr('Cannot reach the server'); }
    setBusy(false);
  };

  useEffect(() => {
    if (!gid || me || !ready) return;
    const w = window as any;
    const init = () => {
      w.google.accounts.id.initialize({ client_id: gid, callback: (r: any) => submit('/api/auth/google', { credential: r.credential }) });
      if (gbtn.current) w.google.accounts.id.renderButton(gbtn.current, { theme: 'outline', size: 'large', width: 300 });
    };
    if (w.google?.accounts) return init();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = init;
    document.head.appendChild(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gid, me, ready, mode]);

  useEffect(() => {
    const out = async () => { await post('/api/auth/logout'); stopSync(); location.reload(); };
    window.addEventListener('rblink:logout', out);
    return () => window.removeEventListener('rblink:logout', out);
  }, []);

  if (!ready) return <div className="h-screen flex items-center justify-center bg-[#1A1D21] text-[#8D9197]">Loading rblink.chat...</div>;
  if (me) return <React.Fragment key={key}>{children}</React.Fragment>;

  return (
    <div className="h-screen flex items-center justify-center bg-[#1A1D21] p-4">
      <form
        onSubmit={(e) => { e.preventDefault(); submit(mode === 'login' ? '/api/auth/login' : '/api/auth/signup', form); }}
        className="w-full max-w-sm rounded-xl bg-[#19171D] border border-[#383F45] p-6 space-y-3 text-white"
      >
        <h1 className="text-2xl font-bold">rblink.chat</h1>
        <p className="text-sm text-[#8D9197]">{mode === 'login' ? 'Log in to your workspace' : 'Create your account'}</p>
        {mode === 'signup' && <input className={input} placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />}
        <input className={input} type="email" placeholder="Email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className={input} type="password" placeholder="Password (8+ characters)" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        {mode === 'signup' && <input className={input} type="password" placeholder="Confirm password" autoComplete="new-password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />}
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button disabled={busy} className="w-full rounded-md bg-[#1D9BD1] py-2 font-semibold disabled:opacity-60">{mode === 'login' ? 'Log in' : 'Sign up'}</button>
        {gid && <><div className="text-center text-xs text-[#8D9197]">or</div><div ref={gbtn} className="flex justify-center" /></>}
        <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr(''); }} className="w-full text-sm text-[#1D9BD1] hover:underline">
          {mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}
        </button>
      </form>
    </div>
  );
};

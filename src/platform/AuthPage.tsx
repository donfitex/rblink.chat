import React, { useEffect, useRef, useState } from 'react';
import { api } from './api';
import { go } from './hooks';
import { btn, field } from './ui';

const TITLES: any = {
  login: 'Welcome back', signup: 'Create your account', join: "You've been invited", phone: 'Sign in with your phone',
  forgot: 'Reset your password', reset: 'Choose a new password'
};

export const AuthPage = ({ mode, token, gid, onAuthed }: { mode: string; token: string; gid: string; onAuthed: (u: any) => void }) => {
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '', phone: '', code: '' });
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [devLink, setDevLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(1);
  const [needName, setNeedName] = useState(false);
  const [inviter, setInviter] = useState('');
  const gbtn = useRef<HTMLDivElement>(null);
  const [gmsg, setGmsg] = useState('');
  const invite = mode === 'join' ? token : sessionStorage.getItem('rblink_invite') || '';
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    if (mode === 'join' && token) {
      sessionStorage.setItem('rblink_invite', token);
      api('GET', '/api/invites/' + token).then((r) => setInviter(r.inviter)).catch(() => setErr('This invite link is invalid or has expired. You can still sign up.'));
    }
  }, [mode, token]);

  const run = async (fn: () => Promise<any>) => {
    setBusy(true); setErr(''); setInfo('');
    try { await fn(); } catch (e: any) {
      if (e.data && e.data.needName) setNeedName(true);
      setErr(e.message);
    }
    setBusy(false);
  };
  const done = (r: any) => { sessionStorage.removeItem('rblink_invite'); onAuthed(r.user); };

  // Google button (shown on login, signup and invite pages when the server has GOOGLE_CLIENT_ID)
  useEffect(() => {
    if (!gid || !['login', 'signup', 'join'].includes(mode)) return;
    const w = window as any;
    const init = () => {
      w.google.accounts.id.initialize({
        client_id: gid,
        callback: (r: any) => run(async () => done(await api('POST', '/api/auth/google', { credential: r.credential, invite })))
      });
      if (gbtn.current) w.google.accounts.id.renderButton(gbtn.current, { theme: 'outline', size: 'large', width: 300, text: mode === 'login' ? 'signin_with' : 'signup_with' });
    };
    if (w.google && w.google.accounts) { init(); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = init;
    s.onerror = () => setGmsg('Could not load Google sign-in. Check your internet connection and try again.');
    document.head.appendChild(s);
  }, [gid, mode]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') return run(async () => done(await api('POST', '/api/auth/login', { email: f.email, password: f.password })));
    if (mode === 'signup' || mode === 'join') {
      if (f.password !== f.confirm) { setErr('Passwords do not match'); return; }
      return run(async () => done(await api('POST', '/api/auth/signup', { name: f.name, email: f.email, password: f.password, confirmPassword: f.confirm, invite })));
    }
    if (mode === 'forgot') {
      return run(async () => {
        const r = await api('POST', '/api/auth/forgot', { email: f.email });
        setInfo(r.message);
        if (r.devLink) setDevLink(r.devLink);
      });
    }
    if (mode === 'reset') {
      if (f.password !== f.confirm) { setErr('Passwords do not match'); return; }
      return run(async () => done(await api('POST', '/api/auth/reset', { token, password: f.password, confirmPassword: f.confirm })));
    }
    if (mode === 'phone') {
      if (step === 1) {
        return run(async () => {
          const r = await api('POST', '/api/auth/phone/start', { phone: f.phone.replace(/\s/g, '') });
          setStep(2);
          setInfo(r.devCode ? `Test mode: your code is ${r.devCode} (real SMS is not set up yet).` : 'We sent you a 6-digit code by SMS.');
        });
      }
      return run(async () => done(await api('POST', '/api/auth/phone/verify', { phone: f.phone.replace(/\s/g, ''), code: f.code, name: f.name, invite })));
    }
  };

  const link = (to: string, label: string) => (
    <button type="button" onClick={() => go(to)} className="text-sm text-[#1D9BD1] hover:underline">{label}</button>
  );
  const showName = mode === 'signup' || mode === 'join' || (mode === 'phone' && step === 2 && needName);
  const showEmail = ['login', 'signup', 'join', 'forgot'].includes(mode);
  const showPw = ['login', 'signup', 'join', 'reset'].includes(mode);
  const showConfirm = ['signup', 'join', 'reset'].includes(mode);
  const action = { login: 'Log in', signup: 'Create account', join: 'Join now', forgot: 'Send reset link', reset: 'Save new password', phone: step === 1 ? 'Send code' : 'Verify and continue' } as any;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-sm items-center p-4">
      <form onSubmit={submit} className="w-full space-y-3 rounded-xl border border-[#383F45] bg-[#19171D] p-6 text-white">
        <h1 className="text-2xl font-bold">{TITLES[mode] || 'Welcome'}</h1>
        {mode === 'join' && inviter && <p className="text-sm text-[#8D9197]"><b className="text-white">{inviter}</b> invited you to rblink.chat.</p>}
        {['login', 'signup', 'join'].includes(mode) && (
          <div className="space-y-2">
            {gid ? (
              <div ref={gbtn} className="flex min-h-[44px] justify-center" />
            ) : (
              <button
                type="button"
                onClick={() => setGmsg('Google sign-in is not switched on yet. The site owner must add GOOGLE_CLIENT_ID to the .env file and restart the server.')}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-[#383F45] bg-white py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100"
              >
                <span className="text-base font-bold text-[#4285F4]">G</span> Continue with Google
              </button>
            )}
            {gmsg && <p className="text-xs text-amber-400">{gmsg}</p>}
            <div className="flex items-center gap-2 text-xs text-[#8D9197]"><span className="h-px flex-1 bg-[#383F45]" />or use email<span className="h-px flex-1 bg-[#383F45]" /></div>
          </div>
        )}
        {showName && <input className={field} placeholder="Full name" value={f.name} onChange={set('name')} required />}
        {showEmail && <input className={field} type="email" placeholder="Email" autoComplete="email" value={f.email} onChange={set('email')} required />}
        {mode === 'phone' && <input className={field} placeholder="Phone with country code, e.g. +2348012345678" value={f.phone} onChange={set('phone')} disabled={step === 2} required />}
        {mode === 'phone' && step === 2 && <input className={field} placeholder="6-digit code" inputMode="numeric" maxLength={6} value={f.code} onChange={set('code')} required />}
        {showPw && <input className={field} type="password" placeholder={mode === 'reset' ? 'New password (8+ characters)' : 'Password (8+ characters)'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={f.password} onChange={set('password')} required />}
        {showConfirm && <input className={field} type="password" placeholder="Confirm password" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} required />}
        {err && <p className="text-sm text-red-400">{err}</p>}
        {info && <p className="text-sm text-green-400">{info}</p>}
        {devLink && <p className="break-all text-xs text-[#8D9197]">Test mode (email not set up yet): <a className="text-[#1D9BD1] underline" href={devLink}>open reset link</a></p>}
        <button disabled={busy} className={`${btn} w-full py-2`}>{busy ? 'Please wait...' : action[mode]}</button>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {mode === 'login' && <>{link('forgot', 'Forgot password?')}{link('phone', 'Use phone number')}{link('signup', 'Create account')}</>}
          {(mode === 'signup' || mode === 'join') && <>{link('login', 'Have an account? Log in')}{link('phone', 'Use phone number')}</>}
          {mode === 'phone' && <>{link('login', 'Use email instead')}{link('signup', 'Create account')}</>}
          {(mode === 'forgot' || mode === 'reset') && link('login', 'Back to log in')}
        </div>
      </form>
    </div>
  );
};

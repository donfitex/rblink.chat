import React, { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import { MeCtx, go, useRoute } from './hooks';
import { Avatar, btn, btn2, card } from './ui';
import { stopSync } from '../auth/sync';
import { ChatGate } from '../auth/AuthGate';
import { ChatProvider } from '../context/ChatContext';
import { AppLayout } from '../components/layout/AppLayout';
import { RemindersRunner } from '../auth/Reminders';
import { AuthPage } from './AuthPage';
import { Feed, PostPage } from './Feed';
import { Groups, People } from './People';
import { Profile, Settings } from './Profile';
import { MarketRouter } from './Market';
import { JobsRouter } from './Jobs';
import { LiveLobby, MeetLobby } from './Meet';
import { RoomPage } from './Room';
import { AIPanel } from './AIPanel';

const AUTH_PAGES = ['login', 'signup', 'join', 'phone', 'forgot', 'reset'];

export const Shell = () => {
  const route = useRoute();
  const [me, setMe] = useState<any>(undefined); // undefined = still checking
  const [gid, setGid] = useState('');
  const [ask, setAsk] = useState(false);
  const [reqs, setReqs] = useState(0);
  const [welcome, setWelcome] = useState(false);

  const refresh = useCallback(async () => {
    try { setMe((await api('GET', '/api/auth/me')).user); } catch { setMe(null); }
  }, []);
  useEffect(() => {
    api('GET', '/api/config').then((c) => setGid(c.googleClientId || '')).catch(() => {});
    refresh();
  }, [refresh]);

  // In-app notification: pending WhatsApp requests
  useEffect(() => {
    if (!me) { setReqs(0); return; }
    const f = () => api('GET', '/api/whatsapp-requests').then((r) => setReqs(r.length)).catch(() => {});
    f();
    const t = setInterval(f, 30000);
    return () => clearInterval(t);
  }, [me && me.id]);

  // First-time welcome
  useEffect(() => {
    if (me && !localStorage.getItem('rblink_welcomed_' + me.id)) setWelcome(true);
  }, [me && me.id]);

  const [pathq, qs] = route.split('?');
  const parts = pathq.split('/');
  const page = parts[0] || 'feed';
  const arg = parts[1] || '';
  const query = new URLSearchParams(qs || '');

  useEffect(() => { if (me && AUTH_PAGES.includes(page)) go('feed'); }, [me, page]);

  const needLogin = useCallback(() => setAsk(true), []);
  const logout = async () => {
    try { await api('POST', '/api/auth/logout'); } catch { /* ignore */ }
    stopSync();
    location.hash = '/feed';
    location.reload();
  };
  const closeWelcome = (to?: string) => {
    localStorage.setItem('rblink_welcomed_' + me.id, '1');
    setWelcome(false);
    if (to) go(to);
  };

  if (me === undefined) return <div className="flex h-full items-center justify-center bg-[#1A1D21] text-[#8D9197]">Loading rblink.chat...</div>;

  const nav: [string, string][] = [['feed', 'Feed'], ['market', 'Market'], ['jobs', 'Jobs'], ['meet', 'Meet'], ['live', 'Live'], ['people', 'People'], ['groups', 'Groups']];
  if (me) nav.push(['chat', 'Chat']);

  let body: React.ReactNode;
  if (AUTH_PAGES.includes(page)) {
    body = <AuthPage key={page} mode={page} token={page === 'reset' ? query.get('token') || '' : arg} gid={gid} onAuthed={(u) => { setMe(u); go('feed'); }} />;
  } else if (page === 'post' && arg) body = <PostPage id={arg} />;
  else if (page === 'market') body = <MarketRouter arg={arg} />;
  else if (page === 'jobs') body = <JobsRouter arg={arg} />;
  else if (page === 'meet') body = <MeetLobby />;
  else if (page === 'live') body = <LiveLobby />;
  else if (page === 'room' && arg) body = <RoomPage key={arg} code={arg} />;
  else if (page === 'people') body = <People />;
  else if (page === 'groups') body = <Groups />;
  else if (page === 'profile' && arg) body = <Profile id={arg} />;
  else if (page === 'settings') body = me ? <Settings /> : <AuthPage mode="login" token="" gid={gid} onAuthed={(u) => setMe(u)} />;
  else if (page === 'chat') {
    body = me ? (
      <ChatGate me={me}>
        <ChatProvider>
          <RemindersRunner />
          <AppLayout />
        </ChatProvider>
      </ChatGate>
    ) : (
      <div className="mx-auto max-w-md p-6 text-center"><div className={`${card} p-6`}><div className="text-4xl">🔒</div><p className="mt-2 text-white">Chat is for registered members.</p><button className={`${btn} mt-4`} onClick={needLogin}>Log in or sign up</button></div></div>
    );
  } else body = <Feed />;

  return (
    <MeCtx.Provider value={{ me, needLogin, refresh }}>
      <div className="flex h-full w-full flex-col bg-[#1A1D21] text-[#D1D2D3]" style={{ height: '100vh' }}>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#383F45] bg-[#19171D] px-3">
          <button onClick={() => go('feed')} className="text-lg font-extrabold text-white">r<span className="text-[#1D9BD1]">blink</span>.chat</button>
          <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {nav.map(([k, label]) => (
              <button key={k} onClick={() => go(k)} className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${page === k || (k === 'feed' && !AUTH_PAGES.concat(['market', 'jobs', 'meet', 'live', 'room', 'people', 'groups', 'chat', 'profile', 'settings']).includes(page)) ? 'bg-[#2D3136] text-white' : 'text-[#B9BBBE] hover:bg-[#2D3136]'}`}>{label}</button>
            ))}
          </nav>
          {me ? (
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={() => go('settings')} className="relative flex items-center gap-2 rounded-md px-1 py-1 hover:bg-[#2D3136]" title="Profile and settings">
                <Avatar user={me} size={32} />
                {reqs > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">{reqs}</span>}
              </button>
              <button onClick={() => go('profile/' + me.id)} className="hidden text-sm text-white hover:underline sm:block">{me.name.split(' ')[0]}</button>
              <button onClick={logout} className={btn2}>Log out</button>
            </div>
          ) : (
            <div className="flex shrink-0 gap-2">
              <button onClick={() => go('login')} className={btn2}>Log in</button>
              <button onClick={() => go('signup')} className={btn}>Sign up</button>
            </div>
          )}
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">{body}</main>
      </div>
      {me && page !== 'room' && <AIPanel route={route} />}
      {ask && !me && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setAsk(false)}>
          <div className={`${card} w-full max-w-sm p-6 text-center`} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white">Join the conversation</h3>
            <p className="mt-1 text-sm text-[#8D9197]">Log in or create a free account to post, react, comment and see profiles.</p>
            <div className="mt-4 flex justify-center gap-2">
              <button className={btn2} onClick={() => { setAsk(false); go('login'); }}>Log in</button>
              <button className={btn} onClick={() => { setAsk(false); go('signup'); }}>Sign up</button>
            </div>
          </div>
        </div>
      )}
      {welcome && me && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className={`${card} w-full max-w-md p-6`}>
            <h3 className="text-xl font-bold text-white">Welcome, {me.name.split(' ')[0]}! 🎉</h3>
            <ul className="mt-3 space-y-2 text-sm text-[#D1D2D3]">
              <li>1. Add a photo and your social links in your profile.</li>
              <li>2. Share your first post in the Feed and pick a category.</li>
              <li>3. Invite friends with your personal invite link.</li>
              {(me.role === 'owner' || me.role === 'admin') && <li>4. You are the workspace {me.role}: you will approve recruiters and moderate content.</li>}
            </ul>
            <div className="mt-5 flex justify-end gap-2">
              <button className={btn2} onClick={() => closeWelcome()}>Later</button>
              <button className={btn} onClick={() => closeWelcome('settings')}>Set up my profile</button>
            </div>
          </div>
        </div>
      )}
    </MeCtx.Provider>
  );
};

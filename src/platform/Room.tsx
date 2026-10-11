import React, { useEffect, useRef, useState } from 'react';
import { api, upload } from './api';
import { go, useMe } from './hooks';
import { Avatar, btn, btn2, card, field } from './ui';
import { VoiceRecorder } from './VoiceRecorder';

const QUICK = ['👍', '❤️', '😂', '👏', '🔥', '🎉'];

// One person's video (or avatar when the camera is off / audio-only). The element also plays their sound.
const Tile = ({ stream, name, avatar, state, self }: { stream: MediaStream | null; name: string; avatar: string; state: any; self?: boolean }) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (ref.current && ref.current.srcObject !== stream) ref.current.srcObject = stream; }, [stream]);
  const hasVideo = !!stream && stream.getVideoTracks().length > 0 && !state.cameraOff;
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-[#0f1114]">
      <video ref={ref} autoPlay playsInline muted={!!self} className={`h-full w-full object-cover ${hasVideo ? '' : 'hidden'}`} />
      {!hasVideo && <div className="absolute inset-0 flex items-center justify-center"><Avatar user={{ name, avatar }} size={72} /></div>}
      <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
        {state.muted ? '🔇' : '🎙'} {name}{self ? ' (you)' : ''}{state.hand ? ' ✋' : ''}{state.sharing ? ' 🖥' : ''}
      </div>
    </div>
  );
};

// ---------- The live call: WebRTC between browsers, signaling over the secure WebSocket
const Call = ({ info, me, opts }: { info: any; me: any; opts: { micOff: boolean; camOff: boolean } }) => {
  const live = info.type === 'live';
  const [peers, setPeers] = useState<Record<string, any>>({});
  const [streams, setStreams] = useState<Record<string, MediaStream>>({});
  const [localView, setLocalView] = useState<MediaStream | null>(null);
  const [mine, setMine] = useState<any>({ speaker: info.type === 'meeting' || info.isHost, muted: opts.micOff, cameraOff: opts.camOff, hand: false, sharing: false });
  const [chat, setChat] = useState<any[]>([]);
  const [panel, setPanel] = useState<string>(live ? 'chat' : '');
  const [note, setNote] = useState('');
  const [ended, setEnded] = useState('');
  const [text, setText] = useState('');
  const act = useRef<any>({});
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { if (chatEnd.current) chatEnd.current.scrollIntoView(); }, [chat.length, panel]);

  useEffect(() => {
    let dead = false;
    let ws: WebSocket | null = null;
    let local: MediaStream | null = null;
    let screen: MediaStream | null = null;
    let my: any = { ...mine };
    const pcs = new Map<string, RTCPeerConnection>();
    const pend = new Map<string, any[]>();
    const peersR: Record<string, any> = {};

    const wsend = (type: string, payload: any) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type, payload })); };
    const sig = (to: string, data: any) => wsend('rtc:signal', { to, data });
    const pushMy = (patch: any) => { my = { ...my, ...patch }; setMine(my); wsend('rtc:state', { muted: my.muted, cameraOff: my.cameraOff, hand: my.hand, sharing: my.sharing }); };
    const peerSpeaker = (pid: string) => !!(peersR[pid] && peersR[pid].state && peersR[pid].state.speaker);
    const needConn = (pid: string) => my.speaker || peerSpeaker(pid);
    const iInit = (pid: string) => {
      const ps = peerSpeaker(pid);
      if (my.speaker && !ps) return true;
      if (!my.speaker && ps) return false;
      return me.id < pid;
    };

    async function acquire() {
      if (local || !my.speaker) return;
      const wantVideo = info.mode === 'video';
      let st: MediaStream | null = null;
      try { st = await navigator.mediaDevices.getUserMedia({ audio: true, video: wantVideo }); } catch {
        if (wantVideo) { try { st = await navigator.mediaDevices.getUserMedia({ audio: true }); setNote('Camera not available. You joined with audio only.'); } catch { /* handled below */ } }
      }
      if (!st) { setNote('No microphone access. You can still watch, listen and chat.'); return; }
      if (dead) { st.getTracks().forEach((t) => t.stop()); return; }
      st.getAudioTracks().forEach((t) => { t.enabled = !my.muted; });
      st.getVideoTracks().forEach((t) => { t.enabled = !my.cameraOff; });
      local = st;
      setLocalView(st);
    }
    function stopLocal() {
      if (local) local.getTracks().forEach((t) => t.stop());
      if (screen) screen.getTracks().forEach((t) => t.stop());
      local = null; screen = null;
      setLocalView(null);
      my = { ...my, sharing: false };
    }
    function closePc(pid: string) {
      const pc = pcs.get(pid);
      if (pc) { pc.onicecandidate = null; pc.ontrack = null; pc.onconnectionstatechange = null; pc.close(); pcs.delete(pid); }
      pend.delete(pid);
      setStreams((s) => { if (!s[pid]) return s; const n = { ...s }; delete n[pid]; return n; });
    }
    const resetAll = () => { Array.from(pcs.keys()).forEach(closePc); };
    function makePc(pid: string) {
      const pc = new RTCPeerConnection({ iceServers: info.ice });
      pc.onicecandidate = (e) => { if (e.candidate) sig(pid, { candidate: e.candidate.toJSON() }); };
      pc.ontrack = (e) => { const st = e.streams[0] || new MediaStream([e.track]); setStreams((s) => ({ ...s, [pid]: st })); };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' && pcs.get(pid) === pc && !dead) { closePc(pid); setTimeout(() => ensure(pid), 1500); }
      };
      pcs.set(pid, pc);
      return pc;
    }
    function addLocal(pc: RTCPeerConnection) {
      if (!my.speaker || !local) return;
      const l = local;
      l.getTracks().forEach((t) => pc.addTrack(t, l));
      if (screen) {
        const t = screen.getVideoTracks()[0];
        const s = pc.getSenders().find((x) => x.track && x.track.kind === 'video');
        if (s && t) s.replaceTrack(t);
      }
    }
    async function ensure(pid: string) {
      if (dead || pcs.has(pid) || !peersR[pid] || !needConn(pid) || !iInit(pid)) return;
      const pc = makePc(pid);
      addLocal(pc);
      const kinds = info.mode === 'video' ? ['audio', 'video'] : ['audio'];
      kinds.forEach((k) => { if (!pc.getSenders().some((s) => s.track && s.track.kind === k)) pc.addTransceiver(k as any, { direction: 'recvonly' }); });
      try {
        const o = await pc.createOffer();
        await pc.setLocalDescription(o);
        sig(pid, { sdp: pc.localDescription });
      } catch { /* the failed-state handler retries */ }
    }
    async function flushIce(pid: string, pc: RTCPeerConnection) {
      const q = pend.get(pid) || [];
      pend.delete(pid);
      for (const c of q) { try { await pc.addIceCandidate(c); } catch { /* ignore */ } }
    }
    async function onSignal(from: string, data: any) {
      let pc = pcs.get(from);
      if (data.sdp) {
        if (data.sdp.type === 'offer') {
          if (pc) closePc(from);
          pc = makePc(from);
          try {
            await pc.setRemoteDescription(data.sdp);
            addLocal(pc);
            const ans = await pc.createAnswer();
            await pc.setLocalDescription(ans);
            sig(from, { sdp: pc.localDescription });
            await flushIce(from, pc);
          } catch { /* ignore a bad offer */ }
        } else if (data.sdp.type === 'answer' && pc) {
          try { await pc.setRemoteDescription(data.sdp); await flushIce(from, pc); } catch { /* ignore */ }
        }
      } else if (data.candidate) {
        if (pc && pc.remoteDescription) { try { await pc.addIceCandidate(data.candidate); } catch { /* ignore */ } }
        else pend.set(from, [...(pend.get(from) || []), data.candidate]);
      }
    }
    async function onState(pid: string, st: any) {
      if (pid === me.id) {
        const was = !!my.speaker;
        my = { ...my, ...st };
        setMine(my);
        if (!!st.speaker !== was) {
          if (st.speaker) { await acquire(); pushMy({}); } else { stopLocal(); }
          resetAll();
          Object.keys(peersR).forEach(ensure);
        }
        return;
      }
      const was = peerSpeaker(pid);
      if (peersR[pid]) { peersR[pid] = { ...peersR[pid], state: st }; setPeers({ ...peersR }); }
      if (!!st.speaker !== was) { closePc(pid); ensure(pid); }
    }
    function stopShare() {
      if (!screen) return;
      screen.getTracks().forEach((t) => t.stop());
      screen = null;
      const cam = local && local.getVideoTracks()[0];
      pcs.forEach((pc) => {
        const s = pc.getSenders().find((x) => x.track && x.track.kind === 'video');
        if (s && cam) s.replaceTrack(cam);
      });
      if (local) setLocalView(local);
      pushMy({ sharing: false });
    }
    function cleanup() {
      if (dead) return;
      dead = true;
      wsend('rtc:leave', {});
      try { if (ws) ws.close(); } catch { /* ignore */ }
      resetAll();
      stopLocal();
    }

    Object.assign(act.current, {
      mic: () => { if (!local) return; const nm = !my.muted; local.getAudioTracks().forEach((t) => { t.enabled = !nm; }); pushMy({ muted: nm }); },
      cam: () => { if (!local) return; const nm = !my.cameraOff; local.getVideoTracks().forEach((t) => { t.enabled = !nm; }); pushMy({ cameraOff: nm }); },
      hand: () => pushMy({ hand: !my.hand }),
      share: async () => {
        if (screen) { stopShare(); return; }
        if (!local || !local.getVideoTracks().length) { setNote('Turn on a camera first to share your screen.'); return; }
        try {
          const ds: MediaStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
          const t = ds.getVideoTracks()[0];
          screen = ds;
          pcs.forEach((pc) => { const s = pc.getSenders().find((x) => x.track && x.track.kind === 'video'); if (s) s.replaceTrack(t); });
          setLocalView(new MediaStream([t, ...local.getAudioTracks()]));
          t.onended = stopShare;
          pushMy({ sharing: true });
        } catch { setNote('Screen sharing is not available on this device or was cancelled.'); }
      },
      say: (t: string) => wsend('rtc:chat', { text: t }),
      voice: async (f: File) => { try { const up = await upload([f]); wsend('rtc:chat', { audio: up[0].url }); } catch (e: any) { setNote(e.message); } },
      role: (to: string, speaker: boolean) => wsend('rtc:role', { to, speaker }),
      kick: (to: string) => wsend('rtc:kick', { to }),
      leave: () => { cleanup(); go(live ? 'live' : 'meet'); },
      end: async () => { if (!confirm('End this for everyone?')) return; await api('POST', `/api/rooms/${info.code}/end`).catch(() => {}); cleanup(); go(live ? 'live' : 'meet'); }
    });

    (async () => {
      await acquire();
      if (dead) return;
      ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
      ws.onopen = () => wsend('rtc:join', { code: info.code });
      ws.onclose = () => { if (!dead) setNote('Connection lost. Leave and rejoin to reconnect.'); };
      ws.onmessage = async (ev) => {
        let m: any;
        try { m = JSON.parse(ev.data); } catch { return; }
        const p = m.payload || {};
        if (m.type === 'rtc:peers') {
          (p.peers || []).forEach((x: any) => { peersR[x.id] = x; });
          setPeers({ ...peersR });
          setChat(p.chat || []);
          pushMy({});
          Object.keys(peersR).forEach(ensure);
        } else if (m.type === 'rtc:joined') { peersR[p.id] = p; setPeers({ ...peersR }); ensure(p.id); }
        else if (m.type === 'rtc:left') { closePc(p.id); delete peersR[p.id]; setPeers({ ...peersR }); }
        else if (m.type === 'rtc:state') await onState(p.id, p.state);
        else if (m.type === 'rtc:signal') await onSignal(p.from, p.data);
        else if (m.type === 'rtc:chat') setChat((c) => [...c, p].slice(-300));
        else if (m.type === 'rtc:ended') { setEnded(p.kicked ? 'You were removed from this room by the host.' : 'This room has ended.'); cleanup(); }
        else if (m.type === 'rtc:error') { setEnded(p.message || 'Could not join this room.'); cleanup(); }
      };
    })();

    return () => { cleanup(); };
  }, []);

  const A = act.current;
  const ids = Object.keys(peers);
  const speakers = ids.filter((id) => peers[id].state && peers[id].state.speaker).sort((a) => (a === info.hostId ? -1 : 1));
  const audience = ids.filter((id) => !(peers[id].state && peers[id].state.speaker));
  const count = ids.length + 1;
  const tiles = (mine.speaker ? 1 : 0) + speakers.length;
  const cb = (on?: boolean) => `h-11 min-w-[2.75rem] rounded-full px-3 text-sm text-white ${on ? 'bg-red-600' : 'bg-[#2D3136] hover:bg-[#383F45]'}`;
  const copyLink = () => { const u = `${location.origin}/#/room/${info.code}`; navigator.clipboard.writeText(u).then(() => setNote('Invite link copied'), () => prompt('Copy this link', u)); };

  if (ended) {
    return (
      <div className="mx-auto max-w-md p-6 text-center"><div className={`${card} p-6`}><div className="text-4xl">👋</div><p className="mt-2 text-white">{ended}</p>
        <button className={`${btn} mt-4`} onClick={() => go(live ? 'live' : 'meet')}>Back</button></div></div>
    );
  }

  return (
    <div className="flex flex-col bg-[#1A1D21]" style={{ height: 'calc(100vh - 56px)' }}>
      <div className="flex items-center gap-2 border-b border-[#383F45] px-3 py-2">
        {live && <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">LIVE</span>}
        <div className="min-w-0 flex-1"><div className="truncate font-semibold text-white">{info.title}</div><div className="text-xs text-[#8D9197]">{info.code} · {count} in room{live ? ` · ${info.mode === 'audio' ? 'voice' : 'video'}` : ''}</div></div>
        <button className={btn2} onClick={copyLink}>Invite</button>
      </div>
      {note && <div className="flex items-center gap-2 bg-[#2D3136] px-3 py-1.5 text-xs text-[#D1D2D3]">{note}<button className="ml-auto" onClick={() => setNote('')}>×</button></div>}
      <div className="relative flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto p-3">
          <div className={`mx-auto grid gap-2 ${tiles <= 1 ? 'max-w-3xl grid-cols-1' : tiles === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
            {mine.speaker && <Tile self stream={localView} name={me.name} avatar={me.avatar} state={mine} />}
            {speakers.map((id) => <Tile key={id} stream={streams[id] || null} name={peers[id].name} avatar={peers[id].avatar} state={peers[id].state || {}} />)}
          </div>
          {tiles === 0 && <p className="py-10 text-center text-[#8D9197]">Waiting for the host to start...</p>}
          {live && (audience.length > 0 || !mine.speaker) && (
            <div className="mx-auto mt-4 max-w-3xl">
              <div className="mb-1 text-xs text-[#8D9197]">Listeners ({audience.length + (mine.speaker ? 0 : 1)})</div>
              <div className="flex flex-wrap gap-2">
                {!mine.speaker && <span className="flex items-center gap-1 rounded-full bg-[#222529] py-1 pl-1 pr-3 text-xs text-white"><Avatar user={me} size={22} />You{mine.hand ? ' ✋' : ''}</span>}
                {audience.map((id) => <span key={id} className="flex items-center gap-1 rounded-full bg-[#222529] py-1 pl-1 pr-3 text-xs text-white"><Avatar user={peers[id]} size={22} />{peers[id].name}{peers[id].state && peers[id].state.hand ? ' ✋' : ''}</span>)}
              </div>
            </div>
          )}
        </div>
        {panel && (
          <div className="absolute inset-0 z-20 flex flex-col border-l border-[#383F45] bg-[#19171D] sm:static sm:w-80 sm:shrink-0">
            <div className="flex items-center border-b border-[#383F45] px-3 py-2"><span className="font-semibold text-white">{panel === 'chat' ? (live ? 'Live comments' : 'Chat') : `People (${count})`}</span><button className="ml-auto text-xl text-[#8D9197]" onClick={() => setPanel('')}>×</button></div>
            {panel === 'chat' ? (
              <>
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                  {chat.length === 0 && <p className="text-sm text-[#8D9197]">No comments yet. Say hello!</p>}
                  {chat.map((m) => (
                    <div key={m.id} className="flex gap-2"><Avatar user={m.from} size={26} /><div className="min-w-0"><div className="text-xs text-[#8D9197]"><b className="text-white">{m.from.name}</b></div>
                      {m.text && <p className="break-words text-sm text-[#D1D2D3]">{m.text}</p>}{m.audio && <audio controls preload="none" src={m.audio} className="mt-1 h-9 w-52 max-w-full" />}</div></div>
                  ))}
                  <div ref={chatEnd} />
                </div>
                <div className="space-y-2 border-t border-[#383F45] p-2">
                  <div className="flex gap-1">{QUICK.map((e) => <button key={e} className="rounded-md px-2 py-1 text-lg hover:bg-[#2D3136]" onClick={() => A.say(e)}>{e}</button>)}</div>
                  <div className="flex items-center gap-2">
                    <input className={`${field} min-w-0 flex-1`} placeholder={live ? 'Add a comment...' : 'Message everyone...'} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && text.trim()) { A.say(text.trim()); setText(''); } }} />
                    <VoiceRecorder onDone={(f) => A.voice(f)} />
                  </div>
                </div>
              </>
            ) : (
              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
                {[{ id: me.id, name: me.name, avatar: me.avatar, state: mine, self: true }, ...ids.map((id) => ({ ...peers[id], self: false }))].map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2 rounded-md p-1.5 hover:bg-[#222529]">
                    <Avatar user={p} size={30} />
                    <div className="min-w-0 flex-1 text-sm text-white"><div className="truncate">{p.name}{p.self ? ' (you)' : ''}</div>
                      <div className="text-[11px] text-[#8D9197]">{p.id === info.hostId ? 'Host · ' : ''}{p.state && p.state.speaker ? 'Speaker' : 'Listener'}{p.state && p.state.hand ? ' · ✋ hand raised' : ''}</div></div>
                    {live && info.isHost && !p.self && p.id !== info.hostId && (
                      <button className={btn2} onClick={() => A.role(p.id, !(p.state && p.state.speaker))}>{p.state && p.state.speaker ? 'To audience' : 'Make speaker'}</button>
                    )}
                    {info.isHost && !p.self && <button className="text-xs text-red-400" onClick={() => { if (confirm(`Remove ${p.name}?`)) A.kick(p.id); }}>Remove</button>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-[#383F45] bg-[#19171D] px-3 py-2">
        {mine.speaker && <button className={cb(mine.muted)} onClick={() => A.mic()} title="Microphone">{mine.muted ? '🔇 Unmute' : '🎙 Mute'}</button>}
        {mine.speaker && info.mode === 'video' && <button className={cb(mine.cameraOff)} onClick={() => A.cam()} title="Camera">{mine.cameraOff ? '🚫 Camera off' : '📷 Camera'}</button>}
        {mine.speaker && info.mode === 'video' && <button className={cb(mine.sharing)} onClick={() => A.share()} title="Share screen">{mine.sharing ? '🖥 Stop sharing' : '🖥 Share'}</button>}
        {!(live && mine.speaker && info.isHost) && <button className={cb(mine.hand)} onClick={() => A.hand()}>{live && !mine.speaker ? '✋ Request to speak' : '✋ Hand'}</button>}
        {live && mine.speaker && !info.isHost && <button className={cb()} onClick={() => A.role(me.id, false)}>Step down</button>}
        <button className={cb(panel === 'chat')} onClick={() => setPanel(panel === 'chat' ? '' : 'chat')}>💬 {live ? 'Comments' : 'Chat'}</button>
        <button className={cb(panel === 'people')} onClick={() => setPanel(panel === 'people' ? '' : 'people')}>👥 People</button>
        <button className="h-11 rounded-full bg-red-600 px-4 text-sm font-semibold text-white" onClick={() => A.leave()}>Leave</button>
        {info.isHost && <button className="h-11 rounded-full bg-red-900 px-4 text-sm font-semibold text-white" onClick={() => A.end()}>End for all</button>}
      </div>
    </div>
  );
};

// ---------- Before joining: details and options
export const RoomPage = ({ code }: { code: string }) => {
  const { me, needLogin } = useMe();
  const [info, setInfo] = useState<any>(null);
  const [err, setErr] = useState('');
  const [joined, setJoined] = useState(false);
  const [opts, setOpts] = useState({ micOff: false, camOff: false });
  useEffect(() => { if (me) api('GET', '/api/rooms/' + code).then(setInfo).catch((e) => setErr(e.message)); }, [code, me && me.id]);

  if (!me) return (
    <div className="mx-auto max-w-md p-6 text-center"><div className={`${card} p-6`}><div className="text-4xl">🔒</div><p className="mt-2 text-white">Log in to join this room.</p>
      <button className={`${btn} mt-4`} onClick={needLogin}>Log in or sign up</button></div></div>
  );
  if (err) return <div className="mx-auto max-w-md p-6 text-center"><p className="text-red-400">{err}</p><button className={`${btn2} mt-3`} onClick={() => go('meet')}>Back</button></div>;
  if (!info) return <p className="p-6 text-center text-[#8D9197]">Loading...</p>;
  if (joined) return <Call info={info} me={me} opts={opts} />;

  const live = info.type === 'live';
  const speaker = !live || info.isHost;
  return (
    <div className="mx-auto w-full max-w-md p-4">
      <div className={`${card} space-y-3 p-6 text-center`}>
        <div className="text-4xl">{live ? (info.mode === 'audio' ? '🎙' : '🎥') : '👥'}</div>
        <h1 className="text-xl font-bold text-white">{info.title}</h1>
        <p className="text-sm text-[#8D9197]">{live ? 'Live ' + (info.mode === 'audio' ? 'voice room' : 'video') : 'Meeting'} hosted by {info.hostName} · code {info.code}</p>
        {info.endedAt ? <p className="text-sm text-red-400">This room has ended.</p> : (
          <>
            {speaker && (
              <div className="space-y-1 text-left text-sm text-[#D1D2D3]">
                <label className="flex items-center gap-2"><input type="checkbox" checked={opts.micOff} onChange={(e) => setOpts({ ...opts, micOff: e.target.checked })} /> Join with my microphone off</label>
                {info.mode === 'video' && <label className="flex items-center gap-2"><input type="checkbox" checked={opts.camOff} onChange={(e) => setOpts({ ...opts, camOff: e.target.checked })} /> Join with my camera off</label>}
                <p className="pt-1 text-xs text-[#8D9197]">Your browser will ask permission to use your {info.mode === 'video' ? 'camera and microphone' : 'microphone'}.</p>
              </div>
            )}
            {live && !info.isHost && <p className="text-xs text-[#8D9197]">You join as a listener. Use "Request to speak" and the host can invite you to talk.</p>}
            <button className={`${btn} w-full py-2.5`} onClick={() => setJoined(true)}>{live ? (info.isHost ? 'Start broadcast' : 'Join live') : 'Join meeting'}</button>
          </>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { api } from './api';
import { go, useMe } from './hooks';
import { btn, field } from './ui';

// Pages the assistant is allowed to point to with [[go:page]]
const PAGES = ['feed', 'market', 'market/new', 'market/mine', 'jobs', 'jobs/new', 'jobs/mine', 'jobs/applied', 'meet', 'live', 'people', 'groups', 'chat', 'settings'];
const QUICK: [string, string, boolean][] = [
  ['📝 Write a post', 'Write a short, engaging post for the feed about: ', false],
  ['🧾 Summarize this', 'Summarize what I am looking at in 5 short bullet points.', true],
  ['💻 Format code', 'Fix and format this code. Reply with one code block and a one-line note:\n', false],
  ['🧭 Help me find...', 'Where in rblink.chat can I ', false]
];

// What the user is looking at right now (sent only if the toggle is on)
function pageContext(route: string): { label: string; text: string } | null {
  const page = route.split('?')[0].split('/')[0] || 'feed';
  if (page === 'chat') {
    try {
      const ch = localStorage.getItem('rblink_current_channel') || 'c_general';
      const msgs = (JSON.parse(localStorage.getItem('rblink_messages') || '{}')[ch] || []) as any[];
      const users = JSON.parse(localStorage.getItem('rblink_users') || '[]') as any[];
      const chans = JSON.parse(localStorage.getItem('rblink_channels') || '[]') as any[];
      const name = (chans.find((c) => c.id === ch) || {}).name || 'conversation';
      const lines = msgs.slice(-40).map((m) => `${(users.find((u) => u.id === m.senderId) || {}).name || 'Someone'}: ${m.content}`);
      return lines.length ? { label: `Chat #${name}, last ${lines.length} messages`, text: lines.join('\n') } : null;
    } catch { return null; }
  }
  const el = document.querySelector('main') as HTMLElement | null;
  const t = el ? el.innerText.replace(/\n{3,}/g, '\n\n').trim() : '';
  return t ? { label: 'This page', text: t.slice(0, 6000) } : null;
}

const CodeBlock = ({ code }: { code: string }) => (
  <div className="my-2 overflow-hidden rounded-md bg-black/50">
    <div className="flex justify-end px-2 pt-1"><button className="text-[11px] text-[#8D9197] hover:text-white" onClick={() => navigator.clipboard.writeText(code.trim()).then(() => alert('Copied'), () => {})}>Copy</button></div>
    <pre className="overflow-x-auto px-3 pb-2 text-xs text-[#D1D2D3]"><code>{code.trim()}</code></pre>
  </div>
);

const Reply = ({ text, onPost }: { text: string; onPost: (t: string) => void }) => {
  const nav = Array.from(text.matchAll(/\[\[go:([a-z/]+)\]\]/g)).map((m) => m[1]).filter((p) => PAGES.includes(p));
  const clean = text.replace(/\[\[go:[a-z/]+\]\]/g, '').trim();
  const parts = clean.split('```');
  const plain = parts.filter((_, i) => i % 2 === 0).join('\n').trim();
  return (
    <div className="space-y-1 text-sm text-[#D1D2D3]">
      {parts.map((p, i) => (i % 2
        ? <CodeBlock key={i} code={p.replace(/^[\w+#-]*\n/, '')} />
        : p.trim() ? <p key={i} className="whitespace-pre-wrap break-words">{p.trim()}</p> : null))}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {Array.from(new Set(nav)).map((p) => <button key={p} className={btn} onClick={() => go(p)}>Open {p}</button>)}
        {plain.length > 20 && <button className="rounded-md border border-[#383F45] px-2 py-1 text-xs text-[#B9BBBE] hover:bg-[#2D3136]" onClick={() => onPost(plain)}>Use as post</button>}
      </div>
    </div>
  );
};

export const AIPanel = ({ route }: { route: string }) => {
  const { me } = useMe();
  const key = 'rblink_ai_chat_' + (me ? me.id : '');
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [msgs, setMsgs] = useState<any[]>(() => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } });
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [useCtx, setUseCtx] = useState(() => localStorage.getItem('rblink_ai_ctx') !== 'off');
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { if (open && enabled === null) api('GET', '/api/ai/status').then((r) => setEnabled(!!r.enabled)).catch(() => setEnabled(false)); }, [open]);
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(msgs.slice(-30))); } catch { /* storage full */ } if (end.current) end.current.scrollIntoView(); }, [msgs, open]);
  useEffect(() => { localStorage.setItem('rblink_ai_ctx', useCtx ? 'on' : 'off'); }, [useCtx]);
  if (!me) return null;

  const ctx = open && useCtx ? pageContext(route) : null;
  const ask = async (q: string) => {
    if (!q.trim() || busy) return;
    const next = [...msgs, { role: 'user', content: q.trim() }];
    setMsgs(next); setInput(''); setBusy(true);
    try {
      const c = useCtx ? pageContext(route) : null;
      const r = await api('POST', '/api/ai', { messages: next.slice(-12).map((m) => ({ role: m.role, content: m.content })), context: c ? `[${c.label}]\n${c.text}` : undefined });
      setMsgs([...next, { role: 'assistant', content: r.reply || '(no answer)' }]);
    } catch (e: any) { setMsgs([...next, { role: 'assistant', content: '⚠️ ' + e.message, error: true }]); }
    setBusy(false);
  };
  const usePost = (t: string) => {
    sessionStorage.setItem('rblink_draft', t);
    setOpen(false);
    if ((route.split('?')[0].split('/')[0] || 'feed') === 'feed') window.dispatchEvent(new Event('rblink:draft')); else go('feed');
  };
  const quick = (prompt: string, send: boolean) => { if (send) ask(prompt); else setInput(prompt); };

  if (!open) {
    return <button onClick={() => setOpen(true)} className="fixed bottom-4 right-4 z-40 rounded-full bg-[#1D9BD1] px-4 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-90">✨ Ask AI</button>;
  }
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#19171D] sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[34rem] sm:w-96 sm:rounded-xl sm:border sm:border-[#383F45] sm:shadow-2xl">
      <div className="flex items-center gap-2 border-b border-[#383F45] px-3 py-2">
        <span className="font-semibold text-white">✨ rblink assistant</span>
        {msgs.length > 0 && <button className="ml-auto text-xs text-[#8D9197] hover:text-white" onClick={() => { if (confirm('Clear this conversation?')) setMsgs([]); }}>Clear</button>}
        <button className={`${msgs.length ? '' : 'ml-auto'} text-2xl leading-none text-[#8D9197]`} onClick={() => setOpen(false)}>×</button>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {enabled === false && (
          <div className="rounded-md bg-[#2D3136] p-3 text-sm text-[#D1D2D3]">The AI assistant is not switched on yet. The site owner needs to add <b>AI_BASE_URL</b>, <b>AI_API_KEY</b> and <b>AI_MODEL</b> to the <code>.env</code> file (a free Groq or Gemini key works) and restart the server.</div>
        )}
        {msgs.length === 0 && enabled !== false && (
          <div className="text-sm text-[#8D9197]">Hi {me.name.split(' ')[0]}! I can write posts, summarize a chat or page, fix and format code, and show you around the app. Pick a shortcut or ask anything.</div>
        )}
        {msgs.map((m, i) => (m.role === 'user'
          ? <div key={i} className="ml-8 rounded-xl bg-[#1D9BD1] px-3 py-2 text-sm text-white"><span className="whitespace-pre-wrap break-words">{m.content}</span></div>
          : <div key={i} className="mr-4 rounded-xl bg-[#222529] px-3 py-2">{m.error ? <p className="text-sm text-red-300">{m.content}</p> : <Reply text={m.content} onPost={usePost} />}</div>))}
        {busy && <div className="mr-4 w-20 rounded-xl bg-[#222529] px-3 py-2 text-sm text-[#8D9197]">Thinking...</div>}
        <div ref={end} />
      </div>
      <div className="space-y-2 border-t border-[#383F45] p-2">
        <div className="flex flex-wrap gap-1.5">
          {QUICK.map(([label, prompt, send]) => <button key={label} className="rounded-full border border-[#383F45] px-2.5 py-1 text-xs text-[#D1D2D3] hover:bg-[#2D3136]" onClick={() => quick(prompt, send)}>{label}</button>)}
        </div>
        <label className="flex items-center gap-2 text-[11px] text-[#8D9197]">
          <input type="checkbox" checked={useCtx} onChange={(e) => setUseCtx(e.target.checked)} />
          <span className="min-w-0 truncate">Let the AI read what I'm looking at{ctx ? ` (${ctx.label})` : ''}. It is sent to the AI service.</span>
        </label>
        <div className="flex gap-2">
          <textarea className={`${field} max-h-28 min-h-[40px] flex-1 resize-none`} rows={1} placeholder="Ask anything..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input); } }} />
          <button className={btn} disabled={busy || !input.trim()} onClick={() => ask(input)}>Send</button>
        </div>
      </div>
    </div>
  );
};

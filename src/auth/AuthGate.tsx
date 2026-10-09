import React, { useCallback, useEffect, useState } from 'react';
import { startSync, pauseSync, ensureUser } from './sync';

// Wraps the chat screen for a logged-in member: loads the shared workspace from the server and keeps it in sync.
export const ChatGate: React.FC<{ me: any; children: React.ReactNode }> = ({ me, children }) => {
  const [ready, setReady] = useState(false);
  const [key, setKey] = useState(0);

  // Reload after remote changes, but never while the user is typing.
  const remount = useCallback(() => {
    const go = () => {
      const a = document.activeElement as HTMLElement | null;
      if (a && (a.tagName === 'TEXTAREA' || a.tagName === 'INPUT' || a.isContentEditable)) setTimeout(go, 1000);
      else setKey((k) => k + 1);
    };
    go();
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      await startSync(remount);
      ensureUser(me);
      if (live) setReady(true);
    })();
    return () => { live = false; pauseSync(); };
  }, [me.id, remount]);

  if (!ready) return <div className="flex h-full items-center justify-center bg-[#1A1D21] text-[#8D9197]">Loading chat...</div>;
  return <React.Fragment key={key}>{children}</React.Fragment>;
};

import React, { useEffect } from 'react';
import { X, Command } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const KeyboardShortcutsModal: React.FC = () => {
  const { isShortcutsOpen, setIsShortcutsOpen } = useChat();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsShortcutsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsShortcutsOpen]);

  if (!isShortcutsOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + K / Cmd + K', desc: 'Open global search and channel switcher' },
    { key: 'Enter', desc: 'Send message in composer or reply' },
    { key: 'Shift + Enter', desc: 'Insert new line in message composer' },
    { key: 'Esc', desc: 'Close any active modal, drawer, or mention dropdown' },
    { key: '@', desc: 'Trigger mention auto-complete dropdown' },
    { key: '↑ / ↓ Arrows', desc: 'Navigate mention suggestions and search results' },
    { key: 'Tab / Enter', desc: 'Select focused autocomplete suggestion' },
    { key: 'Ctrl + / / Cmd + /', desc: 'Toggle keyboard shortcuts cheatsheet' }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={() => setIsShortcutsOpen(false)}
    >
      <div
        className="w-full max-w-md bg-[#222529] border border-[#383F45] rounded-xl shadow-2xl p-6 text-[#D1D2D3]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#383F45] mb-4">
          <div className="flex items-center gap-2">
            <Command className="w-5 h-5 text-[#1D9BD1]" />
            <h3 className="font-bold text-white text-base">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={() => setIsShortcutsOpen(false)}
            className="text-[#8D9197] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-lg bg-[#1A1D21] border border-[#383F45]"
            >
              <span className="text-xs text-[#D1D2D3]">{sc.desc}</span>
              <kbd className="px-2 py-1 text-[11px] font-mono font-semibold bg-[#282B30] text-[#68CDFF] rounded border border-[#383F45] shrink-0">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-[#383F45] flex justify-end">
          <button
            onClick={() => setIsShortcutsOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-[#1264A3] hover:bg-[#1164A3] text-xs font-semibold text-white shadow"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

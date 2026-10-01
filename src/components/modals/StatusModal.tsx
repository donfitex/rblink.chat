import React, { useState, useEffect } from 'react';
import { X, Smile, Clock, Check } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { UserPresence } from '../../types';

export const StatusModal: React.FC = () => {
  const {
    statusModalOpen,
    setStatusModalOpen,
    activeUser,
    setUserStatus,
    clearUserStatus
  } = useChat();

  const [presence, setPresence] = useState<UserPresence>(activeUser.presence);
  const [emoji, setEmoji] = useState(activeUser.customStatus?.emoji || '💬');
  const [statusText, setStatusText] = useState(activeUser.customStatus?.text || '');
  const [expiryHours, setExpiryHours] = useState<number | null>(null);

  useEffect(() => {
    if (statusModalOpen) {
      setPresence(activeUser.presence);
      setEmoji(activeUser.customStatus?.emoji || '💬');
      setStatusText(activeUser.customStatus?.text || '');
    }
  }, [statusModalOpen, activeUser]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStatusModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setStatusModalOpen]);

  if (!statusModalOpen) return null;

  const statusPresets = [
    { emoji: '📅', text: 'In a meeting', hours: 1 },
    { emoji: '🎧', text: 'Focusing / Coding', hours: 2 },
    { emoji: '🥪', text: 'Out for lunch', hours: 1 },
    { emoji: '🤒', text: 'Out sick', hours: 24 },
    { emoji: '🌴', text: 'On vacation', hours: 168 }
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const expiresAt = expiryHours
      ? new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString()
      : undefined;

    const customStatus = statusText.trim()
      ? { emoji, text: statusText.trim(), expiresAt }
      : undefined;

    setUserStatus(presence, customStatus);
    setStatusModalOpen(false);
  };

  const handleClear = () => {
    clearUserStatus();
    setStatusModalOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={() => setStatusModalOpen(false)}
    >
      <div
        className="w-full max-w-md bg-[#222529] border border-[#383F45] rounded-xl shadow-2xl p-6 text-[#D1D2D3]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#383F45] mb-4">
          <h3 className="font-bold text-white text-base">Set your status & presence</h3>
          <button
            onClick={() => setStatusModalOpen(false)}
            className="text-[#8D9197] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Presence Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#ABABAD] mb-2">
              Presence State
            </label>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {[
                { id: 'online', label: 'Online', color: 'bg-emerald-500' },
                { id: 'away', label: 'Away', color: 'bg-amber-500' },
                { id: 'dnd', label: 'Do Not Disturb', color: 'bg-red-500' },
                { id: 'offline', label: 'Invisible', color: 'bg-gray-500' }
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPresence(p.id as any)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-colors ${
                    presence === p.id
                      ? 'border-[#1264A3] bg-[#1264A3]/20 text-white'
                      : 'border-[#383F45] bg-[#1A1D21] text-[#ABABAD] hover:border-[#565D65]'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${p.color}`} />
                  <span className="font-medium text-[11px] truncate">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Status Input */}
          <div>
            <label className="block text-xs font-semibold text-[#ABABAD] mb-1.5">
              Custom Status Message
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
                className="w-12 bg-[#1A1D21] border border-[#383F45] rounded-lg py-2 text-center text-lg focus:outline-none focus:border-[#1264A3]"
                title="Status emoji"
              />
              <input
                type="text"
                placeholder="What's your focus right now?"
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                className="flex-1 bg-[#1A1D21] border border-[#383F45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1264A3]"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="block text-[11px] font-semibold text-[#8D9197] uppercase mb-1.5">
              Suggestions
            </span>
            <div className="space-y-1">
              {statusPresets.map((preset) => (
                <button
                  key={preset.text}
                  type="button"
                  onClick={() => {
                    setEmoji(preset.emoji);
                    setStatusText(preset.text);
                    setExpiryHours(preset.hours);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-md hover:bg-[#1A1D21] text-left text-xs transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span>{preset.emoji}</span>
                    <span className="text-white">{preset.text}</span>
                  </span>
                  <span className="text-[#8D9197] text-[11px]">{preset.hours}h</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-[#383F45]">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-[#8D9197] hover:text-red-400 font-medium"
            >
              Clear status
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-[#2D3136] text-xs font-semibold text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#1264A3] hover:bg-[#1164A3] text-xs font-semibold text-white shadow"
              >
                Save Status
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

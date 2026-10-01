import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Check, Users, MessageSquare } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const DirectMessageModal: React.FC = () => {
  const { isNewDmOpen, setIsNewDmOpen, users, activeUser, createDirectMessage } = useChat();

  const [search, setSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsNewDmOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsNewDmOpen]);

  const candidates = useMemo(() => {
    return users
      .filter((u) => u.id !== activeUser.id)
      .filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.username.toLowerCase().includes(search.toLowerCase())
      );
  }, [users, activeUser.id, search]);

  if (!isNewDmOpen) return null;

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const handleStartConversation = () => {
    if (selectedUserIds.length === 0) return;
    createDirectMessage(selectedUserIds, groupName.trim() || undefined);
    setSelectedUserIds([]);
    setGroupName('');
    setIsNewDmOpen(false);
  };

  const isGroup = selectedUserIds.length > 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={() => setIsNewDmOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-[#222529] border border-[#383F45] rounded-xl shadow-2xl p-6 text-[#D1D2D3]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#383F45]">
          <h3 className="font-bold text-white text-base">New Direct Message</h3>
          <button
            onClick={() => setIsNewDmOpen(false)}
            className="text-[#8D9197] hover:text-white p-1 rounded hover:bg-[#2D3136]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Users Chips */}
        <div className="my-3 min-h-[38px] p-2 bg-[#1A1D21] border border-[#383F45] rounded-lg flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-[#8D9197] mr-1 font-semibold">To:</span>
          {selectedUserIds.map((uid) => {
            const user = users.find((u) => u.id === uid);
            if (!user) return null;
            return (
              <span
                key={uid}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#1264A3]/20 border border-[#1264A3]/50 text-xs text-white"
              >
                <img src={user.avatar} alt="" className="w-3.5 h-3.5 rounded-full" />
                <span>{user.name}</span>
                <button
                  onClick={() => toggleSelectUser(uid)}
                  className="hover:text-red-400 p-0.5 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          <input
            type="text"
            placeholder={selectedUserIds.length === 0 ? "Type a teammate's name or username..." : ''}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[120px] bg-transparent text-xs text-white placeholder-[#8D9197] focus:outline-none"
            autoFocus
          />
        </div>

        {/* Group Name (optional if multiple selected) */}
        {isGroup && (
          <div className="mb-3 animate-fadeIn">
            <label className="block text-xs font-semibold text-[#ABABAD] mb-1">
              Group Name (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Design Sync, Apollo Core..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-[#1A1D21] border border-[#383F45] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1264A3]"
            />
          </div>
        )}

        {/* User Candidates List */}
        <div className="max-h-56 overflow-y-auto space-y-1 my-2">
          {candidates.map((user) => {
            const isSelected = selectedUserIds.includes(user.id);

            return (
              <div
                key={user.id}
                onClick={() => toggleSelectUser(user.id)}
                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                  isSelected ? 'bg-[#1264A3]/20' : 'hover:bg-[#2D3136]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#222529] ${
                        user.presence === 'online'
                          ? 'bg-emerald-500'
                          : user.presence === 'away'
                          ? 'bg-amber-500'
                          : user.presence === 'dnd'
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-white">{user.name}</p>
                    <p className="text-[11px] text-[#8D9197]">@{user.username}</p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'border-[#1264A3] bg-[#1264A3] text-white'
                      : 'border-[#565D65]'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#383F45]">
          <span className="text-xs text-[#8D9197]">
            {selectedUserIds.length === 0
              ? 'Select at least 1 person'
              : `${selectedUserIds.length} person(s) selected`}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewDmOpen(false)}
              className="px-4 py-2 rounded-lg bg-[#2D3136] hover:bg-[#383F45] text-xs font-semibold text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleStartConversation}
              disabled={selectedUserIds.length === 0}
              className={`px-5 py-2 rounded-lg text-xs font-semibold text-white shadow ${
                selectedUserIds.length === 0
                  ? 'bg-[#2D3136] text-[#565D65] cursor-not-allowed'
                  : 'bg-[#1264A3] hover:bg-[#1164A3]'
              }`}
            >
              Start Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

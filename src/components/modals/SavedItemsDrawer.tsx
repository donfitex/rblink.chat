import React, { useMemo } from 'react';
import { X, Bookmark, Trash2, ArrowUpRight } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Message } from '../../types';
import { formatRelativeTime } from '../../utils/formatters';
import { MarkdownContent } from '../chat/MarkdownContent';

export const SavedItemsDrawer: React.FC = () => {
  const {
    isSavedItemsOpen,
    setIsSavedItemsOpen,
    savedMessageIds,
    toggleSaveMessage,
    jumpToMessage,
    users,
    channels
  } = useChat();

  const allMessages = useMemo(() => {
    try {
      const stored = localStorage.getItem('rblink_messages');
      if (stored) {
        const dict = JSON.parse(stored);
        const list: Message[] = [];
        Object.keys(dict).forEach((k) => list.push(...dict[k]));
        return list;
      }
    } catch {
      // Fallback
    }
    return [];
  }, [isSavedItemsOpen]);

  const savedMessages = useMemo(() => {
    return allMessages.filter((m) => savedMessageIds.includes(m.id));
  }, [allMessages, savedMessageIds]);

  if (!isSavedItemsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={() => setIsSavedItemsOpen(false)}
    >
      <div
        className="w-full max-w-2xl h-[75vh] bg-[#1A1D21] border border-[#383F45] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#D1D2D3]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#222529] border-b border-[#383F45]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#1264A3]/20 text-[#68CDFF]">
              <Bookmark className="w-5 h-5 fill-[#68CDFF]" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Saved Items & Bookmarks</h3>
              <p className="text-xs text-[#8D9197]">
                {savedMessages.length} saved {savedMessages.length === 1 ? 'message' : 'messages'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSavedItemsOpen(false)}
            className="p-1 rounded hover:bg-[#2D3136] text-[#ABABAD] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedMessages.length === 0 ? (
            <div className="py-20 text-center text-[#8D9197]">
              <Bookmark className="w-12 h-12 mx-auto mb-2 text-[#565D65]" />
              <p className="text-sm font-semibold text-white">No saved messages yet</p>
              <p className="text-xs max-w-xs mx-auto mt-1">
                Save messages to read them later or keep important links within easy reach.
              </p>
            </div>
          ) : (
            savedMessages.map((msg) => {
              const sender = users.find((u) => u.id === msg.senderId);
              const channel = channels.find((c) => c.id === msg.channelId);
              const targetId = msg.channelId || msg.dmId || '';

              return (
                <div
                  key={msg.id}
                  className="p-3.5 rounded-xl border border-[#383F45] bg-[#222529] hover:border-[#565D65] transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={sender?.avatar}
                        alt=""
                        className="w-6 h-6 rounded-md object-cover"
                      />
                      <span className="font-bold text-xs text-white">{sender?.name}</span>
                      {channel && (
                        <span className="text-[11px] text-[#1D9BD1] font-medium">
                          #{channel.name}
                        </span>
                      )}
                      <span className="text-[10px] text-[#8D9197]">
                        {formatRelativeTime(msg.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          jumpToMessage(targetId, msg.id, Boolean(msg.dmId));
                          setIsSavedItemsOpen(false);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-[#2D3136] hover:bg-[#383F45] text-xs text-[#1D9BD1] font-medium"
                        title="Jump to message in conversation"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" /> Jump
                      </button>
                      <button
                        onClick={() => toggleSaveMessage(msg.id)}
                        className="p-1 text-[#8D9197] hover:text-red-400 hover:bg-[#2D3136] rounded"
                        title="Remove bookmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs bg-[#1A1D21] p-3 rounded-lg border border-[#2D3136]">
                    <MarkdownContent content={msg.content} users={users} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

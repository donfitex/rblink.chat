import React from 'react';
import { X, Pin, ArrowUpRight, Trash2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { formatRelativeTime } from '../../utils/formatters';
import { MarkdownContent } from '../chat/MarkdownContent';

export const PinnedItemsDrawer: React.FC = () => {
  const {
    isPinnedItemsOpen,
    setIsPinnedItemsOpen,
    pinnedMessages,
    togglePinMessage,
    jumpToMessage,
    currentChannel,
    users
  } = useChat();

  if (!isPinnedItemsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={() => setIsPinnedItemsOpen(false)}
    >
      <div
        className="w-full max-w-2xl h-[75vh] bg-[#1A1D21] border border-[#383F45] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#D1D2D3]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-[#222529] border-b border-[#383F45]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Pin className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Pinned Messages</h3>
              <p className="text-xs text-[#8D9197]">
                #{currentChannel?.name || 'conversation'} ({pinnedMessages.length} pinned)
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPinnedItemsOpen(false)}
            className="p-1 rounded hover:bg-[#2D3136] text-[#ABABAD] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {pinnedMessages.length === 0 ? (
            <div className="py-20 text-center text-[#8D9197]">
              <Pin className="w-12 h-12 mx-auto mb-2 text-[#565D65]" />
              <p className="text-sm font-semibold text-white">No pinned messages</p>
              <p className="text-xs max-w-xs mx-auto mt-1">
                Pin key messages, announcements, or resources so your team can easily find them.
              </p>
            </div>
          ) : (
            pinnedMessages.map((msg) => {
              const sender = users.find((u) => u.id === msg.senderId);

              return (
                <div
                  key={msg.id}
                  className="p-3.5 rounded-xl border border-[#383F45] bg-[#222529] hover:border-[#565D65] transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={sender?.avatar}
                        alt=""
                        className="w-6 h-6 rounded-md object-cover"
                      />
                      <span className="font-bold text-xs text-white">{sender?.name}</span>
                      <span className="text-[10px] text-[#8D9197]">
                        {formatRelativeTime(msg.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          jumpToMessage(msg.channelId || msg.dmId || '', msg.id, Boolean(msg.dmId));
                          setIsPinnedItemsOpen(false);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-[#2D3136] hover:bg-[#383F45] text-xs text-[#1D9BD1] font-medium"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" /> Jump
                      </button>
                      <button
                        onClick={() => togglePinMessage(msg.id)}
                        className="p-1 text-[#8D9197] hover:text-amber-400 hover:bg-[#2D3136] rounded"
                        title="Unpin"
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

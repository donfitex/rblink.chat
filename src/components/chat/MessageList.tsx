import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Hash, Lock, MessageSquare } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { MessageItem } from './MessageItem';
import { formatDateSeparator, isSameDay, shouldGroupMessages } from '../../utils/formatters';
import { MessageSkeleton } from '../ui/Skeleton';

export const MessageList: React.FC = () => {
  const { currentMessages, currentChannel, currentDm, activeUser } = useChat();

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initial fake load simulation for smooth skeleton demonstration
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [currentChannel?.id, currentDm?.id]);

  // Scroll to bottom on initial load and when new messages arrive (if near bottom)
  useEffect(() => {
    if (!isLoading && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [isLoading, currentMessages.length]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShowScrollBottom(!isNearBottom);
  };

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <MessageSkeleton />
        <MessageSkeleton />
        <MessageSkeleton />
        <MessageSkeleton />
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex flex-col min-h-0 bg-[#1A1D21]">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden pt-4 pb-2"
      >
        {/* Channel or DM Welcome Banner */}
        <div className="px-6 py-6 border-b border-[#2D3136]/50 mb-4 bg-gradient-to-b from-[#222529]/40 to-transparent">
          {currentChannel ? (
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#1264A3]/20 text-[#68CDFF] flex items-center justify-center mb-3">
                {currentChannel.isPrivate ? (
                  <Lock className="w-6 h-6" />
                ) : (
                  <Hash className="w-6 h-6" />
                )}
              </div>
              <h2 className="text-xl font-bold text-white mb-1">
                Welcome to #{currentChannel.name}!
              </h2>
              <p className="text-sm text-[#ABABAD] max-w-xl leading-relaxed">
                {currentChannel.description ||
                  `This is the very beginning of the #${currentChannel.name} channel. Start collaborating with your team!`}
              </p>
            </div>
          ) : currentDm ? (
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#2BAC76]/20 text-emerald-400 flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">
                {currentDm.isGroup ? currentDm.name || 'Group Conversation' : 'Direct Conversation'}
              </h2>
              <p className="text-sm text-[#ABABAD] max-w-xl">
                This is the start of your message history. Messages are private to participants.
              </p>
            </div>
          ) : null}
        </div>

        {/* Empty messages state */}
        {currentMessages.length === 0 ? (
          <div className="py-12 text-center text-[#8D9197]">
            <p className="text-sm">No messages yet. Send a message below to start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {currentMessages.map((msg, idx) => {
              const prevMsg = idx > 0 ? currentMessages[idx - 1] : undefined;
              const isFirstOfDay = !prevMsg || !isSameDay(prevMsg.timestamp, msg.timestamp);
              const isGrouped = shouldGroupMessages(prevMsg, msg);

              return (
                <React.Fragment key={msg.id}>
                  {/* Date Separator */}
                  {isFirstOfDay && (
                    <div className="relative my-4 flex items-center justify-center select-none">
                      <div className="absolute inset-0 flex items-center px-4">
                        <div className="w-full border-t border-[#383F45]" />
                      </div>
                      <div className="relative z-10 bg-[#1A1D21] px-3 py-0.5 rounded-full border border-[#383F45] text-[11px] font-semibold text-[#ABABAD] shadow-sm">
                        {formatDateSeparator(msg.timestamp)}
                      </div>
                    </div>
                  )}

                  {/* Message Item */}
                  <MessageItem message={msg} isGrouped={isGrouped} />
                </React.Fragment>
              );
            })}
          </div>
        )}

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-6 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1264A3] hover:bg-[#1164A3] text-white shadow-xl text-xs font-semibold transition-all hover:scale-105"
        >
          <ChevronDown className="w-4 h-4" />
          <span>Jump to latest</span>
        </button>
      )}
    </div>
  );
};

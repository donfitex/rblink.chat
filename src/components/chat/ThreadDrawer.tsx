import React, { useEffect, useRef } from 'react';
import { X, MessageSquare, Pin } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { formatFullTime, formatMessageTime, formatRelativeTime } from '../../utils/formatters';
import { MarkdownContent } from './MarkdownContent';
import { FileAttachmentCard } from '../files/FileAttachmentCard';
import { MessageComposer } from './MessageComposer';

export const ThreadDrawer: React.FC = () => {
  const {
    activeThread,
    closeThread,
    threadReplies,
    users,
    activeUser,
    toggleReaction,
    deleteMessage,
    setViewingUserProfile,
    setPreviewImage,
    setPreviewPdf,
    currentChannel
  } = useChat();

  const repliesBottomRef = useRef<HTMLDivElement>(null);

  // Esc key listener to close thread
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeThread();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeThread]);

  // Scroll to bottom of replies when replies change
  useEffect(() => {
    if (repliesBottomRef.current) {
      repliesBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [threadReplies.length]);

  if (!activeThread) return null;

  const parentSender = users.find((u) => u.id === activeThread.senderId) || {
    id: activeThread.senderId,
    name: 'Unknown User',
    username: 'unknown',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    role: 'member',
    presence: 'offline',
    email: '',
    joinedAt: '',
    lastActive: ''
  };

  return (
    <div className="w-full md:w-[420px] lg:w-[460px] h-full flex flex-col bg-[#1A1D21] border-l border-[#383F45] shadow-2xl z-30 shrink-0 animate-slideInRight">
      {/* Thread Header */}
      <div className="h-14 px-4 border-b border-[#383F45] flex items-center justify-between bg-[#1E2228] select-none">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#1D9BD1]" />
          <h3 className="font-bold text-white text-sm">Thread</h3>
          <span className="text-xs text-[#8D9197]">
            #{currentChannel?.name || 'conversation'}
          </span>
        </div>
        <button
          onClick={closeThread}
          className="p-1.5 rounded-lg hover:bg-[#2D3136] text-[#ABABAD] hover:text-white transition-colors"
          title="Close thread (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Parent Message Pinned at Top */}
        <div className="p-3 rounded-xl bg-[#222529] border border-[#383F45] shadow-sm">
          <div className="flex items-center gap-2.5 mb-2">
            <img
              src={parentSender.avatar}
              alt={parentSender.name}
              onClick={() => setViewingUserProfile(parentSender)}
              className="w-8 h-8 rounded-md object-cover cursor-pointer hover:opacity-90"
            />
            <div className="truncate">
              <span
                onClick={() => setViewingUserProfile(parentSender)}
                className="font-bold text-white text-xs hover:underline cursor-pointer"
              >
                {parentSender.name}
              </span>
              <span
                className="text-[11px] text-[#8D9197] ml-2"
                title={formatFullTime(activeThread.timestamp)}
              >
                {formatMessageTime(activeThread.timestamp)}
              </span>
            </div>
          </div>

          <MarkdownContent
            content={activeThread.content}
            users={users}
            onMentionClick={(u) => setViewingUserProfile(u)}
          />

          {/* Attachments if any */}
          {activeThread.attachments && activeThread.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {activeThread.attachments.map((att) => (
                <FileAttachmentCard
                  key={att.id}
                  attachment={att}
                  onPreviewImage={setPreviewImage}
                  onPreviewPdf={setPreviewPdf}
                />
              ))}
            </div>
          )}

          {/* Reactions */}
          {activeThread.reactions && activeThread.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {activeThread.reactions.map((r) => {
                const hasReacted = r.users.includes(activeUser.id);
                return (
                  <button
                    key={r.emoji}
                    onClick={() => toggleReaction(activeThread.id, r.emoji)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${
                      hasReacted
                        ? 'border-[#1264A3] bg-[#1264A3]/20 text-white'
                        : 'border-[#383F45] bg-[#1A1D21] text-[#D1D2D3]'
                    }`}
                  >
                    <span>{r.emoji}</span>
                    <span>{r.count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Reply Count Divider */}
        <div className="relative flex items-center justify-center select-none my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#383F45]" />
          </div>
          <div className="relative z-10 bg-[#1A1D21] px-3 text-xs text-[#8D9197] font-medium">
            {threadReplies.length} {threadReplies.length === 1 ? 'reply' : 'replies'}
          </div>
        </div>

        {/* Replies List */}
        <div className="space-y-3">
          {threadReplies.map((reply) => {
            const sender = users.find((u) => u.id === reply.senderId) || parentSender;
            const isOwner = reply.senderId === activeUser.id;

            return (
              <div
                key={reply.id}
                className="group relative flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#222529]/60 transition-colors"
              >
                <img
                  src={sender.avatar}
                  alt={sender.name}
                  onClick={() => setViewingUserProfile(sender)}
                  className="w-7 h-7 rounded-md object-cover mt-0.5 cursor-pointer hover:opacity-90 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-baseline gap-2">
                      <span
                        onClick={() => setViewingUserProfile(sender)}
                        className="font-bold text-white text-xs hover:underline cursor-pointer"
                      >
                        {sender.name}
                      </span>
                      <span
                        className="text-[10px] text-[#8D9197]"
                        title={formatFullTime(reply.timestamp)}
                      >
                        {formatRelativeTime(reply.timestamp)}
                      </span>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => deleteMessage(reply.id)}
                        className="opacity-0 group-hover:opacity-100 text-[#8D9197] hover:text-red-400 p-1 rounded"
                        title="Delete reply"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <MarkdownContent
                    content={reply.content}
                    users={users}
                    onMentionClick={(u) => setViewingUserProfile(u)}
                  />

                  {reply.attachments && reply.attachments.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {reply.attachments.map((att) => (
                        <FileAttachmentCard
                          key={att.id}
                          attachment={att}
                          onPreviewImage={setPreviewImage}
                          onPreviewPdf={setPreviewPdf}
                        />
                      ))}
                    </div>
                  )}

                  {/* Reaction chips */}
                  {reply.reactions && reply.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {reply.reactions.map((r) => (
                        <button
                          key={r.emoji}
                          onClick={() => toggleReaction(reply.id, r.emoji)}
                          className="flex items-center gap-1 px-1.5 py-0.2 rounded-full border border-[#383F45] bg-[#1A1D21] text-xs text-[#D1D2D3]"
                        >
                          <span>{r.emoji}</span>
                          <span className="text-[10px]">{r.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={repliesBottomRef} />
        </div>
      </div>

      {/* Thread Composer */}
      <div className="p-3 bg-[#1E2228] border-t border-[#383F45]">
        <MessageComposer isThread={true} />
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Smile,
  MessageSquare,
  Bookmark,
  Pin,
  MoreHorizontal,
  Edit2,
  Trash2,
  Copy,
  Link2,
  Flag,
  Check,
  X
} from 'lucide-react';
import { Message, User } from '../../types';
import { useChat } from '../../context/ChatContext';
import { formatFullTime, formatMessageTime, formatRelativeTime } from '../../utils/formatters';
import { MarkdownContent } from './MarkdownContent';
import { PollCard } from '../collaboration/PollCard';
import { ChecklistCard } from '../collaboration/ChecklistCard';
import { LinkPreviewCard } from '../collaboration/LinkPreviewCard';
import { FileAttachmentCard } from '../files/FileAttachmentCard';
import { EmojiPicker } from '../ui/EmojiPicker';

interface MessageItemProps {
  message: Message;
  isGrouped?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, isGrouped = false }) => {
  const {
    activeUser,
    users,
    toggleReaction,
    openThread,
    editMessage,
    deleteMessage,
    togglePinMessage,
    toggleSaveMessage,
    savedMessageIds,
    votePoll,
    toggleChecklistItem,
    setReportMessageTarget,
    setViewingUserProfile,
    setPreviewImage,
    setPreviewPdf,
    showToast,
    highlightedMessageId
  } = useChat();

  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const sender: User = users.find((u) => u.id === message.senderId) || {
    id: message.senderId,
    name: 'Unknown User',
    username: 'unknown',
    email: '',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    role: 'member',
    presence: 'offline',
    joinedAt: '',
    lastActive: ''
  };

  const isOwner = message.senderId === activeUser.id;
  const isAdmin = activeUser.role === 'admin' || activeUser.role === 'owner';
  const isSaved = savedMessageIds.includes(message.id);
  const isHighlighted = highlightedMessageId === message.id;

  const handleSaveEdit = () => {
    if (editContent.trim()) {
      editMessage(message.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.content);
    showToast('Message text copied', 'info');
    setShowMoreMenu(false);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#msg-${message.id}`;
    navigator.clipboard.writeText(url);
    showToast('Message link copied to clipboard', 'info');
    setShowMoreMenu(false);
  };

  // Quick reactions bar
  const quickEmojis = ['👍', '❤️', '😂', '🎉', '🚀', '👀'];

  return (
    <div
      id={`msg-${message.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMoreMenu(false);
      }}
      className={`relative group px-4 transition-colors ${
        isGrouped ? 'py-0.5' : 'pt-2.5 pb-1'
      } ${
        isHighlighted
          ? 'bg-amber-500/15 message-highlight-pulse'
          : isHovered
          ? 'bg-[#222529]/70'
          : 'bg-transparent'
      }`}
    >
      {/* Hover Action Bar */}
      {isHovered && !isEditing && (
        <div
          className="absolute -top-3.5 right-4 z-20 flex items-center bg-[#222529] border border-[#383F45] rounded-lg shadow-lg p-0.5 text-[#ABABAD]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Reacts */}
          <div className="hidden sm:flex items-center">
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => toggleReaction(message.id, emoji)}
                className="w-7 h-7 flex items-center justify-center hover:bg-[#2D3136] rounded text-sm hover:scale-125 transition-transform"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
            <div className="w-[1px] h-4 bg-[#383F45] mx-0.5" />
          </div>

          {/* Full Emoji Picker Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-7 h-7 flex items-center justify-center hover:bg-[#2D3136] hover:text-white rounded"
              title="Add reaction"
            >
              <Smile className="w-4 h-4" />
            </button>
            {showEmojiPicker && (
              <div className="absolute right-0 top-8 z-50">
                <EmojiPicker
                  onSelectEmoji={(emoji) => {
                    toggleReaction(message.id, emoji);
                    setShowEmojiPicker(false);
                  }}
                  onClose={() => setShowEmojiPicker(false)}
                />
              </div>
            )}
          </div>

          {/* Reply in Thread */}
          <button
            onClick={() => openThread(message)}
            className="w-7 h-7 flex items-center justify-center hover:bg-[#2D3136] hover:text-white rounded"
            title="Reply in thread"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* Pin Message */}
          <button
            onClick={() => togglePinMessage(message.id)}
            className={`w-7 h-7 flex items-center justify-center hover:bg-[#2D3136] rounded ${
              message.isPinned ? 'text-amber-400' : 'hover:text-white'
            }`}
            title={message.isPinned ? 'Unpin message' : 'Pin to channel'}
          >
            <Pin className="w-4 h-4" />
          </button>

          {/* Save / Bookmark */}
          <button
            onClick={() => toggleSaveMessage(message.id)}
            className={`w-7 h-7 flex items-center justify-center hover:bg-[#2D3136] rounded ${
              isSaved ? 'text-[#1D9BD1]' : 'hover:text-white'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save message'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#1D9BD1]' : ''}`} />
          </button>

          {/* Edit (if owner) */}
          {isOwner && (
            <button
              onClick={() => {
                setIsEditing(true);
                setEditContent(message.content);
              }}
              className="w-7 h-7 flex items-center justify-center hover:bg-[#2D3136] hover:text-white rounded"
              title="Edit message"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* More options menu */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="w-7 h-7 flex items-center justify-center hover:bg-[#2D3136] hover:text-white rounded"
              title="More actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 top-8 z-50 w-48 rounded-lg bg-[#222529] border border-[#383F45] shadow-xl py-1 text-xs text-[#D1D2D3]">
                <button
                  onClick={handleCopyText}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#2D3136] text-left"
                >
                  <Copy className="w-3.5 h-3.5 text-[#8D9197]" />
                  Copy message text
                </button>
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#2D3136] text-left"
                >
                  <Link2 className="w-3.5 h-3.5 text-[#8D9197]" />
                  Copy link to message
                </button>
                <button
                  onClick={() => {
                    setReportMessageTarget(message);
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#2D3136] text-left text-amber-400"
                >
                  <Flag className="w-3.5 h-3.5" />
                  Report message
                </button>
                {(isOwner || isAdmin) && (
                  <button
                    onClick={() => {
                      deleteMessage(message.id);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#2D3136] text-left text-red-400 border-t border-[#383F45] mt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete message
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Message Body */}
      <div className="flex items-start gap-3">
        {/* Avatar or Grouped Timestamp */}
        {isGrouped ? (
          <div className="w-9 shrink-0 text-right pr-2 select-none">
            <span
              className="text-[10px] text-[#6E737A] opacity-0 group-hover:opacity-100 transition-opacity"
              title={formatFullTime(message.timestamp)}
            >
              {formatMessageTime(message.timestamp)}
            </span>
          </div>
        ) : (
          <div
            onClick={() => setViewingUserProfile(sender)}
            className="relative cursor-pointer shrink-0 mt-0.5 group/avatar"
            title={`View ${sender.name}'s profile`}
          >
            <img
              src={sender.avatar}
              alt={sender.name}
              className="w-9 h-9 rounded-md object-cover hover:opacity-90 transition-opacity"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#1A1D21] ${
                sender.presence === 'online'
                  ? 'bg-emerald-500'
                  : sender.presence === 'away'
                  ? 'bg-amber-500'
                  : sender.presence === 'dnd'
                  ? 'bg-red-500'
                  : 'bg-gray-500'
              }`}
            />
          </div>
        )}

        {/* Content column */}
        <div className="flex-1 min-w-0">
          {!isGrouped && (
            <div className="flex items-baseline gap-2 mb-0.5 select-none">
              <span
                onClick={() => setViewingUserProfile(sender)}
                className="font-bold text-white text-sm hover:underline cursor-pointer"
              >
                {sender.name}
              </span>
              {sender.role !== 'member' && (
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#2D3136] text-[#ABABAD] capitalize">
                  {sender.role}
                </span>
              )}
              {sender.customStatus && (
                <span className="text-xs text-[#8D9197] truncate" title={sender.customStatus.text}>
                  {sender.customStatus.emoji} {sender.customStatus.text}
                </span>
              )}
              <span
                className="text-xs text-[#8D9197] hover:underline cursor-default"
                title={formatFullTime(message.timestamp)}
              >
                {formatRelativeTime(message.timestamp)}
              </span>
              {message.isEdited && (
                <span
                  className="text-[11px] text-[#6E737A]"
                  title={message.updatedAt ? `Edited at ${formatFullTime(message.updatedAt)}` : 'Edited'}
                >
                  (edited)
                </span>
              )}
              {message.isPinned && (
                <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                  <Pin className="w-3 h-3" /> Pinned
                </span>
              )}
            </div>
          )}

          {/* Message Text / Inline Editor */}
          {isEditing ? (
            <div className="mt-1 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-[#222529] border border-[#1264A3] rounded-lg p-2.5 text-sm text-white focus:outline-none resize-none"
                rows={3}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveEdit();
                  }
                  if (e.key === 'Escape') setIsEditing(false);
                }}
              />
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1 px-3 py-1 rounded bg-[#1264A3] hover:bg-[#1164A3] text-white font-medium transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-1 px-3 py-1 rounded bg-[#2D3136] hover:bg-[#383F45] text-[#D1D2D3] transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Cancel (Esc)
                </button>
              </div>
            </div>
          ) : (
            <MarkdownContent
              content={message.content}
              users={users}
              onMentionClick={(u) => setViewingUserProfile(u)}
            />
          )}

          {/* Poll Card */}
          {message.poll && (
            <PollCard
              poll={message.poll}
              currentUserId={activeUser.id}
              users={users}
              onVote={votePoll}
            />
          )}

          {/* Checklist Card */}
          {message.checklist && (
            <ChecklistCard
              checklist={message.checklist}
              currentUserId={activeUser.id}
              users={users}
              onToggleItem={toggleChecklistItem}
            />
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-1 space-y-1">
              {message.attachments.map((att) => (
                <FileAttachmentCard
                  key={att.id}
                  attachment={att}
                  onPreviewImage={setPreviewImage}
                  onPreviewPdf={setPreviewPdf}
                />
              ))}
            </div>
          )}

          {/* Link Previews */}
          {message.linkPreviews && message.linkPreviews.length > 0 && (
            <div className="mt-1 space-y-1">
              {message.linkPreviews.map((preview, idx) => (
                <LinkPreviewCard key={idx} preview={preview} />
              ))}
            </div>
          )}

          {/* Reactions bar */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 select-none">
              {message.reactions.map((reaction) => {
                const hasReacted = reaction.users.includes(activeUser.id);
                const reactorNames = reaction.users
                  .map((uid) => users.find((u) => u.id === uid)?.name || 'Someone')
                  .join(', ');

                return (
                  <button
                    key={reaction.emoji}
                    onClick={() => toggleReaction(message.id, reaction.emoji)}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium transition-all ${
                      hasReacted
                        ? 'border-[#1264A3] bg-[#1264A3]/20 text-white'
                        : 'border-[#383F45] bg-[#222529] hover:bg-[#2D3136] text-[#D1D2D3]'
                    }`}
                    title={`Reacted by: ${reactorNames}`}
                  >
                    <span>{reaction.emoji}</span>
                    <span className={hasReacted ? 'text-[#68CDFF]' : 'text-[#8D9197]'}>
                      {reaction.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Thread Replies Button (Slack style) */}
          {message.replyCount && message.replyCount > 0 ? (
            <div className="mt-1.5">
              <button
                onClick={() => openThread(message)}
                className="flex items-center gap-2 py-1 px-2 -ml-2 rounded hover:bg-[#222529] transition-colors group/thread select-none"
              >
                {/* Avatars of repliers */}
                <div className="flex -space-x-1.5">
                  {(message.replyUserIds || []).slice(0, 3).map((uid) => {
                    const replier = users.find((u) => u.id === uid);
                    if (!replier) return null;
                    return (
                      <img
                        key={uid}
                        src={replier.avatar}
                        alt={replier.name}
                        className="w-5 h-5 rounded-full border border-[#1A1D21] object-cover"
                      />
                    );
                  })}
                </div>
                <span className="text-xs font-semibold text-[#1D9BD1] group-hover/thread:underline">
                  {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
                </span>
                {message.latestReplyAt && (
                  <span className="text-xs text-[#8D9197]">
                    Last reply {formatRelativeTime(message.latestReplyAt)}
                  </span>
                )}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

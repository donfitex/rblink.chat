import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Link,
  Paperclip,
  Smile,
  Send,
  AtSign,
  BarChart3,
  ListChecks,
  Clock,
  Megaphone,
  X,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Attachment, Poll, Checklist } from '../../types';
import { EmojiPicker } from '../ui/EmojiPicker';
import { formatFileSize } from '../../utils/formatters';

interface MessageComposerProps {
  channelName?: string;
  dmName?: string;
  isThread?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  channelName,
  dmName,
  isThread = false
}) => {
  const {
    activeUser,
    users,
    sendMessage,
    sendThreadReply,
    scheduleMessage,
    showToast,
    currentChannel
  } = useChat();

  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);

  // Poll Creator Drawer / State
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false);

  // Checklist Creator State
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [checklistTitle, setChecklistTitle] = useState('');
  const [checklistItems, setChecklistItems] = useState(['', '']);

  // Schedule Message State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleMinutes, setScheduleMinutes] = useState(15);

  // Announcement mode (for workspace owners/admins)
  const [isAnnouncement, setIsAnnouncement] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwnerOrAdmin = activeUser.role === 'owner' || activeUser.role === 'admin';
  const charLimit = 4000;
  const isOverLimit = text.length > charLimit;
  const isNearLimit = text.length > 3500;

  // Mention suggestions
  const mentionCandidates = [
    { id: 'special_channel', name: 'channel', username: 'channel', isSpecial: true },
    { id: 'special_everyone', name: 'everyone', username: 'everyone', isSpecial: true },
    ...users.filter((u) => u.id !== activeUser.id)
  ].filter(
    (c) =>
      c.name.toLowerCase().includes(mentionFilter.toLowerCase()) ||
      c.username.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  // Insert formatting tag around selection
  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selected = text.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;

    setText(text.substring(0, start) + replacement + text.substring(end));

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          start + prefix.length,
          start + prefix.length + (selected.length || 4)
        );
      }
    }, 10);
  };

  // Text change handler with mention detection
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const query = textBeforeCursor.slice(lastAtSymbol + 1);
      // Check if there is whitespace after @
      if (!query.includes(' ')) {
        setMentionFilter(query);
        setShowMentionMenu(true);
        setMentionSelectedIndex(0);
        return;
      }
    }

    setShowMentionMenu(false);
  };

  const selectMention = (candidate: any) => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = text.slice(0, cursorPos);
    const textAfterCursor = text.slice(cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const handle = candidate.username;
      const newText =
        textBeforeCursor.slice(0, lastAtSymbol) + `@${handle} ` + textAfterCursor;
      setText(newText);
      setShowMentionMenu(false);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newPos = lastAtSymbol + handle.length + 2;
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 10);
    }
  };

  // Send message handler
  const handleSend = () => {
    if (isOverLimit) {
      showToast('Message exceeds 4,000 character limit', 'error');
      return;
    }

    if (!text.trim() && attachments.length === 0) return;

    if (isThread) {
      sendThreadReply(text.trim(), attachments);
    } else {
      sendMessage(
        text.trim(),
        attachments.length > 0 ? attachments : undefined,
        undefined,
        undefined,
        isAnnouncement
      );
    }

    setText('');
    setAttachments([]);
    setIsAnnouncement(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Keyboard navigation & Enter-to-send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionMenu && mentionCandidates.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionSelectedIndex((prev) => (prev + 1) % mentionCandidates.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionSelectedIndex(
          (prev) => (prev - 1 + mentionCandidates.length) % mentionCandidates.length
        );
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectMention(mentionCandidates[mentionSelectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionMenu(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // File Upload Handling
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxFileSize = 25 * 1024 * 1024; // 25MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > maxFileSize) {
        showToast(`File "${file.name}" exceeds the 25MB limit.`, 'error');
        continue;
      }

      setIsUploading(true);

      // Create local preview blob URL
      const previewUrl = file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : undefined;

      const newAtt: Attachment = {
        id: `att_${Date.now()}_${i}`,
        name: file.name,
        size: file.size,
        type: file.mimetype || file.type || 'application/octet-stream',
        url: previewUrl || URL.createObjectURL(file),
        previewUrl,
        uploadedAt: new Date().toISOString()
      };

      setAttachments((prev) => [...prev, newAtt]);
      setIsUploading(false);
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Create Poll
  const handleCreatePoll = () => {
    if (!pollQuestion.trim()) {
      showToast('Please enter a poll question', 'error');
      return;
    }
    const validOptions = pollOptions.filter((o) => o.trim().length > 0);
    if (validOptions.length < 2) {
      showToast('Please add at least 2 options for the poll', 'error');
      return;
    }

    const newPoll: Poll = {
      id: `poll_${Date.now()}`,
      question: pollQuestion.trim(),
      options: validOptions.map((text, i) => ({
        id: `opt_${Date.now()}_${i}`,
        text: text.trim(),
        votes: []
      })),
      allowMultiple: pollAllowMultiple,
      isAnonymous: false,
      createdBy: activeUser.id,
      createdAt: new Date().toISOString()
    };

    sendMessage('', undefined, newPoll);
    setShowPollModal(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    showToast('Poll created in channel', 'success');
  };

  // Create Checklist
  const handleCreateChecklist = () => {
    if (!checklistTitle.trim()) {
      showToast('Please enter a checklist title', 'error');
      return;
    }
    const validItems = checklistItems.filter((i) => i.trim().length > 0);
    if (validItems.length === 0) {
      showToast('Please add at least 1 checklist item', 'error');
      return;
    }

    const newChecklist: Checklist = {
      id: `chk_${Date.now()}`,
      title: checklistTitle.trim(),
      items: validItems.map((text, idx) => ({
        id: `ci_${Date.now()}_${idx}`,
        text: text.trim(),
        completed: false
      })),
      createdBy: activeUser.id,
      createdAt: new Date().toISOString()
    };

    sendMessage('', undefined, undefined, newChecklist);
    setShowChecklistModal(false);
    setChecklistTitle('');
    setChecklistItems(['', '']);
    showToast('Checklist created in channel', 'success');
  };

  // Schedule Message
  const handleScheduleSubmit = () => {
    if (!text.trim()) {
      showToast('Please enter the message to schedule', 'error');
      return;
    }
    const scheduledTime = new Date(Date.now() + scheduleMinutes * 60 * 1000).toISOString();
    scheduleMessage(text.trim(), scheduledTime);
    setText('');
    setShowScheduleModal(false);
  };

  const placeholderText = isThread
    ? 'Reply in thread...'
    : channelName
    ? `Message #${channelName}`
    : dmName
    ? `Message ${dmName}`
    : 'Send a message...';

  return (
    <div className="p-3 bg-[#1A1D21] border-t border-[#383F45]/60 relative select-none">
      {/* Mention Auto-complete Dropdown */}
      {showMentionMenu && mentionCandidates.length > 0 && (
        <div className="absolute bottom-full left-4 mb-2 z-50 w-72 rounded-xl bg-[#222529] border border-[#383F45] shadow-2xl overflow-hidden py-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-[#8D9197] uppercase border-b border-[#383F45]">
            Members matching "@{mentionFilter}"
          </div>
          <div className="max-h-52 overflow-y-auto">
            {mentionCandidates.map((candidate, idx) => (
              <div
                key={candidate.id}
                onClick={() => selectMention(candidate)}
                className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${
                  idx === mentionSelectedIndex ? 'bg-[#1264A3] text-white' : 'hover:bg-[#2D3136] text-[#D1D2D3]'
                }`}
              >
                {candidate.isSpecial ? (
                  <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    @
                  </div>
                ) : (
                  <img
                    src={(candidate as any).avatar}
                    alt={candidate.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                )}
                <div className="truncate">
                  <span className="font-semibold text-xs block">{candidate.name}</span>
                  <span className="text-[11px] opacity-75">@{candidate.username}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachments preview tray before send */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-[#222529] border border-[#383F45] rounded-lg">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-[#1A1D21] border border-[#383F45] rounded-md text-xs text-[#D1D2D3] max-w-xs"
            >
              <FileText className="w-4 h-4 text-[#1D9BD1] shrink-0" />
              <div className="truncate">
                <p className="font-medium truncate text-white">{att.name}</p>
                <p className="text-[10px] text-[#8D9197]">{formatFileSize(att.size)}</p>
              </div>
              <button
                onClick={() => removeAttachment(att.id)}
                className="text-[#8D9197] hover:text-white p-0.5 rounded hover:bg-[#2D3136]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Composer Box */}
      <div className={`rounded-xl border bg-[#222529] transition-all shadow-sm ${
        isOverLimit ? 'border-red-500' : 'border-[#383F45] focus-within:border-[#1264A3]'
      }`}>
        {/* WYSIWYG Formatting Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-b border-[#383F45] text-[#ABABAD]">
          <button
            onClick={() => insertFormatting('**')}
            className="p-1 rounded hover:bg-[#2D3136] hover:text-white"
            title="Bold (**text**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('*')}
            className="p-1 rounded hover:bg-[#2D3136] hover:text-white"
            title="Italic (*text*)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('~')}
            className="p-1 rounded hover:bg-[#2D3136] hover:text-white"
            title="Strikethrough (~text~)"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-[#383F45] mx-1" />

          <button
            onClick={() => insertFormatting('`')}
            className="p-1 rounded hover:bg-[#2D3136] hover:text-white"
            title="Inline code (`code`)"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('```typescript\n', '\n```')}
            className="px-1.5 py-0.5 rounded hover:bg-[#2D3136] hover:text-white font-mono text-xs"
            title="Code block (```lang)"
          >
            {'</>'}
          </button>
          <button
            onClick={() => insertFormatting('> ')}
            className="p-1 rounded hover:bg-[#2D3136] hover:text-white"
            title="Quote (> text)"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('- ')}
            className="p-1 rounded hover:bg-[#2D3136] hover:text-white"
            title="Bullet list (- item)"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('1. ')}
            className="p-1 rounded hover:bg-[#2D3136] hover:text-white"
            title="Numbered list (1. item)"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('[', '](https://)')}
            className="p-1 rounded hover:bg-[#2D3136] hover:text-white"
            title="Link [title](url)"
          >
            <Link className="w-3.5 h-3.5" />
          </button>

          {/* Extended Collaboration Tools (if not in thread) */}
          {!isThread && (
            <>
              <div className="w-[1px] h-4 bg-[#383F45] mx-1" />

              <button
                onClick={() => setShowPollModal(true)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[#2D3136] hover:text-white text-xs font-medium"
                title="Create a team poll"
              >
                <BarChart3 className="w-3.5 h-3.5 text-[#1D9BD1]" />
                <span className="hidden sm:inline">Poll</span>
              </button>

              <button
                onClick={() => setShowChecklistModal(true)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[#2D3136] hover:text-white text-xs font-medium"
                title="Create a team checklist"
              >
                <ListChecks className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Checklist</span>
              </button>

              <button
                onClick={() => setShowScheduleModal(true)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[#2D3136] hover:text-white text-xs font-medium"
                title="Schedule message for later"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Schedule</span>
              </button>

              {isOwnerOrAdmin && currentChannel?.category === 'announcements' && (
                <button
                  onClick={() => setIsAnnouncement(!isAnnouncement)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium transition-colors ${
                    isAnnouncement
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'hover:bg-[#2D3136] hover:text-white'
                  }`}
                  title="Toggle official announcement format"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Announcement</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Text Input Area */}
        <div className="p-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            className="w-full bg-transparent text-sm text-white placeholder-[#8D9197] resize-none focus:outline-none max-h-48 leading-relaxed font-sans"
          />
        </div>

        {/* Bottom Bar: Action buttons & Send */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-[#2D3136]/50">
          <div className="flex items-center gap-1">
            {/* File attachment button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg hover:bg-[#2D3136] text-[#ABABAD] hover:text-white transition-colors"
              title="Attach files (images, PDFs, documents up to 25MB)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Mention shortcut */}
            <button
              onClick={() => {
                setText((t) => t + '@');
                setMentionFilter('');
                setShowMentionMenu(true);
                textareaRef.current?.focus();
              }}
              className="p-1.5 rounded-lg hover:bg-[#2D3136] text-[#ABABAD] hover:text-white transition-colors"
              title="Mention someone (@)"
            >
              <AtSign className="w-4 h-4" />
            </button>

            {/* Emoji picker */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 rounded-lg hover:bg-[#2D3136] text-[#ABABAD] hover:text-white transition-colors"
                title="Emoji picker"
              >
                <Smile className="w-4 h-4" />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-10 left-0 z-50">
                  <EmojiPicker
                    onSelectEmoji={(emoji) => {
                      setText((t) => t + emoji);
                      setShowEmojiPicker(false);
                      textareaRef.current?.focus();
                    }}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Character limit counter */}
            {(isNearLimit || isOverLimit) && (
              <span
                className={`text-xs font-mono font-medium flex items-center gap-1 ${
                  isOverLimit ? 'text-red-400' : 'text-amber-400'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                {charLimit - text.length}
              </span>
            )}

            <span className="hidden sm:inline text-[11px] text-[#6E737A]">
              <strong>Return</strong> to send, <strong>Shift+Return</strong> for newline
            </span>

            <button
              onClick={handleSend}
              disabled={(!text.trim() && attachments.length === 0) || isOverLimit || isUploading}
              className={`flex items-center justify-center p-2 rounded-lg transition-all ${
                (!text.trim() && attachments.length === 0) || isOverLimit || isUploading
                  ? 'bg-[#2D3136] text-[#565D65] cursor-not-allowed'
                  : 'bg-[#1264A3] hover:bg-[#1164A3] text-white shadow-md hover:scale-105 active:scale-95'
              }`}
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Create Poll */}
      {showPollModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowPollModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#222529] border border-[#383F45] rounded-xl p-5 shadow-2xl text-[#D1D2D3]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#383F45] mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#1D9BD1]" />
                Create a Poll
              </h3>
              <button
                onClick={() => setShowPollModal(false)}
                className="text-[#8D9197] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#ABABAD] mb-1">
                  Question
                </label>
                <input
                  type="text"
                  placeholder="e.g. Which design proposal should we choose?"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-[#383F45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1264A3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#ABABAD] mb-1">
                  Options
                </label>
                <div className="space-y-2">
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...pollOptions];
                          updated[i] = e.target.value;
                          setPollOptions(updated);
                        }}
                        className="flex-1 bg-[#1A1D21] border border-[#383F45] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#1264A3]"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                          className="text-[#8D9197] hover:text-red-400 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {pollOptions.length < 6 && (
                  <button
                    onClick={() => setPollOptions([...pollOptions, ''])}
                    className="mt-2 text-xs font-semibold text-[#1D9BD1] hover:underline"
                  >
                    + Add option
                  </button>
                )}
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs text-[#D1D2D3] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pollAllowMultiple}
                    onChange={(e) => setPollAllowMultiple(e.target.checked)}
                    className="rounded bg-[#1A1D21] border-[#383F45] text-[#1264A3]"
                  />
                  Allow participants to vote for multiple options
                </label>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#383F45] flex justify-end gap-2">
              <button
                onClick={() => setShowPollModal(false)}
                className="px-4 py-2 rounded-lg bg-[#2D3136] hover:bg-[#383F45] text-xs font-medium text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePoll}
                className="px-4 py-2 rounded-lg bg-[#1264A3] hover:bg-[#1164A3] text-xs font-semibold text-white shadow"
              >
                Publish Poll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Checklist */}
      {showChecklistModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowChecklistModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#222529] border border-[#383F45] rounded-xl p-5 shadow-2xl text-[#D1D2D3]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#383F45] mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-emerald-400" />
                Create a Checklist
              </h3>
              <button
                onClick={() => setShowChecklistModal(false)}
                className="text-[#8D9197] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#ABABAD] mb-1">
                  Checklist Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deployment Verification Tasks"
                  value={checklistTitle}
                  onChange={(e) => setChecklistTitle(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-[#383F45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1264A3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#ABABAD] mb-1">
                  Items to check off
                </label>
                <div className="space-y-2">
                  {checklistItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`Task ${i + 1}`}
                        value={item}
                        onChange={(e) => {
                          const updated = [...checklistItems];
                          updated[i] = e.target.value;
                          setChecklistItems(updated);
                        }}
                        className="flex-1 bg-[#1A1D21] border border-[#383F45] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#1264A3]"
                      />
                      {checklistItems.length > 1 && (
                        <button
                          onClick={() => setChecklistItems(checklistItems.filter((_, idx) => idx !== i))}
                          className="text-[#8D9197] hover:text-red-400 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {checklistItems.length < 8 && (
                  <button
                    onClick={() => setChecklistItems([...checklistItems, ''])}
                    className="mt-2 text-xs font-semibold text-emerald-400 hover:underline"
                  >
                    + Add task item
                  </button>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#383F45] flex justify-end gap-2">
              <button
                onClick={() => setShowChecklistModal(false)}
                className="px-4 py-2 rounded-lg bg-[#2D3136] hover:bg-[#383F45] text-xs font-medium text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChecklist}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow"
              >
                Send Checklist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Schedule Message */}
      {showScheduleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowScheduleModal(false)}
        >
          <div
            className="w-full max-w-sm bg-[#222529] border border-[#383F45] rounded-xl p-5 shadow-2xl text-[#D1D2D3]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#383F45] mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Schedule Message
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-[#8D9197] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#ABABAD] mb-3">
              Compose your message in the composer box, then pick when to send it:
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: 'In 15 minutes', minutes: 15 },
                { label: 'In 1 hour', minutes: 60 },
                { label: 'In 3 hours', minutes: 180 },
                { label: 'Tomorrow morning', minutes: 1440 }
              ].map((preset) => (
                <button
                  key={preset.minutes}
                  onClick={() => setScheduleMinutes(preset.minutes)}
                  className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-colors ${
                    scheduleMinutes === preset.minutes
                      ? 'border-amber-400 bg-amber-500/10 text-white'
                      : 'border-[#383F45] bg-[#1A1D21] text-[#ABABAD] hover:border-[#565D65]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#383F45]">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-3 py-1.5 rounded-lg bg-[#2D3136] text-xs font-medium text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleSubmit}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white shadow"
              >
                Confirm Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

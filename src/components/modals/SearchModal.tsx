import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, MessageSquare, Hash, User, FileText, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Message } from '../../types';
import { formatRelativeTime } from '../../utils/formatters';

export const SearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    channels,
    directMessages,
    users,
    jumpToMessage
  } = useChat();

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'messages' | 'files' | 'people' | 'channels'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSearchOpen]);

  // Aggregate messages from localStorage / context
  const allMessages = useMemo(() => {
    try {
      const stored = localStorage.getItem('rblink_messages');
      if (stored) {
        const dict = JSON.parse(stored);
        const list: Message[] = [];
        Object.keys(dict).forEach((k) => {
          list.push(...dict[k]);
        });
        return list;
      }
    } catch {
      // Fallback
    }
    return [];
  }, [isSearchOpen]);

  // Search Results
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    const items: Array<{
      type: 'message' | 'channel' | 'user' | 'file';
      id: string;
      title: string;
      subtitle: string;
      context?: string;
      targetId: string;
      messageId?: string;
      isDm?: boolean;
      timestamp?: string;
    }> = [];

    // Search Channels
    if (activeFilter === 'all' || activeFilter === 'channels') {
      channels.forEach((c) => {
        if (c.name.toLowerCase().includes(lowerQuery) || c.description?.toLowerCase().includes(lowerQuery)) {
          items.push({
            type: 'channel',
            id: c.id,
            title: `#${c.name}`,
            subtitle: c.description || c.topic || 'Channel',
            targetId: c.id,
            isDm: false
          });
        }
      });
    }

    // Search Users / People
    if (activeFilter === 'all' || activeFilter === 'people') {
      users.forEach((u) => {
        if (u.name.toLowerCase().includes(lowerQuery) || u.username.toLowerCase().includes(lowerQuery)) {
          items.push({
            type: 'user',
            id: u.id,
            title: u.name,
            subtitle: `@${u.username} • ${u.role}`,
            targetId: u.id,
            isDm: true
          });
        }
      });
    }

    // Search Messages & Files
    if (activeFilter === 'all' || activeFilter === 'messages' || activeFilter === 'files') {
      allMessages.forEach((m) => {
        const sender = users.find((u) => u.id === m.senderId);
        const channel = channels.find((c) => c.id === m.channelId);
        const targetId = m.channelId || m.dmId || '';
        const isDm = Boolean(m.dmId);

        // Match content
        if ((activeFilter === 'all' || activeFilter === 'messages') && m.content.toLowerCase().includes(lowerQuery)) {
          items.push({
            type: 'message',
            id: m.id,
            title: sender?.name || 'Someone',
            subtitle: m.content,
            context: channel ? `#${channel.name}` : 'Direct Message',
            targetId,
            messageId: m.id,
            isDm,
            timestamp: m.timestamp
          });
        }

        // Match attachments
        if ((activeFilter === 'all' || activeFilter === 'files') && m.attachments) {
          m.attachments.forEach((att) => {
            if (att.name.toLowerCase().includes(lowerQuery)) {
              items.push({
                type: 'file',
                id: att.id,
                title: att.name,
                subtitle: `Attached by ${sender?.name || 'user'}`,
                context: channel ? `#${channel.name}` : 'Direct Message',
                targetId,
                messageId: m.id,
                isDm,
                timestamp: m.timestamp
              });
            }
          });
        }
      });
    }

    return items;
  }, [query, activeFilter, channels, users, allMessages]);

  if (!isSearchOpen) return null;

  const handleSelectResult = (result: any) => {
    if (result.type === 'message' || result.type === 'file') {
      jumpToMessage(result.targetId, result.messageId, result.isDm);
    } else if (result.type === 'channel') {
      jumpToMessage(result.targetId, '', false);
    }
    setIsSearchOpen(false);
  };

  const highlightMatches = (text: string, queryStr: string) => {
    if (!queryStr) return text;
    const parts = text.split(new RegExp(`(${queryStr})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === queryStr.toLowerCase() ? (
        <mark key={i} className="bg-amber-400 text-black px-0.5 rounded font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={() => setIsSearchOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-[#222529] border border-[#383F45] rounded-xl shadow-2xl overflow-hidden flex flex-col text-[#D1D2D3]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#383F45] bg-[#1A1D21]">
          <Search className="w-5 h-5 text-[#8D9197]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search messages, channels, files, people (e.g. websocket, @alex, launch)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent text-sm text-white placeholder-[#8D9197] focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[#8D9197] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-mono text-[#8D9197] bg-[#2D3136] rounded border border-[#383F45]">
            ESC
          </kbd>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[#383F45] bg-[#1E2228] overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'messages', label: 'Messages' },
            { id: 'channels', label: 'Channels' },
            { id: 'people', label: 'People' },
            { id: 'files', label: 'Files' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${
                activeFilter === tab.id
                  ? 'bg-[#1264A3] text-white'
                  : 'text-[#ABABAD] hover:bg-[#2D3136] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!query.trim() ? (
            <div className="py-12 px-6 text-center text-[#8D9197]">
              <Search className="w-10 h-10 mx-auto mb-3 text-[#565D65]" />
              <p className="text-sm font-semibold text-[#D1D2D3] mb-1">
                Quick Search across rblink.chat
              </p>
              <p className="text-xs max-w-sm mx-auto">
                Type keywords to find messages, channels, team members, or shared attachments.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-[#8D9197]">
              <p className="text-sm">No results found for "{query}"</p>
              <p className="text-xs mt-1">Try refining your search terms or checking another filter.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((res, index) => (
                <div
                  key={`${res.type}-${res.id}-${index}`}
                  onClick={() => handleSelectResult(res)}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-[#1264A3]/20 border border-[#1264A3]'
                      : 'hover:bg-[#2D3136] border border-transparent'
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-md bg-[#1A1D21] border border-[#383F45] text-[#ABABAD] shrink-0">
                    {res.type === 'channel' && <Hash className="w-4 h-4 text-[#1D9BD1]" />}
                    {res.type === 'user' && <User className="w-4 h-4 text-emerald-400" />}
                    {res.type === 'message' && <MessageSquare className="w-4 h-4 text-[#ABABAD]" />}
                    {res.type === 'file' && <FileText className="w-4 h-4 text-amber-400" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-semibold text-white text-xs truncate">
                          {highlightMatches(res.title, query)}
                        </span>
                        {res.context && (
                          <span className="text-[11px] px-1.5 py-0.2 rounded bg-[#1A1D21] text-[#ABABAD]">
                            {res.context}
                          </span>
                        )}
                      </div>
                      {res.timestamp && (
                        <span className="text-[10px] text-[#8D9197] shrink-0">
                          {formatRelativeTime(res.timestamp)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#ABABAD] truncate">
                      {highlightMatches(res.subtitle, query)}
                    </p>
                  </div>

                  <div className="self-center text-[#8D9197]">
                    <CornerDownLeft className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

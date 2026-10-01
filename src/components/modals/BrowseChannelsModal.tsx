import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Hash, Lock, Users, Plus, Archive, Check } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const BrowseChannelsModal: React.FC = () => {
  const {
    isBrowseChannelsOpen,
    setIsBrowseChannelsOpen,
    channels,
    activeUser,
    joinChannel,
    leaveChannel,
    selectChannel,
    setIsCreateChannelOpen
  } = useChat();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'joined' | 'not_joined'>('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsBrowseChannelsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsBrowseChannelsOpen]);

  const filteredChannels = useMemo(() => {
    return channels.filter((c) => {
      const isMember = c.memberIds.includes(activeUser.id);
      if (filter === 'joined' && !isMember) return false;
      if (filter === 'not_joined' && isMember) return false;

      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [channels, activeUser.id, search, filter]);

  if (!isBrowseChannelsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={() => setIsBrowseChannelsOpen(false)}
    >
      <div
        className="w-full max-w-2xl h-[75vh] bg-[#222529] border border-[#383F45] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#D1D2D3]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#383F45] bg-[#1A1D21]">
          <div>
            <h3 className="font-bold text-white text-base">Channel Browser</h3>
            <p className="text-xs text-[#8D9197]">Explore and join public workspace channels</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsBrowseChannelsOpen(false);
                setIsCreateChannelOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1264A3] hover:bg-[#1164A3] text-xs font-semibold text-white shadow"
            >
              <Plus className="w-4 h-4" />
              Create Channel
            </button>
            <button
              onClick={() => setIsBrowseChannelsOpen(false)}
              className="text-[#8D9197] hover:text-white p-1 rounded hover:bg-[#2D3136]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#1E2228] border-b border-[#383F45]">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8D9197]" />
            <input
              type="text"
              placeholder="Search channels..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1A1D21] border border-[#383F45] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#8D9197] focus:outline-none focus:border-[#1264A3]"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-[#1264A3] text-white'
                  : 'bg-[#2D3136] text-[#ABABAD] hover:text-white'
              }`}
            >
              All Channels ({channels.length})
            </button>
            <button
              onClick={() => setFilter('joined')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filter === 'joined'
                  ? 'bg-[#1264A3] text-white'
                  : 'bg-[#2D3136] text-[#ABABAD] hover:text-white'
              }`}
            >
              Joined
            </button>
            <button
              onClick={() => setFilter('not_joined')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filter === 'not_joined'
                  ? 'bg-[#1264A3] text-white'
                  : 'bg-[#2D3136] text-[#ABABAD] hover:text-white'
              }`}
            >
              Discover
            </button>
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredChannels.length === 0 ? (
            <div className="py-12 text-center text-[#8D9197]">
              <Hash className="w-10 h-10 mx-auto mb-2 text-[#565D65]" />
              <p className="text-sm font-semibold text-[#D1D2D3]">No channels found</p>
            </div>
          ) : (
            filteredChannels.map((channel) => {
              const isMember = channel.memberIds.includes(activeUser.id);

              return (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-[#383F45] bg-[#1A1D21] hover:border-[#565D65] transition-all"
                >
                  <div
                    onClick={() => {
                      selectChannel(channel.id);
                      setIsBrowseChannelsOpen(false);
                    }}
                    className="flex-1 min-w-0 cursor-pointer pr-4"
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      {channel.isPrivate ? (
                        <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <Hash className="w-4 h-4 text-[#1D9BD1] shrink-0" />
                      )}
                      <h4 className="font-bold text-white text-sm truncate">
                        {channel.name}
                      </h4>
                      {channel.isArchived && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-semibold">
                          Archived
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#ABABAD] truncate">
                      {channel.description || channel.topic || 'No description'}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-[#8D9197] mt-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {channel.memberIds.length} members
                      </span>
                      <span>•</span>
                      <span className="capitalize">{channel.category}</span>
                    </div>
                  </div>

                  <div>
                    {isMember ? (
                      <button
                        onClick={() => leaveChannel(channel.id)}
                        className="px-3 py-1.5 rounded-lg border border-[#383F45] hover:border-red-500/50 hover:bg-red-500/10 text-xs font-semibold text-[#ABABAD] hover:text-red-400 transition-colors"
                      >
                        Leave
                      </button>
                    ) : (
                      <button
                        onClick={() => joinChannel(channel.id)}
                        className="px-4 py-1.5 rounded-lg bg-[#1264A3] hover:bg-[#1164A3] text-xs font-semibold text-white transition-colors shadow"
                      >
                        Join
                      </button>
                    )}
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

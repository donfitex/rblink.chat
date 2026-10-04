import React, { useState } from 'react';
import {
  Hash,
  Lock,
  Plus,
  ChevronDown,
  ChevronRight,
  Star,
  MessageSquare,
  Bookmark,
  Folder,
  Settings,
  Smile,
  Compass,
  BellOff
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const Sidebar: React.FC = () => {
  const {
    channels,
    directMessages,
    currentChannelId,
    currentDmId,
    selectChannel,
    selectDm,
    users,
    activeUser,
    setIsCreateChannelOpen,
    setIsBrowseChannelsOpen,
    setIsNewDmOpen,
    setIsSavedItemsOpen,
    setIsWorkspaceSettingsOpen,
    setStatusModalOpen,
    setViewingUserProfile,
    savedMessageIds
  } = useChat();

  const [channelsOpen, setChannelsOpen] = useState(true);
  const [dmsOpen, setDmsOpen] = useState(true);
  const [starredOpen, setStarredOpen] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  // Starred Channels & DMs
  const starredChannels = channels.filter((c) => c.isStarred);
  const starredDms = directMessages.filter((dm) => dm.isStarred);
  const hasStarred = starredChannels.length > 0 || starredDms.length > 0;

  // Filtered lists
  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const getDmRecipient = (dm: any) => {
    if (dm.isGroup) return null;
    const otherId = dm.participantIds.find((id: string) => id !== activeUser.id);
    return users.find((u) => u.id === otherId);
  };

  return (
    <aside className="w-64 h-full bg-[#19171D] border-r border-[#383F45] flex flex-col shrink-0 select-none text-[#D1D2D3]">
      {/* Search Filter inside Sidebar */}
      <div className="p-2.5 border-b border-[#383F45]/50">
        <input
          type="text"
          placeholder="Filter channels & DMs..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="w-full bg-[#222529] border border-[#383F45] rounded-md px-2.5 py-1 text-xs text-white placeholder-[#8D9197] focus:outline-none focus:border-[#1264A3]"
        />
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Starred Section */}
        {hasStarred && !searchFilter && (
          <div>
            <button
              onClick={() => setStarredOpen(!starredOpen)}
              className="w-full flex items-center justify-between px-2 py-1 text-xs font-bold text-[#8D9197] hover:text-white uppercase tracking-wider group"
            >
              <div className="flex items-center gap-1">
                {starredOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                <span>Starred</span>
              </div>
            </button>

            {starredOpen && (
              <div className="mt-1 space-y-0.5">
                {starredChannels.map((c) => (
                  <button
                    key={`star_${c.id}`}
                    onClick={() => selectChannel(c.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                      currentChannelId === c.id
                        ? 'bg-[#1164A3] text-white font-semibold'
                        : 'text-[#D1D2D3] hover:bg-[#27242C] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {c.isPrivate ? (
                        <Lock className="w-3.5 h-3.5 text-[#ABABAD]" />
                      ) : (
                        <Hash className="w-3.5 h-3.5 text-[#ABABAD]" />
                      )}
                      <span className="truncate">{c.name}</span>
                    </div>
                  </button>
                ))}

                {starredDms.map((dm) => {
                  const recipient = getDmRecipient(dm);
                  const title = dm.isGroup ? dm.name || 'Group Chat' : recipient?.name || 'Teammate';

                  return (
                    <button
                      key={`star_dm_${dm.id}`}
                      onClick={() => selectDm(dm.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                        currentDmId === dm.id
                          ? 'bg-[#1164A3] text-white font-semibold'
                          : 'text-[#D1D2D3] hover:bg-[#27242C] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {recipient ? (
                          <div className="relative shrink-0">
                            <img
                              src={recipient.avatar}
                              alt=""
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${
                                recipient.presence === 'online'
                                  ? 'bg-emerald-500'
                                  : recipient.presence === 'away'
                                  ? 'bg-amber-500'
                                  : 'bg-gray-500'
                              }`}
                            />
                          </div>
                        ) : (
                          <MessageSquare className="w-3.5 h-3.5 text-[#ABABAD]" />
                        )}
                        <span className="truncate">{title}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Channels Section */}
        <div>
          <div className="flex items-center justify-between px-2 py-1 text-xs font-bold text-[#8D9197] uppercase tracking-wider group">
            <button
              onClick={() => setChannelsOpen(!channelsOpen)}
              className="flex items-center gap-1 hover:text-white"
            >
              {channelsOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <span>Channels</span>
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsBrowseChannelsOpen(true)}
                className="p-1 rounded hover:bg-[#27242C] hover:text-white"
                title="Browse all channels"
              >
                <Compass className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsCreateChannelOpen(true)}
                className="p-1 rounded hover:bg-[#27242C] hover:text-white"
                title="Create a channel"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {channelsOpen && (
            <div className="mt-1 space-y-0.5">
              {filteredChannels.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectChannel(c.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                    currentChannelId === c.id
                      ? 'bg-[#1164A3] text-white font-semibold'
                      : 'text-[#D1D2D3] hover:bg-[#27242C] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {c.isPrivate ? (
                      <Lock className="w-3.5 h-3.5 text-[#ABABAD]" />
                    ) : (
                      <Hash className="w-3.5 h-3.5 text-[#ABABAD]" />
                    )}
                    <span className="truncate">{c.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {c.isMuted && <BellOff className="w-3 h-3 text-[#8D9197]" />}
                    {c.unreadCount && c.unreadCount > 0 ? (
                      <span className="px-1.5 py-0.2 rounded-full bg-[#E01E5A] text-[10px] font-bold text-white">
                        {c.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}

              <button
                onClick={() => setIsBrowseChannelsOpen(true)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-[#8D9197] hover:text-white hover:bg-[#27242C] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add channels</span>
              </button>
            </div>
          )}
        </div>

        {/* Direct Messages Section */}
        <div>
          <div className="flex items-center justify-between px-2 py-1 text-xs font-bold text-[#8D9197] uppercase tracking-wider group">
            <button
              onClick={() => setDmsOpen(!dmsOpen)}
              className="flex items-center gap-1 hover:text-white"
            >
              {dmsOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <span>Direct Messages</span>
            </button>
            <button
              onClick={() => setIsNewDmOpen(true)}
              className="p-1 rounded hover:bg-[#27242C] hover:text-white"
              title="Start a Direct Message"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {dmsOpen && (
            <div className="mt-1 space-y-0.5">
              {directMessages.map((dm) => {
                const recipient = getDmRecipient(dm);
                const title = dm.isGroup ? dm.name || 'Group Chat' : recipient?.name || 'Teammate';

                return (
                  <button
                    key={dm.id}
                    onClick={() => selectDm(dm.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                      currentDmId === dm.id
                        ? 'bg-[#1164A3] text-white font-semibold'
                        : 'text-[#D1D2D3] hover:bg-[#27242C] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {recipient ? (
                        <div className="relative shrink-0">
                          <img
                            src={recipient.avatar}
                            alt=""
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${
                              recipient.presence === 'online'
                                ? 'bg-emerald-500'
                                : recipient.presence === 'away'
                                ? 'bg-amber-500'
                                : recipient.presence === 'dnd'
                                ? 'bg-red-500'
                                : 'bg-gray-500'
                            }`}
                          />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded bg-[#1264A3] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                          #
                        </div>
                      )}
                      <span className="truncate">{title}</span>
                    </div>

                    {dm.unreadCount && dm.unreadCount > 0 ? (
                      <span className="px-1.5 py-0.2 rounded-full bg-[#E01E5A] text-[10px] font-bold text-white">
                        {dm.unreadCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}

              <button
                onClick={() => setIsNewDmOpen(true)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-[#8D9197] hover:text-white hover:bg-[#27242C] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New direct message</span>
              </button>
            </div>
          )}
        </div>

        {/* Saved Items Quick Link */}
        <div className="pt-2 border-t border-[#383F45]/50">
          <button
            onClick={() => setIsSavedItemsOpen(true)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-[#D1D2D3] hover:bg-[#27242C] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#1D9BD1]" />
              <span>Saved Items</span>
            </div>
            {savedMessageIds.length > 0 && (
              <span className="text-[11px] font-semibold text-[#8D9197]">
                {savedMessageIds.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* User Status Footer */}
      <div className="p-3 bg-[#121417] border-t border-[#383F45] flex items-center justify-between">
        <div
          onClick={() => setViewingUserProfile(activeUser)}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity truncate mr-2"
          title="View Profile"
        >
          <div className="relative shrink-0">
            <img
              src={activeUser.avatar}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#121417] ${
                activeUser.presence === 'online'
                  ? 'bg-emerald-500'
                  : activeUser.presence === 'away'
                  ? 'bg-amber-500'
                  : activeUser.presence === 'dnd'
                  ? 'bg-red-500'
                  : 'bg-gray-500'
              }`}
            />
          </div>
          <div className="truncate">
            <p className="font-bold text-xs text-white truncate">{activeUser.name}</p>
              <button onClick={() => window.dispatchEvent(new Event('rblink:logout'))} className="text-[10px] text-[#8D9197] hover:text-white underline">Log out</button>
            <p className="text-[11px] text-[#8D9197] truncate">
              {activeUser.customStatus
                ? `${activeUser.customStatus.emoji} ${activeUser.customStatus.text}`
                : `@${activeUser.username}`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setStatusModalOpen(true)}
          className="p-1.5 rounded-lg hover:bg-[#27242C] text-[#8D9197] hover:text-white transition-colors"
          title="Update Status"
        >
          <Smile className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

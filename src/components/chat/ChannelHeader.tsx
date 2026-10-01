import React, { useState } from 'react';
import {
  Hash,
  Lock,
  Pin,
  Folder,
  Bell,
  BellOff,
  Star,
  Users,
  Search,
  BookOpen,
  Info,
  Edit3,
  Check,
  X
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const ChannelHeader: React.FC = () => {
  const {
    currentChannel,
    currentDm,
    users,
    activeUser,
    pinnedMessages,
    toggleStarChannel,
    toggleMuteChannel,
    toggleStarDm,
    editChannel,
    setIsPinnedItemsOpen,
    setIsFilesGalleryOpen,
    setIsCanvasOpen,
    setIsSearchOpen,
    setViewingUserProfile,
  } = useChat();

  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [topicInput, setTopicInput] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  if (!currentChannel && !currentDm) return null;

  if (currentChannel) {
    const isOwnerOrAdmin = activeUser.role === 'owner' || activeUser.role === 'admin';
    const memberUsers = users.filter((u) => currentChannel.memberIds.includes(u.id));

    const handleSaveTopic = () => {
      editChannel(currentChannel.id, { topic: topicInput.trim() });
      setIsEditingTopic(false);
    };

    return (
      <div className="h-14 border-b border-[#383F45] bg-[#1A1D21] px-4 flex items-center justify-between shrink-0 select-none">
        {/* Left: Channel Name & Topic */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => toggleStarChannel(currentChannel.id)}
            className="text-[#8D9197] hover:text-amber-400 transition-colors p-1"
            title={currentChannel.isStarred ? 'Remove from favorites' : 'Star channel'}
          >
            <Star
              className={`w-4 h-4 ${
                currentChannel.isStarred ? 'fill-amber-400 text-amber-400' : ''
              }`}
            />
          </button>

          <div className="flex items-center gap-1.5 min-w-0">
            {currentChannel.isPrivate ? (
              <Lock className="w-4 h-4 text-[#ABABAD] shrink-0" />
            ) : (
              <Hash className="w-4 h-4 text-[#ABABAD] shrink-0" />
            )}
            <h2 className="font-bold text-white text-base truncate">
              {currentChannel.name}
            </h2>
          </div>

          <div className="hidden md:block h-4 w-[1px] bg-[#383F45] mx-1" />

          {/* Topic Display / Inline Edit */}
          {isEditingTopic ? (
            <div className="hidden md:flex items-center gap-1">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                className="bg-[#222529] border border-[#1264A3] rounded px-2 py-0.5 text-xs text-white focus:outline-none w-64"
                autoFocus
                placeholder="Set channel topic..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTopic();
                  if (e.key === 'Escape') setIsEditingTopic(false);
                }}
              />
              <button
                onClick={handleSaveTopic}
                className="p-1 text-emerald-400 hover:bg-[#2D3136] rounded"
                title="Save"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsEditingTopic(false)}
                className="p-1 text-[#8D9197] hover:bg-[#2D3136] rounded"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setTopicInput(currentChannel.topic || '');
                setIsEditingTopic(true);
              }}
              className="hidden md:flex items-center gap-1 text-xs text-[#8D9197] hover:text-[#D1D2D3] truncate max-w-sm group text-left"
              title="Click to edit topic"
            >
              <span className="truncate">{currentChannel.topic || 'Add a topic'}</span>
              <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          )}
        </div>

        {/* Right: Quick Channel Actions */}
        <div className="flex items-center gap-1">
          {/* Channel Canvas / Notes */}
          <button
            onClick={() => setIsCanvasOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#2D3136] text-[#ABABAD] hover:text-white text-xs font-medium transition-colors"
            title="Channel Canvas & Shared Notes"
          >
            <BookOpen className="w-4 h-4 text-[#1D9BD1]" />
            <span className="hidden sm:inline">Canvas</span>
          </button>

          {/* Pinned Messages */}
          <button
            onClick={() => setIsPinnedItemsOpen(true)}
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#2D3136] text-[#ABABAD] hover:text-white text-xs font-medium transition-colors"
            title="View Pinned Items"
          >
            <Pin className="w-4 h-4" />
            <span className="hidden sm:inline">Pinned</span>
            {pinnedMessages.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#1264A3] text-[10px] font-bold text-white">
                {pinnedMessages.length}
              </span>
            )}
          </button>

          {/* Channel Files */}
          <button
            onClick={() => setIsFilesGalleryOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#2D3136] text-[#ABABAD] hover:text-white text-xs font-medium transition-colors"
            title="Channel Files Gallery"
          >
            <Folder className="w-4 h-4" />
            <span className="hidden sm:inline">Files</span>
          </button>

          {/* Members count / drawer trigger */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-[#2D3136] text-[#ABABAD] hover:text-white text-xs font-medium transition-colors"
            title="View Members"
          >
            <Users className="w-4 h-4" />
            <span>{currentChannel.memberIds.length}</span>
          </button>

          {/* Search inside channel */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-1.5 rounded-md hover:bg-[#2D3136] text-[#ABABAD] hover:text-white transition-colors"
            title="Search in Channel (Ctrl+K)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notification Mute / Unmute */}
          <button
            onClick={() => toggleMuteChannel(currentChannel.id)}
            className="p-1.5 rounded-md hover:bg-[#2D3136] text-[#ABABAD] hover:text-white transition-colors"
            title={currentChannel.isMuted ? 'Unmute Channel' : 'Mute Channel'}
          >
            {currentChannel.isMuted ? (
              <BellOff className="w-4 h-4 text-amber-400" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Member dropdown / Popover */}
        {showDetails && (
          <div
            className="absolute top-14 right-4 z-40 w-72 rounded-xl bg-[#222529] border border-[#383F45] shadow-2xl p-4 text-[#D1D2D3] animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#383F45]">
              <div>
                <h4 className="font-semibold text-white text-sm">Channel Members</h4>
                <p className="text-xs text-[#8D9197]">{memberUsers.length} people</p>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="p-1 rounded hover:bg-[#2D3136] text-[#ABABAD]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto mt-2 space-y-1.5">
              {memberUsers.map((member) => (
                <div
                  key={member.id}
                  onClick={() => {
                    setViewingUserProfile(member);
                    setShowDetails(false);
                  }}
                  className="flex items-center gap-2.5 p-1.5 rounded-md hover:bg-[#2D3136] cursor-pointer transition-colors"
                >
                  <div className="relative">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#222529] ${
                        member.presence === 'online'
                          ? 'bg-emerald-500'
                          : member.presence === 'away'
                          ? 'bg-amber-500'
                          : member.presence === 'dnd'
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                      }`}
                    />
                  </div>
                  <div className="truncate flex-1">
                    <p className="text-xs font-medium text-white truncate">{member.name}</p>
                    <p className="text-[11px] text-[#8D9197] truncate">@{member.username}</p>
                  </div>
                  {member.role !== 'member' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1A1D21] text-[#ABABAD] capitalize">
                      {member.role}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // DM Header
  const otherParticipants = users.filter(
    (u) => currentDm.participantIds.includes(u.id) && u.id !== activeUser.id
  );
  const targetUser = otherParticipants[0];

  return (
    <div className="h-14 border-b border-[#383F45] bg-[#1A1D21] px-4 flex items-center justify-between shrink-0 select-none">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={() => toggleStarDm(currentDm.id)}
          className="text-[#8D9197] hover:text-amber-400 transition-colors p-1"
          title={currentDm.isStarred ? 'Remove from favorites' : 'Star conversation'}
        >
          <Star
            className={`w-4 h-4 ${
              currentDm.isStarred ? 'fill-amber-400 text-amber-400' : ''
            }`}
          />
        </button>

        {currentDm.isGroup ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#1264A3] flex items-center justify-center text-white text-xs font-bold shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h2 className="font-bold text-white text-sm truncate">
                {currentDm.name || otherParticipants.map((u) => u.name).join(', ')}
              </h2>
              <p className="text-[11px] text-[#8D9197] truncate">
                {currentDm.participantIds.length} members
              </p>
            </div>
          </div>
        ) : targetUser ? (
          <div
            onClick={() => setViewingUserProfile(targetUser)}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity"
          >
            <div className="relative">
              <img
                src={targetUser.avatar}
                alt={targetUser.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#1A1D21] ${
                  targetUser.presence === 'online'
                    ? 'bg-emerald-500'
                    : targetUser.presence === 'away'
                    ? 'bg-amber-500'
                    : targetUser.presence === 'dnd'
                    ? 'bg-red-500'
                    : 'bg-gray-500'
                }`}
              />
            </div>
            <div className="truncate">
              <h2 className="font-bold text-white text-sm truncate">{targetUser.name}</h2>
              <div className="flex items-center gap-1.5 text-[11px] text-[#8D9197]">
                <span className="capitalize">{targetUser.presence}</span>
                {targetUser.customStatus && (
                  <span>
                    • {targetUser.customStatus.emoji} {targetUser.customStatus.text}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-1.5 rounded-md hover:bg-[#2D3136] text-[#ABABAD] hover:text-white transition-colors"
          title="Search conversation"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

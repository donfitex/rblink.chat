import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  Channel,
  DirectMessage,
  Message,
  Workspace,
  Notification,
  NotificationSettings,
  ScheduledMessage,
  Attachment,
  Poll,
  Checklist,
  CustomStatus,
  UserPresence,
  UserRole,
  LinkPreview
} from '../types';
import {
  initialWorkspace,
  initialUsers,
  initialChannels,
  initialDirectMessages,
  initialMessages,
  initialNotifications,
  initialScheduledMessages
} from '../data/initialData';
import { extractUrls } from '../utils/formatters';

interface ToastState {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface ChatContextType {
  // Current user & Users
  activeUser: User;
  users: User[];
  switchActiveUser: (userId: string) => void;
  updateProfile: (updates: Partial<User>) => void;
  setUserStatus: (presence: UserPresence, customStatus?: CustomStatus) => void;
  clearUserStatus: () => void;

  // Workspace
  workspace: Workspace;
  updateWorkspace: (updates: Partial<Workspace>) => void;
  inviteMember: (email: string, role: UserRole) => void;
  cancelInvite: (inviteId: string) => void;
  removeMember: (userId: string) => void;
  updateMemberRole: (userId: string, role: UserRole) => void;

  // Channels
  channels: Channel[];
  currentChannelId: string | null;
  currentChannel: Channel | undefined;
  selectChannel: (channelId: string) => void;
  createChannel: (name: string, description: string, topic: string, isPrivate: boolean, category?: Channel['category']) => boolean;
  editChannel: (channelId: string, updates: Partial<Channel>) => void;
  archiveChannel: (channelId: string) => void;
  unarchiveChannel: (channelId: string) => void;
  joinChannel: (channelId: string) => void;
  leaveChannel: (channelId: string) => void;
  toggleStarChannel: (channelId: string) => void;
  toggleMuteChannel: (channelId: string) => void;
  updateChannelCanvas: (channelId: string, canvas: string) => void;

  // Direct Messages
  directMessages: DirectMessage[];
  currentDmId: string | null;
  currentDm: DirectMessage | undefined;
  selectDm: (dmId: string) => void;
  createDirectMessage: (participantIds: string[], name?: string) => string;
  renameGroupDm: (dmId: string, name: string) => void;
  leaveGroupDm: (dmId: string) => void;
  toggleStarDm: (dmId: string) => void;

  // Messages
  currentMessages: Message[];
  sendMessage: (
    content: string,
    attachments?: Attachment[],
    poll?: Poll,
    checklist?: Checklist,
    isAnnouncement?: boolean
  ) => void;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;

  // Threads
  activeThread: Message | null;
  threadReplies: Message[];
  openThread: (message: Message) => void;
  closeThread: () => void;
  sendThreadReply: (content: string, attachments?: Attachment[]) => void;

  // Pinned & Saved
  pinnedMessages: Message[];
  togglePinMessage: (messageId: string) => void;
  savedMessageIds: string[];
  toggleSaveMessage: (messageId: string) => void;

  // Notifications
  notifications: Notification[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;

  // Polls & Checklists
  votePoll: (pollId: string, optionId: string) => void;
  toggleChecklistItem: (checklistId: string, itemId: string) => void;

  // Scheduled Messages
  scheduledMessages: ScheduledMessage[];
  scheduleMessage: (content: string, scheduledFor: string, channelId?: string, dmId?: string) => void;
  cancelScheduledMessage: (id: string) => void;

  // Safety & Moderation
  blockedUserIds: string[];
  toggleBlockUser: (userId: string) => void;
  reportMessage: (messageId: string, reason: string) => void;

  // Jump to message
  jumpToMessage: (targetId: string, messageId: string, isDm?: boolean) => void;
  highlightedMessageId: string | null;

  // UI state & Modals
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  isCreateChannelOpen: boolean;
  setIsCreateChannelOpen: (open: boolean) => void;
  isBrowseChannelsOpen: boolean;
  setIsBrowseChannelsOpen: (open: boolean) => void;
  isNewDmOpen: boolean;
  setIsNewDmOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isShortcutsOpen: boolean;
  setIsShortcutsOpen: (open: boolean) => void;
  isWorkspaceSettingsOpen: boolean;
  setIsWorkspaceSettingsOpen: (open: boolean) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  isFilesGalleryOpen: boolean;
  setIsFilesGalleryOpen: (open: boolean) => void;
  isCanvasOpen: boolean;
  setIsCanvasOpen: (open: boolean) => void;
  isSavedItemsOpen: boolean;
  setIsSavedItemsOpen: (open: boolean) => void;
  isPinnedItemsOpen: boolean;
  setIsPinnedItemsOpen: (open: boolean) => void;
  viewingUserProfile: User | null;
  setViewingUserProfile: (user: User | null) => void;
  statusModalOpen: boolean;
  setStatusModalOpen: (open: boolean) => void;
  reportMessageTarget: Message | null;
  setReportMessageTarget: (msg: Message | null) => void;
  previewImage: Attachment | null;
  setPreviewImage: (att: Attachment | null) => void;
  previewPdf: Attachment | null;
  setPreviewPdf: (att: Attachment | null) => void;

  // Toast
  toasts: ToastState[];
  showToast: (message: string, type?: ToastState['type']) => void;
  dismissToast: (id: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial data from localStorage if available, or fall back to defaults
  const [workspace, setWorkspace] = useState<Workspace>(() => {
    const saved = localStorage.getItem('rblink_workspace');
    return saved ? JSON.parse(saved) : initialWorkspace;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('rblink_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [activeUserId, setActiveUserId] = useState<string>(() => {
    return localStorage.getItem('rblink_active_user') || '';
  });

  const activeUser = users.find((u) => u.id === activeUserId) || users[0];

  const [channels, setChannels] = useState<Channel[]>(() => {
    const saved = localStorage.getItem('rblink_channels');
    return saved ? JSON.parse(saved) : initialChannels;
  });

  const [directMessages, setDirectMessages] = useState<DirectMessage[]>(() => {
    const saved = localStorage.getItem('rblink_dms');
    return saved ? JSON.parse(saved) : initialDirectMessages;
  });

  const [currentChannelId, setCurrentChannelId] = useState<string | null>(() => {
    return localStorage.getItem('rblink_current_channel');
  });

  const [currentDmId, setCurrentDmId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    const saved = localStorage.getItem('rblink_messages');
    return saved ? JSON.parse(saved) : initialMessages;
  });

  const [activeThread, setActiveThread] = useState<Message | null>(null);

  const [savedMessageIds, setSavedMessageIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('rblink_saved_ids');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('rblink_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('rblink_notif_settings');
    return saved
      ? JSON.parse(saved)
      : {
          dmNotifications: true,
          mentionNotifications: true,
          threadNotifications: true,
          channelActivity: true,
          soundEnabled: true
        };
  });

  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>(() => {
    const saved = localStorage.getItem('rblink_scheduled');
    return saved ? JSON.parse(saved) : initialScheduledMessages;
  });

  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  // Modals & UI States
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('rblink_sidebar_collapsed') === 'true';
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isBrowseChannelsOpen, setIsBrowseChannelsOpen] = useState(false);
  const [isNewDmOpen, setIsNewDmOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isWorkspaceSettingsOpen, setIsWorkspaceSettingsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isFilesGalleryOpen, setIsFilesGalleryOpen] = useState(false);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [isSavedItemsOpen, setIsSavedItemsOpen] = useState(false);
  const [isPinnedItemsOpen, setIsPinnedItemsOpen] = useState(false);
  const [viewingUserProfile, setViewingUserProfile] = useState<User | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [reportMessageTarget, setReportMessageTarget] = useState<Message | null>(null);
  const [previewImage, setPreviewImage] = useState<Attachment | null>(null);
  const [previewPdf, setPreviewPdf] = useState<Attachment | null>(null);
  const [toasts, setToasts] = useState<ToastState[]>([]);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('rblink_workspace', JSON.stringify(workspace));
  }, [workspace]);

  useEffect(() => {
    localStorage.setItem('rblink_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('rblink_channels', JSON.stringify(channels));
  }, [channels]);

  useEffect(() => {
    localStorage.setItem('rblink_dms', JSON.stringify(directMessages));
  }, [directMessages]);

  useEffect(() => {
    localStorage.setItem('rblink_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('rblink_saved_ids', JSON.stringify(savedMessageIds));
  }, [savedMessageIds]);

  useEffect(() => {
    localStorage.setItem('rblink_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('rblink_notif_settings', JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  useEffect(() => {
    localStorage.setItem('rblink_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Connect WebSocket for real-time multi-tab / multi-client sync
  useEffect(() => {
    let ws: WebSocket;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleIncomingSocketEvent(data);
        } catch (e) {
          console.error('Socket message parse error:', e);
        }
      };

      ws.onerror = () => {
        // Fallback gracefully without server WS
      };
    } catch {
      // Offline / standalone mode
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const showToast = useCallback((message: string, type: ToastState['type'] = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Broadcast WebSocket event
  const dispatchSocketEvent = (type: string, payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  const handleIncomingSocketEvent = (event: { type: string; payload: any }) => {
    const { type, payload } = event;
    if (type === 'message:new') {
      const msg: Message = payload;
      const targetId = msg.channelId || msg.dmId;
      if (targetId) {
        setMessages((prev) => {
          const list = prev[targetId] || [];
          if (list.some((m) => m.id === msg.id)) return prev;
          return { ...prev, [targetId]: [...list, msg] };
        });
      }
    } else if (type === 'reaction:toggle') {
      const { messageId, emoji, userId } = payload;
      applyReactionToggle(messageId, emoji, userId);
    } else if (type === 'user:status') {
      const { userId, presence, customStatus } = payload;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, presence, customStatus } : u))
      );
    }
  };

  // Switch Active User
  const switchActiveUser = useCallback((userId: string) => {
    if (userId !== activeUserId) {
      showToast('Account switching is disabled. Log out to use another account.', 'info');
      return;
    }
    setActiveUserId(userId);
    localStorage.setItem('rblink_active_user', userId);
    const user = users.find((u) => u.id === userId);
    if (user) {
      showToast(`Switched active user to ${user.name} (@${user.username})`, 'info');
    }
  }, [users, showToast, activeUserId]);

  // Update Profile
  const updateProfile = useCallback((updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === activeUserId ? { ...u, ...updates } : u))
    );
    showToast('Profile updated successfully!', 'success');
  }, [activeUserId, showToast]);

  // Set User Status
  const setUserStatus = useCallback((presence: UserPresence, customStatus?: CustomStatus) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === activeUserId ? { ...u, presence, customStatus } : u))
    );
    dispatchSocketEvent('user:status', { userId: activeUserId, presence, customStatus });
    showToast('Status updated', 'success');
  }, [activeUserId, showToast]);

  const clearUserStatus = useCallback(() => {
    setUsers((prev) =>
      prev.map((u) => (u.id === activeUserId ? { ...u, customStatus: undefined } : u))
    );
    dispatchSocketEvent('user:status', { userId: activeUserId, presence: activeUser.presence, customStatus: undefined });
    showToast('Status cleared', 'info');
  }, [activeUserId, activeUser.presence, showToast]);

  // Select Channel
  const selectChannel = useCallback((channelId: string) => {
    setCurrentChannelId(channelId);
    setCurrentDmId(null);
    localStorage.setItem('rblink_current_channel', channelId);
    setMobileNavOpen(false);

    // Clear channel unread
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, unreadCount: 0 } : c))
    );
  }, []);

  // Select DM
  const selectDm = useCallback((dmId: string) => {
    setCurrentDmId(dmId);
    setCurrentChannelId(null);
    setMobileNavOpen(false);

    // Clear DM unread
    setDirectMessages((prev) =>
      prev.map((dm) => (dm.id === dmId ? { ...dm, unreadCount: 0 } : dm))
    );
  }, []);

  // Create Channel with name validation
  const createChannel = useCallback(
    (
      name: string,
      description: string,
      topic: string,
      isPrivate: boolean,
      category: Channel['category'] = 'general'
    ) => {
      // Validate channel name: lowercase, numbers, hyphens
      const sanitizedName = name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      if (!sanitizedName) {
        showToast('Channel name cannot be empty', 'error');
        return false;
      }

      if (channels.some((c) => c.name.toLowerCase() === sanitizedName.toLowerCase())) {
        showToast(`A channel named #${sanitizedName} already exists!`, 'error');
        return false;
      }

      const newChannel: Channel = {
        id: `c_${sanitizedName}_${Date.now()}`,
        name: sanitizedName,
        description: description.trim(),
        topic: topic.trim() || 'No topic set. Click to add a topic.',
        isPrivate,
        isArchived: false,
        category,
        memberIds: [activeUserId],
        createdBy: activeUserId,
        createdAt: new Date().toISOString(),
        canvas: `# Welcome to #${sanitizedName}\n\nCollaborative channel canvas. Edit this space to keep shared meeting notes and docs!`
      };

      setChannels((prev) => [...prev, newChannel]);
      // Welcome message in new channel
      setMessages((prev) => ({
        ...prev,
        [newChannel.id]: [
          {
            id: `m_init_${Date.now()}`,
            channelId: newChannel.id,
            senderId: activeUserId,
            content: `👋 Created channel **#${sanitizedName}**! ${description ? `\n*${description}*` : ''}`,
            timestamp: new Date().toISOString()
          }
        ]
      }));

      selectChannel(newChannel.id);
      showToast(`Channel #${sanitizedName} created!`, 'success');
      return true;
    },
    [channels, activeUserId, selectChannel, showToast]
  );

  const editChannel = useCallback((channelId: string, updates: Partial<Channel>) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, ...updates } : c))
    );
    showToast('Channel settings updated', 'success');
  }, [showToast]);

  const archiveChannel = useCallback((channelId: string) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, isArchived: true } : c))
    );
    showToast('Channel archived', 'info');
  }, [showToast]);

  const unarchiveChannel = useCallback((channelId: string) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, isArchived: false } : c))
    );
    showToast('Channel unarchived', 'success');
  }, [showToast]);

  const joinChannel = useCallback((channelId: string) => {
    setChannels((prev) =>
      prev.map((c) =>
        c.id === channelId && !c.memberIds.includes(activeUserId)
          ? { ...c, memberIds: [...c.memberIds, activeUserId] }
          : c
      )
    );
    showToast('Joined channel!', 'success');
  }, [activeUserId, showToast]);

  const leaveChannel = useCallback((channelId: string) => {
    setChannels((prev) =>
      prev.map((c) =>
        c.id === channelId
          ? { ...c, memberIds: c.memberIds.filter((id) => id !== activeUserId) }
          : c
      )
    );
    selectChannel('c_general');
    showToast('Left channel', 'info');
  }, [activeUserId, selectChannel, showToast]);

  const toggleStarChannel = useCallback((channelId: string) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, isStarred: !c.isStarred } : c))
    );
  }, []);

  const toggleMuteChannel = useCallback((channelId: string) => {
    setChannels((prev) =>
      prev.map((c) => {
        if (c.id === channelId) {
          const isMuted = !c.isMuted;
          showToast(isMuted ? `#${c.name} muted` : `#${c.name} unmuted`, 'info');
          return { ...c, isMuted };
        }
        return c;
      })
    );
  }, [showToast]);

  const updateChannelCanvas = useCallback((channelId: string, canvas: string) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, canvas } : c))
    );
    dispatchSocketEvent('canvas:update', { channelId, canvas });
  }, []);

  // Direct Messages
  const createDirectMessage = useCallback(
    (participantIds: string[], name?: string): string => {
      const allParticipants = Array.from(new Set([...participantIds, activeUserId]));
      const isGroup = allParticipants.length > 2;

      // Check if 1:1 DM already exists
      if (!isGroup) {
        const existing = directMessages.find(
          (dm) =>
            !dm.isGroup &&
            dm.participantIds.length === 2 &&
            dm.participantIds.includes(activeUserId) &&
            dm.participantIds.includes(participantIds[0])
        );
        if (existing) {
          selectDm(existing.id);
          return existing.id;
        }
      }

      const newDm: DirectMessage = {
        id: `dm_${Date.now()}`,
        name: name || undefined,
        isGroup,
        participantIds: allParticipants,
        createdBy: activeUserId,
        createdAt: new Date().toISOString(),
        unreadCount: 0
      };

      setDirectMessages((prev) => [newDm, ...prev]);
      setMessages((prev) => ({
        ...prev,
        [newDm.id]: [
          {
            id: `m_dm_init_${Date.now()}`,
            dmId: newDm.id,
            senderId: activeUserId,
            content: `👋 Started conversation with ${allParticipants
              .filter((id) => id !== activeUserId)
              .map((id) => users.find((u) => u.id === id)?.name || id)
              .join(', ')}`,
            timestamp: new Date().toISOString()
          }
        ]
      }));

      selectDm(newDm.id);
      showToast('Conversation started', 'success');
      return newDm.id;
    },
    [activeUserId, directMessages, users, selectDm, showToast]
  );

  const renameGroupDm = useCallback((dmId: string, name: string) => {
    setDirectMessages((prev) =>
      prev.map((dm) => (dm.id === dmId ? { ...dm, name } : dm))
    );
    showToast('Group conversation renamed', 'success');
  }, [showToast]);

  const leaveGroupDm = useCallback((dmId: string) => {
    setDirectMessages((prev) =>
      prev.map((dm) =>
        dm.id === dmId
          ? { ...dm, participantIds: dm.participantIds.filter((id) => id !== activeUserId) }
          : dm
      )
    );
    selectChannel('c_general');
    showToast('Left group conversation', 'info');
  }, [activeUserId, selectChannel, showToast]);

  const toggleStarDm = useCallback((dmId: string) => {
    setDirectMessages((prev) =>
      prev.map((dm) => (dm.id === dmId ? { ...dm, isStarred: !dm.isStarred } : dm))
    );
  }, []);

  // Send Message
  const sendMessage = useCallback(
    (
      content: string,
      attachments?: Attachment[],
      poll?: Poll,
      checklist?: Checklist,
      isAnnouncement?: boolean
    ) => {
      const targetId = currentChannelId || currentDmId;
      if (!targetId || (!content.trim() && !attachments?.length && !poll && !checklist)) return;

      // Extract URLs for rich preview cards
      const urls = extractUrls(content);
      const linkPreviews: LinkPreview[] = [];

      urls.forEach((url) => {
        if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
          const videoId = url.includes('v=')
            ? url.split('v=')[1]?.split('&')[0]
            : url.split('youtu.be/')[1]?.split('?')[0];
          linkPreviews.push({
            url,
            title: 'YouTube Video Link',
            description: 'Watch video in-line inside rblink.chat',
            siteName: 'YouTube',
            type: 'youtube',
            videoId,
            imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80'
          });
        } else if (url.includes('github.com')) {
          linkPreviews.push({
            url,
            title: 'GitHub Repository / Code Link',
            description: 'Inspect source code, releases, and commits.',
            siteName: 'GitHub',
            type: 'github',
            imageUrl: 'https://opengraph.githubassets.com/1/rblink-chat/repo'
          });
        }
      });

      // Parse mentions
      const mentionMatches = content.match(/@([a-zA-Z0-9_\.]+)/g) || [];
      const mentions: string[] = [];
      mentionMatches.forEach((m) => {
        const username = m.slice(1);
        if (username === 'channel' || username === 'everyone') {
          mentions.push(`@${username}`);
        } else {
          const matchedUser = users.find(
            (u) => u.username.toLowerCase() === username.toLowerCase()
          );
          if (matchedUser) mentions.push(matchedUser.id);
        }
      });

      const newMessage: Message = {
        id: `m_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        channelId: currentChannelId || undefined,
        dmId: currentDmId || undefined,
        senderId: activeUserId,
        content,
        timestamp: new Date().toISOString(),
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
        linkPreviews: linkPreviews.length > 0 ? linkPreviews : undefined,
        poll,
        checklist,
        isAnnouncement,
        mentions: mentions.length > 0 ? mentions : undefined,
        status: 'sent'
      };

      setMessages((prev) => {
        const list = prev[targetId] || [];
        return { ...prev, [targetId]: [...list, newMessage] };
      });

      // Update DM last message
      if (currentDmId) {
        setDirectMessages((prev) =>
          prev.map((dm) =>
            dm.id === currentDmId
              ? {
                  ...dm,
                  lastMessage: {
                    content: content || (attachments ? 'Sent an attachment' : 'Sent a message'),
                    timestamp: newMessage.timestamp,
                    senderId: activeUserId
                  }
                }
              : dm
          )
        );
      }

      // Dispatch WebSocket event
      dispatchSocketEvent('message:new', newMessage);

      // Create notifications for mentioned users
      mentions.forEach((mentionedId) => {
        if (mentionedId.startsWith('@')) {
          // Channel-wide notify
          const channel = channels.find((c) => c.id === currentChannelId);
          if (channel) {
            channel.memberIds
              .filter((id) => id !== activeUserId)
              .forEach((memberId) => {
                const notif: Notification = {
                  id: `notif_${Date.now()}_${memberId}`,
                  userId: memberId,
                  type: 'mention',
                  title: `${activeUser.name} mentioned @${mentionedId.slice(1)} in #${channel.name}`,
                  message: content.slice(0, 80),
                  channelId: currentChannelId || undefined,
                  messageId: newMessage.id,
                  actorId: activeUserId,
                  isRead: false,
                  createdAt: new Date().toISOString()
                };
                setNotifications((prev) => [notif, ...prev]);
              });
          }
        } else if (mentionedId !== activeUserId) {
          const notif: Notification = {
            id: `notif_${Date.now()}_${mentionedId}`,
            userId: mentionedId,
            type: 'mention',
            title: `${activeUser.name} mentioned you`,
            message: content.slice(0, 80),
            channelId: currentChannelId || undefined,
            dmId: currentDmId || undefined,
            messageId: newMessage.id,
            actorId: activeUserId,
            isRead: false,
            createdAt: new Date().toISOString()
          };
          setNotifications((prev) => [notif, ...prev]);
        }
      });
    },
    [currentChannelId, currentDmId, activeUserId, activeUser.name, users, channels]
  );

  // Edit Message
  const editMessage = useCallback(
    (messageId: string, newContent: string) => {
      const targetId = currentChannelId || currentDmId;
      if (!targetId) return;

      setMessages((prev) => {
        const list = prev[targetId] || [];
        return {
          ...prev,
          [targetId]: list.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  content: newContent,
                  isEdited: true,
                  updatedAt: new Date().toISOString()
                }
              : m
          )
        };
      });

      // Also check thread replies
      if (activeThread) {
        const threadKey = `thread_${activeThread.id}`;
        setMessages((prev) => {
          const replies = prev[threadKey] || [];
          return {
            ...prev,
            [threadKey]: replies.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    content: newContent,
                    isEdited: true,
                    updatedAt: new Date().toISOString()
                  }
                : m
            )
          };
        });
      }

      showToast('Message edited', 'info');
    },
    [currentChannelId, currentDmId, activeThread, showToast]
  );

  // Delete Message
  const deleteMessage = useCallback(
    (messageId: string) => {
      const targetId = currentChannelId || currentDmId;
      if (!targetId) return;

      setMessages((prev) => {
        const list = prev[targetId] || [];
        return {
          ...prev,
          [targetId]: list.filter((m) => m.id !== messageId)
        };
      });

      // Check if deleted inside active thread
      if (activeThread) {
        const threadKey = `thread_${activeThread.id}`;
        setMessages((prev) => {
          const replies = prev[threadKey] || [];
          return {
            ...prev,
            [threadKey]: replies.filter((m) => m.id !== messageId)
          };
        });
      }

      showToast('Message deleted', 'info');
    },
    [currentChannelId, currentDmId, activeThread, showToast]
  );

  // Toggle Reaction
  const applyReactionToggle = (messageId: string, emoji: string, userId: string) => {
    const updateMessageReactions = (m: Message): Message => {
      if (m.id !== messageId) return m;

      const currentReactions = m.reactions ? [...m.reactions] : [];
      const existingReactionIndex = currentReactions.findIndex((r) => r.emoji === emoji);

      if (existingReactionIndex > -1) {
        const existing = currentReactions[existingReactionIndex];
        const userIndex = existing.users.indexOf(userId);

        if (userIndex > -1) {
          // Remove reaction
          const updatedUsers = existing.users.filter((id) => id !== userId);
          if (updatedUsers.length === 0) {
            currentReactions.splice(existingReactionIndex, 1);
          } else {
            currentReactions[existingReactionIndex] = {
              ...existing,
              count: updatedUsers.length,
              users: updatedUsers
            };
          }
        } else {
          // Add user to reaction
          currentReactions[existingReactionIndex] = {
            ...existing,
            count: existing.users.length + 1,
            users: [...existing.users, userId]
          };
        }
      } else {
        // Create new reaction
        currentReactions.push({
          emoji,
          count: 1,
          users: [userId]
        });
      }

      return { ...m, reactions: currentReactions };
    };

    setMessages((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        next[key] = next[key].map(updateMessageReactions);
      });
      return next;
    });

    if (activeThread && activeThread.id === messageId) {
      setActiveThread((prev) => (prev ? updateMessageReactions(prev) : null));
    }
  };

  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      applyReactionToggle(messageId, emoji, activeUserId);
      dispatchSocketEvent('reaction:toggle', { messageId, emoji, userId: activeUserId });
    },
    [activeUserId]
  );

  // Threads
  const openThread = useCallback((message: Message) => {
    setActiveThread(message);
  }, []);

  const closeThread = useCallback(() => {
    setActiveThread(null);
  }, []);

  const sendThreadReply = useCallback(
    (content: string, attachments?: Attachment[]) => {
      if (!activeThread) return;

      const reply: Message = {
        id: `tr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        threadParentId: activeThread.id,
        channelId: activeThread.channelId,
        dmId: activeThread.dmId,
        senderId: activeUserId,
        content,
        timestamp: new Date().toISOString(),
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
        status: 'sent'
      };

      const threadKey = `thread_${activeThread.id}`;

      setMessages((prev) => {
        const threadList = prev[threadKey] || [];
        return { ...prev, [threadKey]: [...threadList, reply] };
      });

      // Update parent message's reply count & latest reply info
      const updateParent = (m: Message): Message => {
        if (m.id !== activeThread.id) return m;
        const currentCount = m.replyCount || 0;
        const currentRepliers = m.replyUserIds || [];
        return {
          ...m,
          replyCount: currentCount + 1,
          latestReplyAt: reply.timestamp,
          replyUserIds: Array.from(new Set([...currentRepliers, activeUserId]))
        };
      };

      const targetId = activeThread.channelId || activeThread.dmId;
      if (targetId) {
        setMessages((prev) => {
          const list = prev[targetId] || [];
          return { ...prev, [targetId]: list.map(updateParent) };
        });
      }

      setActiveThread((prev) => (prev ? updateParent(prev) : null));

      // Notify parent message author if not self
      if (activeThread.senderId !== activeUserId) {
        const notif: Notification = {
          id: `notif_${Date.now()}_reply`,
          userId: activeThread.senderId,
          type: 'thread_reply',
          title: `${activeUser.name} replied to your thread`,
          message: content.slice(0, 80),
          channelId: activeThread.channelId,
          dmId: activeThread.dmId,
          messageId: reply.id,
          threadParentId: activeThread.id,
          actorId: activeUserId,
          isRead: false,
          createdAt: new Date().toISOString()
        };
        setNotifications((prev) => [notif, ...prev]);
      }
    },
    [activeThread, activeUserId, activeUser.name]
  );

  // Pin & Unpin
  const togglePinMessage = useCallback(
    (messageId: string) => {
      const targetId = currentChannelId || currentDmId;
      if (!targetId) return;

      setMessages((prev) => {
        const list = prev[targetId] || [];
        return {
          ...prev,
          [targetId]: list.map((m) => {
            if (m.id === messageId) {
              const isPinned = !m.isPinned;
              showToast(isPinned ? 'Message pinned to channel' : 'Message unpinned', 'info');
              return {
                ...m,
                isPinned,
                pinnedBy: isPinned ? activeUserId : undefined,
                pinnedAt: isPinned ? new Date().toISOString() : undefined
              };
            }
            return m;
          })
        };
      });
    },
    [currentChannelId, currentDmId, activeUserId, showToast]
  );

  // Saved Items (Bookmarks)
  const toggleSaveMessage = useCallback(
    (messageId: string) => {
      setSavedMessageIds((prev) => {
        const isSaved = prev.includes(messageId);
        showToast(isSaved ? 'Removed from saved items' : 'Message saved to bookmarks', 'info');
        return isSaved ? prev.filter((id) => id !== messageId) : [...prev, messageId];
      });
    },
    [showToast]
  );

  // Notifications
  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('All notifications marked as read', 'success');
  }, [showToast]);

  const updateNotificationSettings = useCallback((settings: Partial<NotificationSettings>) => {
    setNotificationSettings((prev) => ({ ...prev, ...settings }));
    showToast('Notification preferences updated', 'success');
  }, [showToast]);

  // Poll Voting
  const votePoll = useCallback(
    (pollId: string, optionId: string) => {
      const updatePollInMessage = (m: Message): Message => {
        if (!m.poll || m.poll.id !== pollId) return m;

        const poll = m.poll;
        const newOptions = poll.options.map((opt) => {
          if (opt.id === optionId) {
            const hasVoted = opt.votes.includes(activeUserId);
            return {
              ...opt,
              votes: hasVoted
                ? opt.votes.filter((id) => id !== activeUserId)
                : [...opt.votes, activeUserId]
            };
          }
          if (!poll.allowMultiple) {
            return {
              ...opt,
              votes: opt.votes.filter((id) => id !== activeUserId)
            };
          }
          return opt;
        });

        return { ...m, poll: { ...poll, options: newOptions } };
      };

      setMessages((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          next[k] = next[k].map(updatePollInMessage);
        });
        return next;
      });

      showToast('Vote recorded', 'info');
    },
    [activeUserId, showToast]
  );

  // Checklist Item Toggle
  const toggleChecklistItem = useCallback(
    (checklistId: string, itemId: string) => {
      const updateChecklistInMessage = (m: Message): Message => {
        if (!m.checklist || m.checklist.id !== checklistId) return m;

        const checklist = m.checklist;
        const newItems = checklist.items.map((item) => {
          if (item.id === itemId) {
            const completed = !item.completed;
            return {
              ...item,
              completed,
              completedBy: completed ? activeUserId : undefined,
              completedAt: completed ? new Date().toISOString() : undefined
            };
          }
          return item;
        });

        return { ...m, checklist: { ...checklist, items: newItems } };
      };

      setMessages((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          next[k] = next[k].map(updateChecklistInMessage);
        });
        return next;
      });
    },
    [activeUserId]
  );

  // Scheduled Messages
  const scheduleMessage = useCallback(
    (content: string, scheduledFor: string, channelId?: string, dmId?: string) => {
      const newSched: ScheduledMessage = {
        id: `sched_${Date.now()}`,
        channelId: channelId || currentChannelId || undefined,
        dmId: dmId || currentDmId || undefined,
        content,
        scheduledFor,
        createdBy: activeUserId
      };
      setScheduledMessages((prev) => [...prev, newSched]);
      showToast(`Message scheduled for ${new Date(scheduledFor).toLocaleTimeString()}`, 'success');
    },
    [currentChannelId, currentDmId, activeUserId, showToast]
  );

  const cancelScheduledMessage = useCallback((id: string) => {
    setScheduledMessages((prev) => prev.filter((s) => s.id !== id));
    showToast('Scheduled message canceled', 'info');
  }, [showToast]);

  // Moderation: Block User & Report Message
  const toggleBlockUser = useCallback((userId: string) => {
    setBlockedUserIds((prev) => {
      const isBlocked = prev.includes(userId);
      const user = users.find((u) => u.id === userId);
      const name = user ? user.name : 'User';
      showToast(isBlocked ? `Unblocked ${name}` : `Blocked ${name}`, 'info');
      return isBlocked ? prev.filter((id) => id !== userId) : [...prev, userId];
    });
  }, [users, showToast]);

  const reportMessage = useCallback((messageId: string, reason: string) => {
    showToast(`Message reported for "${reason}". Our team will review it.`, 'success');
    setReportMessageTarget(null);
  }, [showToast]);

  // Jump to message (search result or notification click)
  const jumpToMessage = useCallback(
    (targetId: string, messageId: string, isDm = false) => {
      if (isDm) {
        selectDm(targetId);
      } else {
        selectChannel(targetId);
      }

      setHighlightedMessageId(messageId);

      setTimeout(() => {
        const el = document.getElementById(`msg-${messageId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 3000);
    },
    [selectChannel, selectDm]
  );

  // Workspace settings helpers
  const updateWorkspace = useCallback((updates: Partial<Workspace>) => {
    setWorkspace((prev) => ({ ...prev, ...updates }));
    showToast('Workspace settings updated', 'success');
  }, [showToast]);

  const inviteMember = useCallback((email: string, role: UserRole) => {
    const newInvite = {
      id: `inv_${Date.now()}`,
      email,
      role,
      invitedBy: activeUserId,
      invitedAt: new Date().toISOString()
    };
    setWorkspace((prev) => ({
      ...prev,
      pendingInvites: [...prev.pendingInvites, newInvite]
    }));
    showToast(`Invitation sent to ${email}`, 'success');
  }, [activeUserId, showToast]);

  const cancelInvite = useCallback((inviteId: string) => {
    setWorkspace((prev) => ({
      ...prev,
      pendingInvites: prev.pendingInvites.filter((i) => i.id !== inviteId)
    }));
    showToast('Invitation cancelled', 'info');
  }, [showToast]);

  const removeMember = useCallback((userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    showToast('Member removed from workspace', 'info');
  }, [showToast]);

  const updateMemberRole = useCallback((userId: string, role: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role } : u))
    );
    showToast('Member role updated', 'success');
  }, [showToast]);

  // Computed lists
  const currentChannel = channels.find((c) => c.id === currentChannelId);
  const currentDm = directMessages.find((dm) => dm.id === currentDmId);

  const activeTargetId = currentChannelId || currentDmId || '';
  const currentMessages = (messages[activeTargetId] || []).filter(
    (m) => !blockedUserIds.includes(m.senderId)
  );

  const threadReplies = activeThread
    ? (messages[`thread_${activeThread.id}`] || []).filter(
        (m) => !blockedUserIds.includes(m.senderId)
      )
    : [];

  const pinnedMessages = currentMessages.filter((m) => m.isPinned);

  return (
    <ChatContext.Provider
      value={{
        activeUser,
        users,
        switchActiveUser,
        updateProfile,
        setUserStatus,
        clearUserStatus,
        workspace,
        updateWorkspace,
        inviteMember,
        cancelInvite,
        removeMember,
        updateMemberRole,
        channels,
        currentChannelId,
        currentChannel,
        selectChannel,
        createChannel,
        editChannel,
        archiveChannel,
        unarchiveChannel,
        joinChannel,
        leaveChannel,
        toggleStarChannel,
        toggleMuteChannel,
        updateChannelCanvas,
        directMessages,
        currentDmId,
        currentDm,
        selectDm,
        createDirectMessage,
        renameGroupDm,
        leaveGroupDm,
        toggleStarDm,
        currentMessages,
        sendMessage,
        editMessage,
        deleteMessage,
        toggleReaction,
        activeThread,
        threadReplies,
        openThread,
        closeThread,
        sendThreadReply,
        pinnedMessages,
        togglePinMessage,
        savedMessageIds,
        toggleSaveMessage,
        notifications,
        unreadNotificationCount,
        markNotificationRead,
        markAllNotificationsRead,
        notificationSettings,
        updateNotificationSettings,
        votePoll,
        toggleChecklistItem,
        scheduledMessages,
        scheduleMessage,
        cancelScheduledMessage,
        blockedUserIds,
        toggleBlockUser,
        reportMessage,
        jumpToMessage,
        highlightedMessageId,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileNavOpen,
        setMobileNavOpen,
        isCreateChannelOpen,
        setIsCreateChannelOpen,
        isBrowseChannelsOpen,
        setIsBrowseChannelsOpen,
        isNewDmOpen,
        setIsNewDmOpen,
        isSearchOpen,
        setIsSearchOpen,
        isShortcutsOpen,
        setIsShortcutsOpen,
        isWorkspaceSettingsOpen,
        setIsWorkspaceSettingsOpen,
        isOnboardingOpen,
        setIsOnboardingOpen,
        isFilesGalleryOpen,
        setIsFilesGalleryOpen,
        isCanvasOpen,
        setIsCanvasOpen,
        isSavedItemsOpen,
        setIsSavedItemsOpen,
        isPinnedItemsOpen,
        setIsPinnedItemsOpen,
        viewingUserProfile,
        setViewingUserProfile,
        statusModalOpen,
        setStatusModalOpen,
        reportMessageTarget,
        setReportMessageTarget,
        previewImage,
        setPreviewImage,
        previewPdf,
        setPreviewPdf,
        toasts,
        showToast,
        dismissToast
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

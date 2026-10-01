export type UserRole = 'owner' | 'admin' | 'member' | 'guest';

export type UserPresence = 'online' | 'away' | 'dnd' | 'offline';

export interface CustomStatus {
  emoji: string;
  text: string;
  expiresAt?: string; // ISO string
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  role: UserRole;
  presence: UserPresence;
  customStatus?: CustomStatus;
  bio?: string;
  department?: string;
  joinedAt: string;
  lastActive: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[]; // array of user IDs
}

export interface Attachment {
  id: string;
  name: string;
  size: number; // bytes
  type: string; // mime type
  url: string;
  previewUrl?: string;
  uploadedAt: string;
}

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  siteName?: string;
  favicon?: string;
  imageUrl?: string;
  type?: 'youtube' | 'github' | 'article' | 'image';
  videoId?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // user IDs
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  isAnonymous: boolean;
  createdBy: string;
  createdAt: string;
  isClosed?: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
  createdBy: string;
  createdAt: string;
}

export interface Message {
  id: string;
  channelId?: string;
  dmId?: string;
  senderId: string;
  content: string;
  timestamp: string; // ISO
  updatedAt?: string;
  isEdited?: boolean;
  isPinned?: boolean;
  pinnedBy?: string;
  pinnedAt?: string;
  attachments?: Attachment[];
  linkPreviews?: LinkPreview[];
  reactions?: Reaction[];
  replyCount?: number;
  latestReplyAt?: string;
  replyUserIds?: string[];
  threadParentId?: string; // set if this message is inside a thread
  poll?: Poll;
  checklist?: Checklist;
  isAnnouncement?: boolean;
  mentions?: string[]; // user IDs or '@channel' | '@everyone'
  status?: 'sending' | 'sent' | 'failed';
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  topic: string;
  isPrivate: boolean;
  isArchived: boolean;
  category: 'general' | 'engineering' | 'product' | 'random' | 'announcements';
  memberIds: string[];
  createdBy: string;
  createdAt: string;
  unreadCount?: number;
  isMuted?: boolean;
  isStarred?: boolean;
  canvas?: string; // markdown notes
}

export interface DirectMessage {
  id: string;
  name?: string; // custom name for group DMs
  isGroup: boolean;
  participantIds: string[];
  createdBy: string;
  createdAt: string;
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount?: number;
  isMuted?: boolean;
  isStarred?: boolean;
}

export type NotificationType =
  | 'mention'
  | 'dm'
  | 'thread_reply'
  | 'reaction'
  | 'channel_activity'
  | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  channelId?: string;
  dmId?: string;
  messageId?: string;
  threadParentId?: string;
  actorId: string;
  isRead: boolean;
  createdAt: string;
}

export interface WorkspaceInvite {
  id: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  invitedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
  ownerId: string;
  createdAt: string;
  pendingInvites: WorkspaceInvite[];
}

export interface ScheduledMessage {
  id: string;
  channelId?: string;
  dmId?: string;
  content: string;
  scheduledFor: string;
  attachments?: Attachment[];
  createdBy: string;
}

export interface NotificationSettings {
  dmNotifications: boolean;
  mentionNotifications: boolean;
  threadNotifications: boolean;
  channelActivity: boolean;
  soundEnabled: boolean;
}

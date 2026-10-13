import { User, Channel, DirectMessage, Message, Workspace, Notification, ScheduledMessage } from '../types';

// Clean production start: no demo people, groups or messages.
export const initialWorkspace: Workspace = {
  id: 'ws_rblink_main',
  name: 'rblink.chat',
  logoUrl: '',
  description: 'Chat, meet, post and work together',
  ownerId: '',
  createdAt: new Date().toISOString(),
  pendingInvites: []
};

export const initialUsers: User[] = [];

export const initialChannels: Channel[] = [
  {
    id: 'c_general',
    name: 'general',
    description: 'Welcome! Say hello and share what you are working on.',
    topic: 'Company-wide conversation',
    isPrivate: false,
    isArchived: false,
    category: 'general',
    memberIds: [],
    createdBy: '',
    createdAt: new Date().toISOString(),
    canvas: '# Welcome to rblink.chat\n\nUse this canvas for shared notes, guidelines and links.'
  }
];

export const initialDirectMessages: DirectMessage[] = [];
export const initialMessages: Record<string, Message[]> = { c_general: [] };
export const initialNotifications: Notification[] = [];
export const initialScheduledMessages: ScheduledMessage[] = [];

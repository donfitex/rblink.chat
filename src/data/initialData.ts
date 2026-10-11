import type { Channel, DirectMessage, Message, Notification, ScheduledMessage, User, Workspace } from '../types';

// New workspaces start empty. Members and channels are created from real
// accounts after sign-in; no development personas or sample conversations.
export const initialWorkspace: Workspace = {
  id: 'ws_rblink_main',
  name: 'rblink.chat',
  logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
  description: 'A place for your team to collaborate.',
  ownerId: '',
  createdAt: new Date().toISOString(),
  pendingInvites: []
};

export const initialUsers: User[] = [];
export const initialChannels: Channel[] = [];
export const initialDirectMessages: DirectMessage[] = [];
export const initialMessages: Record<string, Message[]> = {};
export const initialNotifications: Notification[] = [];
export const initialScheduledMessages: ScheduledMessage[] = [];
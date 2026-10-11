import type {
  Channel,
  DirectMessage,
  Message,
  Notification,
  ScheduledMessage,
  User,
  Workspace
} from '../types';

export const initialWorkspace: Workspace = {
  id: 'ws_rblink_main',
  name: 'rblink.chat',
  logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
  description: 'Next-Generation Team Collaboration Platform for High-Velocity Teams',
  ownerId: 'u1',
  createdAt: '2026-01-15T09:00:00.000Z',
  pendingInvites: []
};

export const initialUsers: User[] = [
  {
    id: 'u1',
    name: 'Sarah Chen',
    username: 'sarah.chen',
    email: 'sarah@rblink.chat',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    presence: 'online',
    customStatus: {
      emoji: '🚀',
      text: 'Shipping rblink.chat v1.0',
      expiresAt: '2026-10-02T18:00:00.000Z'
    },
    bio: 'Product Lead @ rblink.chat. Passionate about real-time distributed systems and delightful UX.',
    department: 'Product & Strategy',
    joinedAt: '2026-01-15T09:00:00.000Z',
    lastActive: 'Just now'
  },
  {
    id: 'u2',
    name: 'Alex Rivera',
    username: 'alex.rivera',
    email: 'alex@rblink.chat',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    presence: 'online',
    bio: 'Frontend engineer focused on collaboration workflows and design systems.',
    department: 'Engineering',
    joinedAt: '2026-02-01T09:00:00.000Z',
    lastActive: '2m ago'
  },
  {
    id: 'u3',
    name: 'Priya Nair',
    username: 'priya.nair',
    email: 'priya@rblink.chat',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    presence: 'away',
    bio: 'Platform engineer keeping infrastructure reliable and secure.',
    department: 'Infrastructure',
    joinedAt: '2026-02-12T09:00:00.000Z',
    lastActive: '12m ago'
  }
];

export const initialChannels: Channel[] = [
  {
    id: 'c_general',
    name: 'general',
    description: 'Everything the team needs to know in one place.',
    topic: 'Company-wide updates and announcements',
    isPrivate: false,
    isArchived: false,
    category: 'general',
    memberIds: ['u1', 'u2', 'u3'],
    createdBy: 'u1',
    createdAt: '2026-01-15T09:00:00.000Z',
    isStarred: true
  },
  {
    id: 'c_engineering',
    name: 'engineering',
    description: 'Build, ship, and improve the platform together.',
    topic: 'Product engineering and delivery',
    isPrivate: false,
    isArchived: false,
    category: 'engineering',
    memberIds: ['u1', 'u2', 'u3'],
    createdBy: 'u2',
    createdAt: '2026-01-16T09:00:00.000Z'
  },
  {
    id: 'c_announcements',
    name: 'announcements',
    description: 'Critical updates and launches across the workspace.',
    topic: 'Important company announcements',
    isPrivate: false,
    isArchived: false,
    category: 'announcements',
    memberIds: ['u1', 'u2', 'u3'],
    createdBy: 'u1',
    createdAt: '2026-01-15T09:00:00.000Z'
  }
];

export const initialDirectMessages: DirectMessage[] = [
  {
    id: 'dm_u1_u2',
    isGroup: false,
    participantIds: ['u1', 'u2'],
    createdBy: 'u1',
    createdAt: '2026-01-17T10:00:00.000Z',
    lastMessage: {
      content: 'Can you review the new onboarding flow before standup?',
      timestamp: '2026-10-10T09:30:00.000Z',
      senderId: 'u2'
    },
    unreadCount: 1
  },
  {
    id: 'dm_core_team',
    name: 'Core Team',
    isGroup: true,
    participantIds: ['u1', 'u2', 'u3'],
    createdBy: 'u1',
    createdAt: '2026-01-18T09:00:00.000Z',
    lastMessage: {
      content: 'Deployment went smoothly this morning.',
      timestamp: '2026-10-10T08:15:00.000Z',
      senderId: 'u3'
    }
  }
];

export const initialMessages: Record<string, Message[]> = {
  c_general: [
    {
      id: 'm_general_1',
      channelId: 'c_general',
      senderId: 'u1',
      content: 'Welcome to rblink.chat! Let’s keep the workspace organized and fast.',
      timestamp: '2026-10-09T14:00:00.000Z',
      reactions: [{ emoji: '🎉', count: 2, users: ['u2', 'u3'] }]
    },
    {
      id: 'm_general_2',
      channelId: 'c_general',
      senderId: 'u2',
      content: 'The latest dashboard polish is ready for review. Please share anything that feels off.',
      timestamp: '2026-10-10T09:00:00.000Z',
      reactions: [{ emoji: '👀', count: 1, users: ['u1'] }]
    }
  ],
  c_engineering: [
    {
      id: 'm_engineering_1',
      channelId: 'c_engineering',
      senderId: 'u3',
      content: 'Infra is stable after the latest deploy. No incidents reported this morning.',
      timestamp: '2026-10-10T08:45:00.000Z',
      reactions: [{ emoji: '✅', count: 2, users: ['u1', 'u2'] }]
    }
  ],
  c_announcements: [
    {
      id: 'm_announcements_1',
      channelId: 'c_announcements',
      senderId: 'u1',
      content: 'We are starting a weekly product review every Thursday at 10:00 AM.',
      timestamp: '2026-10-07T10:00:00.000Z',
      isAnnouncement: true,
      reactions: [{ emoji: '📣', count: 3, users: ['u1', 'u2', 'u3'] }]
    }
  ],
  dm_u1_u2: [
    {
      id: 'm_dm_u1_u2_1',
      dmId: 'dm_u1_u2',
      senderId: 'u1',
      content: 'I’m checking the new workspace settings and the audit flow.',
      timestamp: '2026-10-10T09:00:00.000Z'
    },
    {
      id: 'm_dm_u1_u2_2',
      dmId: 'dm_u1_u2',
      senderId: 'u2',
      content: 'Can you review the new onboarding flow before standup?',
      timestamp: '2026-10-10T09:30:00.000Z'
    }
  ],
  dm_core_team: [
    {
      id: 'm_dm_core_team_1',
      dmId: 'dm_core_team',
      senderId: 'u3',
      content: 'Deployment went smoothly this morning.',
      timestamp: '2026-10-10T08:15:00.000Z'
    }
  ]
};

export const initialNotifications: Notification[] = [
  {
    id: 'n1',
    userId: 'u1',
    type: 'mention',
    title: 'You were mentioned',
    message: 'Alex mentioned you in engineering.',
    channelId: 'c_engineering',
    actorId: 'u2',
    isRead: false,
    createdAt: '2026-10-10T09:05:00.000Z'
  },
  {
    id: 'n2',
    userId: 'u1',
    type: 'system',
    title: 'Workspace update',
    message: 'The team is shipping rblink.chat v1.0 this week.',
    actorId: 'u1',
    isRead: true,
    createdAt: '2026-10-09T20:00:00.000Z'
  }
];

export const initialScheduledMessages: ScheduledMessage[] = [
  {
    id: 'sched_1',
    channelId: 'c_general',
    content: 'Good morning team — please share your priorities before noon.',
    scheduledFor: '2026-10-11T09:00:00.000Z',
    createdBy: 'u1'
  }
];

import { User, Channel, DirectMessage, Message, Workspace, Notification, ScheduledMessage } from '../types';

export const initialWorkspace: Workspace = {
  id: 'ws_rblink_main',
  name: 'rblink.chat',
  logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
  description: 'Next-Generation Team Collaboration Platform for High-Velocity Teams',
  ownerId: 'u5',
  createdAt: '2026-01-15T09:00:00.000Z',
  pendingInvites: [
    {
      id: 'inv_1',
      email: 'david.kim@example.com',
      role: 'member',
      invitedBy: 'u1',
      invitedAt: '2026-09-28T14:30:00.000Z',
    },
    {
      id: 'inv_2',
      email: 'claire.dev@rblink.io',
      role: 'guest',
      invitedBy: 'u2',
      invitedAt: '2026-09-30T10:15:00.000Z',
    }
  ]
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
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    presence: 'online',
    customStatus: {
      emoji: '🎧',
      text: 'Deep focus on WebSockets & performance',
      expiresAt: '2026-10-01T17:00:00.000Z'
    },
    bio: 'Lead Full-Stack Engineer. Building high-performance real-time frontends & microservices.',
    department: 'Engineering',
    joinedAt: '2026-01-16T10:30:00.000Z',
    lastActive: '2m ago'
  },
  {
    id: 'u3',
    name: 'Elena Rostova',
    username: 'elena.r',
    email: 'elena@rblink.chat',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    presence: 'away',
    customStatus: {
      emoji: '🎨',
      text: 'Refining Figma UI components & tokens',
      expiresAt: '2026-10-01T16:00:00.000Z'
    },
    bio: 'Lead Design Systems Engineer. Typography, micro-interactions, and accessibility advocate.',
    department: 'Product Design',
    joinedAt: '2026-02-01T11:00:00.000Z',
    lastActive: '15m ago'
  },
  {
    id: 'u4',
    name: 'Jordan Taylor',
    username: 'jordan.t',
    email: 'jordan@rblink.chat',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    presence: 'dnd',
    customStatus: {
      emoji: '🛑',
      text: 'Benchmarking WebSocket concurrent connections',
      expiresAt: '2026-10-01T18:00:00.000Z'
    },
    bio: 'Backend Architect. Distributed databases, Redis clusters, and zero-latency pipelines.',
    department: 'Infrastructure',
    joinedAt: '2026-02-10T09:45:00.000Z',
    lastActive: '5m ago'
  },
  {
    id: 'u5',
    name: 'Marcus Vance',
    username: 'marcus.v',
    email: 'marcus@rblink.chat',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'owner',
    presence: 'online',
    customStatus: {
      emoji: '🤝',
      text: 'Strategic customer interviews',
      expiresAt: '2026-10-01T19:00:00.000Z'
    },
    bio: 'Founder & CEO. Building the future of asynchronous team collaboration.',
    department: 'Executive',
    joinedAt: '2026-01-15T09:00:00.000Z',
    lastActive: 'Just now'
  },
  {
    id: 'u6',
    name: 'Maya Lin',
    username: 'maya.lin',
    email: 'maya@rblink.chat',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'guest',
    presence: 'online',
    customStatus: {
      emoji: '✨',
      text: 'Exploring codebase & mentorship onboarding',
      expiresAt: '2026-10-01T17:30:00.000Z'
    },
    bio: 'Software Engineering Intern @ rblink.chat. Excited about frontend architecture and design systems!',
    department: 'Engineering Interns',
    joinedAt: '2026-09-01T09:00:00.000Z',
    lastActive: 'Just now'
  }
];

export const initialChannels: Channel[] = [
  {
    id: 'c_announcements',
    name: 'announcements',
    description: 'Company-wide announcements, major product updates, and executive briefings.',
    topic: 'Official company updates and launch milestones | All-hands Thursday 3 PM UTC',
    isPrivate: false,
    isArchived: false,
    category: 'announcements',
    memberIds: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'],
    createdBy: 'u5',
    createdAt: '2026-01-15T09:00:00.000Z',
    isStarred: true,
    canvas: `# 📢 Announcements & Guidelines

Welcome to the official announcements channel for **rblink.chat**!

### Key Guidelines:
- Only workspace admins can post top-level announcements.
- Please use **threads** to comment or ask clarifying questions on any announcement.
- Check pinned messages for this quarter's OKRs and release roadmap.

### Upcoming Milestones:
1. **rblink.chat v1.0 Launch**: Today!
2. **Q4 All-Hands Demo Day**: Next Thursday at 3:00 PM UTC
`
  },
  {
    id: 'c_general',
    name: 'general',
    description: 'Workspace-wide general discussion, team coordination, and office banter.',
    topic: 'Workspace-wide chatter & coordination | Be kind and collaborative!',
    isPrivate: false,
    isArchived: false,
    category: 'general',
    memberIds: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'],
    createdBy: 'u1',
    createdAt: '2026-01-15T09:15:00.000Z',
    isStarred: true,
    canvas: `# 🌐 General Team Workspace

Welcome to **rblink.chat**! This channel is for team-wide news, cross-functional discussions, and day-to-day syncs.

### Helpful Links:
- 📖 [Engineering Handbook](https://github.com)
- 🎨 [Design Token Specs](https://figma.com)
- 📌 Check the pinned messages for weekly office hours
`
  },
  {
    id: 'c_engineering',
    name: 'engineering',
    description: 'Frontend, backend, real-time protocols, database architectures, and PR reviews.',
    topic: 'Daily sync: 10:00 AM UTC | WebSocket scaling & full-text search',
    isPrivate: false,
    isArchived: false,
    category: 'engineering',
    memberIds: ['u1', 'u2', 'u3', 'u4', 'u6'],
    createdBy: 'u2',
    createdAt: '2026-01-15T09:30:00.000Z',
    isStarred: true,
    canvas: `# 🛠 Engineering Architecture & Guidelines

### Tech Stack:
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Vite
- **Real-Time Layer**: WebSocket connection with optimistic updates & auto-reconnect
- **Backend API**: Node.js Express server with Multer attachments & in-memory cache
- **State Architecture**: React Context + Event-driven sync

### Code Conventions:
- All components must have accessible ARIA labels.
- Message rendering must support Markdown, code fences with syntax highlighting, and link unfurling.
- Test changes using \`npm test\` before opening PRs.
`
  },
  {
    id: 'c_design_system',
    name: 'design-system',
    description: 'Design system tokens, typography, component audits, and UI micro-interactions.',
    topic: 'Figma component library sync & accessibility guidelines',
    isPrivate: false,
    isArchived: false,
    category: 'product',
    memberIds: ['u1', 'u2', 'u3', 'u6'],
    createdBy: 'u3',
    createdAt: '2026-02-01T11:00:00.000Z',
    isStarred: false,
    canvas: `# 🎨 rblink Design System Guidelines

- **Primary Brand**: Slack Dark (\`#1A1D21\`), Sidebar (\`#19171D\`), Accent Blue (\`#1264A3\`)
- **Presence Indicators**: Green (\`#2BAC76\`), Amber Away (\`#ECB22E\`), Red DND (\`#E01E5A\`)
- **Typography**: Inter for UI prose, JetBrains Mono for code blocks.
`
  },
  {
    id: 'c_random',
    name: 'random',
    description: 'Coffee chat, pet pictures, music recommendations, and casual banter.',
    topic: 'Non-work banter, memes, coffee recommendations, and weekend plans',
    isPrivate: false,
    isArchived: false,
    category: 'random',
    memberIds: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'],
    createdBy: 'u1',
    createdAt: '2026-01-15T10:00:00.000Z',
    isStarred: false
  },
  {
    id: 'c_internship_cohort',
    name: 'internship-cohort',
    description: 'Private channel for engineering interns, mentors, and onboarding questions.',
    topic: 'Mentorship check-ins, onboarding Q&A, and project reviews',
    isPrivate: true,
    isArchived: false,
    category: 'engineering',
    memberIds: ['u1', 'u2', 'u6'],
    createdBy: 'u1',
    createdAt: '2026-09-01T09:00:00.000Z',
    isStarred: false
  }
];

export const initialDirectMessages: DirectMessage[] = [
  {
    id: 'dm_u1_u2',
    isGroup: false,
    participantIds: ['u1', 'u2'],
    createdBy: 'u1',
    createdAt: '2026-01-16T11:00:00.000Z',
    lastMessage: {
      content: 'Hey Alex! Did you check out the new thread panel interaction?',
      timestamp: '2026-10-01T13:45:00.000Z',
      senderId: 'u2'
    },
    isStarred: true,
    unreadCount: 0
  },
  {
    id: 'dm_u1_u3',
    isGroup: false,
    participantIds: ['u1', 'u3'],
    createdBy: 'u3',
    createdAt: '2026-02-05T14:20:00.000Z',
    lastMessage: {
      content: 'The new emoji reaction bar looks stunning on both desktop and mobile!',
      timestamp: '2026-10-01T12:30:00.000Z',
      senderId: 'u3'
    },
    isStarred: false,
    unreadCount: 1
  },
  {
    id: 'dm_group_leads',
    name: 'Product & Tech Leads',
    isGroup: true,
    participantIds: ['u1', 'u2', 'u4', 'u5'],
    createdBy: 'u5',
    createdAt: '2026-03-01T08:30:00.000Z',
    lastMessage: {
      content: 'All launch benchmarks passed with flying colors. Great job team!',
      timestamp: '2026-10-01T11:15:00.000Z',
      senderId: 'u5'
    },
    isStarred: true,
    unreadCount: 0
  }
];

export const initialMessages: Record<string, Message[]> = {
  // Messages in #announcements
  'c_announcements': [
    {
      id: 'm_ann_1',
      channelId: 'c_announcements',
      senderId: 'u5',
      content: `🎉 **Welcome to rblink.chat!** 🚀\n\nWe are thrilled to officially unveil **rblink.chat** — our unified, ultra-responsive team collaboration platform.\n\n### What makes rblink.chat special?\n- ⚡ **Real-Time Distributed Chat**: Zero latency with WebSockets and instant optimistic updates.\n- 🧵 **Slack-grade Message Threads**: Keep discussions organized without cluttering channels.\n- 👥 **Smart Mentions & Autocomplete**: Notify teammates with \`@user\`, \`@channel\`, or \`@everyone\`.\n- 📊 **Interactive Polls & Checklists**: Make decisions together directly inside the chat.\n- 🔍 **Full-Text Search & Jump**: Find any message, file, or person instantly with \`Ctrl+K\`.\n- 📁 **File Attachments & Gallery**: Drag & drop images, PDFs, code files with rich previews.\n\nEnjoy the platform and share your feedback in #general!`,
      timestamp: '2026-10-01T09:00:00.000Z',
      isPinned: true,
      pinnedBy: 'u5',
      pinnedAt: '2026-10-01T09:05:00.000Z',
      isAnnouncement: true,
      reactions: [
        { emoji: '🎉', count: 5, users: ['u1', 'u2', 'u3', 'u4', 'u6'] },
        { emoji: '🚀', count: 4, users: ['u1', 'u2', 'u3', 'u5'] },
        { emoji: '❤️', count: 3, users: ['u1', 'u3', 'u6'] }
      ],
      replyCount: 2,
      latestReplyAt: '2026-10-01T09:25:00.000Z',
      replyUserIds: ['u1', 'u2']
    },
    {
      id: 'm_ann_2',
      channelId: 'c_announcements',
      senderId: 'u1',
      content: `📢 **Reminder for All Interns & Mentors**\n\nPlease check your schedule for the weekly sprint demo. @maya.lin will be presenting our new keyboard shortcut switcher (\`Ctrl+K\`). Make sure to attend!`,
      timestamp: '2026-10-01T10:30:00.000Z',
      mentions: ['u6'],
      reactions: [
        { emoji: '🙌', count: 3, users: ['u2', 'u3', 'u6'] },
        { emoji: '👏', count: 2, users: ['u4', 'u6'] }
      ]
    }
  ],

  // Messages in #general
  'c_general': [
    {
      id: 'm_gen_1',
      channelId: 'c_general',
      senderId: 'u1',
      content: `Good morning everyone! 👋 Hope you're all having a great week.\n\nQuick check-in: We're reviewing all the features listed in our launch checklist today. Everything from basic messaging and threads to polls, files, bookmarks, and search.`,
      timestamp: '2026-10-01T09:15:00.000Z',
      reactions: [
        { emoji: '☀️', count: 4, users: ['u2', 'u3', 'u4', 'u6'] },
        { emoji: '👋', count: 3, users: ['u2', 'u5', 'u6'] }
      ]
    },
    {
      id: 'm_gen_2',
      channelId: 'c_general',
      senderId: 'u2',
      content: `Morning @sarah.chen! ☕ Testing is going smoothly. I especially love the smooth scroll-to-message feature when clicking search results or notification badges!`,
      timestamp: '2026-10-01T09:20:00.000Z',
      mentions: ['u1'],
      reactions: [
        { emoji: '🔥', count: 3, users: ['u1', 'u3', 'u4'] }
      ]
    },
    {
      id: 'm_gen_3',
      channelId: 'c_general',
      senderId: 'u6',
      content: `Hi team! Excited to be here. As part of my onboarding, I just created an interactive team poll below. Let me know your thoughts!`,
      timestamp: '2026-10-01T10:00:00.000Z',
      poll: {
        id: 'poll_lunch',
        question: '🍕 Team Lunch Friday: Which cuisine should we order?',
        options: [
          { id: 'opt_1', text: 'Wood-fired Artisanal Pizza 🍕', votes: ['u1', 'u2', 'u6'] },
          { id: 'opt_2', text: 'Fresh Japanese Sushi & Ramen 🍣', votes: ['u3', 'u4'] },
          { id: 'opt_3', text: 'Mediterranean Mezze & Bowls 🥗', votes: ['u5'] },
          { id: 'opt_4', text: 'Gourmet Smash Burgers 🍔', votes: [] }
        ],
        allowMultiple: false,
        isAnonymous: false,
        createdBy: 'u6',
        createdAt: '2026-10-01T10:00:00.000Z'
      },
      reactions: [
        { emoji: '🍕', count: 4, users: ['u1', 'u2', 'u3', 'u6'] },
        { emoji: '😋', count: 2, users: ['u1', 'u4'] }
      ],
      replyCount: 1,
      latestReplyAt: '2026-10-01T10:15:00.000Z',
      replyUserIds: ['u3']
    },
    {
      id: 'm_gen_4',
      channelId: 'c_general',
      senderId: 'u3',
      content: `Here is the link to our updated Figma UI design kit. It includes all dark and light mode color tokens, hover states, and accessibility contrast ratios:\n\nhttps://github.com/facebook/react\n\nTake a look and leave comments!`,
      timestamp: '2026-10-01T11:00:00.000Z',
      linkPreviews: [
        {
          url: 'https://github.com/facebook/react',
          title: 'facebook/react: The library for web and native user interfaces',
          description: 'A declarative, efficient, and flexible JavaScript library for building user interfaces. Supports component-driven architecture and real-time state synchronization.',
          siteName: 'GitHub',
          favicon: 'https://github.githubassets.com/favicons/favicon.svg',
          imageUrl: 'https://opengraph.githubassets.com/1/facebook/react',
          type: 'github'
        }
      ],
      reactions: [
        { emoji: '🎨', count: 3, users: ['u1', 'u2', 'u6'] },
        { emoji: '⭐', count: 2, users: ['u1', 'u2'] }
      ]
    }
  ],

  // Messages in #engineering
  'c_engineering': [
    {
      id: 'm_eng_1',
      channelId: 'c_engineering',
      senderId: 'u2',
      content: `Hey @channel! Here is the core WebSocket message dispatch implementation for our real-time client:\n\n\`\`\`typescript\ninterface SocketPayload<T> {\n  type: 'message:new' | 'reaction:toggle' | 'thread:reply' | 'user:typing';\n  payload: T;\n  timestamp: number;\n}\n\nexport const dispatchSocketEvent = <T>(type: SocketPayload<T>['type'], data: T) => {\n  if (ws && ws.readyState === WebSocket.OPEN) {\n    ws.send(JSON.stringify({ type, payload: data, timestamp: Date.now() }));\n  }\n};\n\`\`\`\n\nNotice how clean and lightweight it is. Let's make sure we test edge cases with reconnection backoff.`,
      timestamp: '2026-10-01T09:40:00.000Z',
      mentions: ['@channel'],
      reactions: [
        { emoji: '🚀', count: 4, users: ['u1', 'u3', 'u4', 'u6'] },
        { emoji: '💻', count: 3, users: ['u1', 'u4', 'u6'] }
      ],
      replyCount: 3,
      latestReplyAt: '2026-10-01T10:05:00.000Z',
      replyUserIds: ['u4', 'u1', 'u2']
    },
    {
      id: 'm_eng_2',
      channelId: 'c_engineering',
      senderId: 'u4',
      content: `I've prepared our **v1.0 Production Launch Checklist**! You can toggle items directly right here:`,
      timestamp: '2026-10-01T10:15:00.000Z',
      checklist: {
        id: 'chk_launch',
        title: 'Production Readiness Checklist',
        createdBy: 'u4',
        createdAt: '2026-10-01T10:15:00.000Z',
        items: [
          { id: 'ci_1', text: 'Verify WebSocket reconnect exponential backoff', completed: true, completedBy: 'u2' },
          { id: 'ci_2', text: 'Confirm zero-latency optimistic message delivery', completed: true, completedBy: 'u1' },
          { id: 'ci_3', text: 'Validate file upload mime-types & size bounds (max 25MB)', completed: true, completedBy: 'u4' },
          { id: 'ci_4', text: 'Audit keyboard accessibility & focus traps (WCAG AA)', completed: false },
          { id: 'ci_5', text: 'Run automated end-to-end integration test suite', completed: false }
        ]
      },
      reactions: [
        { emoji: '✅', count: 4, users: ['u1', 'u2', 'u3', 'u6'] }
      ]
    },
    {
      id: 'm_eng_3',
      channelId: 'c_engineering',
      senderId: 'u1',
      content: `I've attached our system architecture diagram and the v1.0 specifications PDF for easy reference!`,
      timestamp: '2026-10-01T11:20:00.000Z',
      attachments: [
        {
          id: 'att_1',
          name: 'rblink-system-architecture.png',
          size: 428000,
          type: 'image/png',
          url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
          previewUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=80',
          uploadedAt: '2026-10-01T11:20:00.000Z'
        },
        {
          id: 'att_2',
          name: 'rblink-specs-and-features.pdf',
          size: 1250000,
          type: 'application/pdf',
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          uploadedAt: '2026-10-01T11:20:00.000Z'
        }
      ],
      reactions: [
        { emoji: '👀', count: 3, users: ['u2', 'u4', 'u6'] },
        { emoji: '🙏', count: 2, users: ['u2', 'u3'] }
      ]
    }
  ],

  // Messages in #design-system
  'c_design_system': [
    {
      id: 'm_ds_1',
      channelId: 'c_design_system',
      senderId: 'u3',
      content: `Welcome to the design-system channel! We just finalized the hover and active states for message reaction chips:\n\n> "Good design is as little design as possible." — Dieter Rams\n\nCheck out this quick video overview of the new Slack-inspired layout: https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
      timestamp: '2026-10-01T10:45:00.000Z',
      linkPreviews: [
        {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: 'rblink.chat UI Walkthrough & Micro-Interactions',
          description: 'A deep dive into our fluid layout transitions, responsive mobile drawer, and keyboard accessibility patterns.',
          siteName: 'YouTube',
          type: 'youtube',
          videoId: 'dQw4w9WgXcQ',
          imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80'
        }
      ],
      reactions: [
        { emoji: '🎉', count: 3, users: ['u1', 'u2', 'u6'] }
      ]
    }
  ],

  // Messages in #random
  'c_random': [
    {
      id: 'm_rnd_1',
      channelId: 'c_random',
      senderId: 'u6',
      content: `Anyone up for a quick virtual coffee break around 3:30 PM? ☕🍪`,
      timestamp: '2026-10-01T12:00:00.000Z',
      reactions: [
        { emoji: '☕', count: 3, users: ['u1', 'u2', 'u3'] },
        { emoji: '👋', count: 2, users: ['u1', 'u5'] }
      ]
    }
  ],

  // Messages in DMs
  'dm_u1_u2': [
    {
      id: 'm_dm_1',
      dmId: 'dm_u1_u2',
      senderId: 'u1',
      content: `Hey Alex, how is the thread drawer feeling on mobile screens?`,
      timestamp: '2026-10-01T13:30:00.000Z'
    },
    {
      id: 'm_dm_2',
      dmId: 'dm_u1_u2',
      senderId: 'u2',
      content: `It looks fantastic! The full-width slide-over drawer makes replying super intuitive on phone viewports.`,
      timestamp: '2026-10-01T13:45:00.000Z',
      reactions: [
        { emoji: '🙌', count: 1, users: ['u1'] }
      ]
    }
  ],

  'dm_u1_u3': [
    {
      id: 'm_dm_3',
      dmId: 'dm_u1_u3',
      senderId: 'u3',
      content: `The new emoji reaction bar looks stunning on both desktop and mobile! Can't wait for the team demo today.`,
      timestamp: '2026-10-01T12:30:00.000Z',
      reactions: [
        { emoji: '❤️', count: 1, users: ['u1'] }
      ]
    }
  ],

  'dm_group_leads': [
    {
      id: 'm_dm_4',
      dmId: 'dm_group_leads',
      senderId: 'u5',
      content: `All launch benchmarks passed with flying colors. Great job team! Let's get ready for the official rollout.`,
      timestamp: '2026-10-01T11:15:00.000Z',
      reactions: [
        { emoji: '🚀', count: 3, users: ['u1', 'u2', 'u4'] }
      ]
    }
  ],

  // Thread replies for m_eng_1
  'thread_m_eng_1': [
    {
      id: 'tr_1',
      threadParentId: 'm_eng_1',
      channelId: 'c_engineering',
      senderId: 'u4',
      content: `Great structure @alex.rivera! I added heartbeat ping/pong handlers so stale connection sockets are cleaned up within 30 seconds.`,
      timestamp: '2026-10-01T09:48:00.000Z',
      mentions: ['u2'],
      reactions: [
        { emoji: '👍', count: 2, users: ['u1', 'u2'] }
      ]
    },
    {
      id: 'tr_2',
      threadParentId: 'm_eng_1',
      channelId: 'c_engineering',
      senderId: 'u1',
      content: `Agreed, this will ensure reliable push notifications for users on spotty mobile network connections.`,
      timestamp: '2026-10-01T09:55:00.000Z',
      reactions: [
        { emoji: '💯', count: 2, users: ['u2', 'u4'] }
      ]
    },
    {
      id: 'tr_3',
      threadParentId: 'm_eng_1',
      channelId: 'c_engineering',
      senderId: 'u2',
      content: `Awesome! The fallback to local state caching also works seamlessly if the user is completely offline.`,
      timestamp: '2026-10-01T10:05:00.000Z',
      reactions: [
        { emoji: '🎉', count: 2, users: ['u1', 'u4'] }
      ]
    }
  ],

  // Thread replies for m_ann_1
  'thread_m_ann_1': [
    {
      id: 'tr_ann_1',
      threadParentId: 'm_ann_1',
      channelId: 'c_announcements',
      senderId: 'u1',
      content: `Huge congratulations everyone! So proud of what we've built together. Let's make today unforgettable.`,
      timestamp: '2026-10-01T09:15:00.000Z',
      reactions: [
        { emoji: '👏', count: 4, users: ['u2', 'u3', 'u4', 'u5'] }
      ]
    },
    {
      id: 'tr_ann_2',
      threadParentId: 'm_ann_1',
      channelId: 'c_announcements',
      senderId: 'u2',
      content: `Let's go!! 🚀 Looking forward to seeing the community reactions.`,
      timestamp: '2026-10-01T09:25:00.000Z',
      reactions: [
        { emoji: '🔥', count: 3, users: ['u1', 'u3', 'u5'] }
      ]
    }
  ]
};

export const initialNotifications: Notification[] = [
  {
    id: 'notif_1',
    userId: 'u1',
    type: 'mention',
    title: 'Alex Rivera mentioned you',
    message: 'Morning @sarah.chen! ☕ Testing is going smoothly...',
    channelId: 'c_general',
    messageId: 'm_gen_2',
    actorId: 'u2',
    isRead: false,
    createdAt: '2026-10-01T09:20:00.000Z'
  },
  {
    id: 'notif_2',
    userId: 'u1',
    type: 'dm',
    title: 'Elena Rostova sent you a direct message',
    message: 'The new emoji reaction bar looks stunning on both desktop and mobile!',
    dmId: 'dm_u1_u3',
    messageId: 'm_dm_3',
    actorId: 'u3',
    isRead: false,
    createdAt: '2026-10-01T12:30:00.000Z'
  },
  {
    id: 'notif_3',
    userId: 'u1',
    type: 'thread_reply',
    title: 'Jordan Taylor replied to your thread in #engineering',
    message: 'Great structure @alex.rivera! I added heartbeat ping/pong handlers...',
    channelId: 'c_engineering',
    messageId: 'tr_1',
    threadParentId: 'm_eng_1',
    actorId: 'u4',
    isRead: true,
    createdAt: '2026-10-01T09:48:00.000Z'
  }
];

export const initialScheduledMessages: ScheduledMessage[] = [
  {
    id: 'sched_1',
    channelId: 'c_announcements',
    content: '⏰ **All-Hands Demo starts in 10 minutes!** Grab your coffee and join the main link.',
    scheduledFor: '2026-10-01T15:00:00.000Z',
    createdBy: 'u1'
  }
];

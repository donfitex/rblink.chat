# 🚀 rblink.chat

**rblink.chat** is an enterprise-grade, real-time team communication and collaboration platform inspired by Slack and Discord. Designed from the ground up to empower high-velocity engineering, design, and product cohorts with zero-latency communication, threaded conversations, interactive collaboration widgets, and full-text search.

Built entirely with **100% free, open-source dependencies and resources**.

---

## 🌟 Key Features & Specifications

### 💬 1. Basic Messaging & Stream
- **Rich Message Sending**: Instant zero-latency sending with optimistic UI updates.
- **Edit & Delete**: Edit your own messages with an `(edited)` indicator and full edit timestamp; delete messages with confirmation.
- **Multiline & Keybindings**: `Enter` to send, `Shift + Enter` for new lines, with clear helper badges.
- **Character Limit Handling**: 4,000 character limit with an active warning counter when exceeding 3,500 characters.
- **Timestamps**: Compact relative timestamps (e.g. *"2m ago"*), message time (*"3:15 PM"*), and full ISO date-time on hover tooltip.
- **Message Grouping**: Consecutive messages from the same sender within 5 minutes are grouped without repeating avatar and username.
- **Date Separators & Dividers**: Dynamic date dividers (*"Today"*, *"Yesterday"*, *"October 1, 2026"*).
- **Jump to Latest & Scroll Tracking**: Floating *"Jump to latest"* button with unread count pill appears when scrolled up.
- **Scroll-to-Message**: Clicking any search result, notification, thread parent, or bookmark smoothly scrolls to the target message and triggers an amber pulse highlight (`.message-highlight-pulse`).

### 😃 2. Message Reactions
- **Quick Reaction Bar**: Hover action bar with 1-click popular reactions (👍, ❤️, 😂, 🎉, 🚀, 👀).
- **Full Emoji Picker**: Popover categorized by *Quick Reactions*, *Smileys & Emotion*, *Gestures & People*, and *Symbols & Objects* with instant search filtering.
- **Deduplication & Toggling**: Clicking an existing reaction toggles your vote; duplicate reactions are automatically prevented.
- **Who Reacted**: Reaction chips show count and a tooltip listing every teammate who reacted.

### 📝 3. Message Formatting & Markdown
- **Markdown Prose**: Bold (`**text**`), Italics (`*text*`), Strikethrough (`~text~`), Blockquotes (`> quote`), and Lists (bulleted `- ` and numbered `1. `).
- **Code Fences**: Multiline code blocks (```` ```typescript ... ``` ````) with syntax styling, language badge, and a **1-click Copy Code** button with checkmark feedback.
- **WYSIWYG Composer Toolbar**: Quick formatting buttons right above the input box.
- **Rich Link Unfurling**:
  - **YouTube Cards**: In-line video thumbnail and playable embedded video player.
  - **GitHub Cards**: Repository metadata with descriptions and code links.
  - **Web Link Previews**: Title, description, favicon, and external open links.

### 🧵 4. Replies & Threads (Slack-style)
- **Dedicated Thread Panel**: Slide-over panel on desktop (right panel) and full-screen drawer on mobile.
- **Parent Message Context**: Parent message pinned at top of drawer with full reactions and attachments.
- **Thread Replies Summary**: Main channel view shows reply count, last reply timestamp, and stacked replier avatars.
- **Thread Composer**: Dedicated input supporting markdown formatting, emoji picker, mentions, and file attachments.
- **Esc to Close**: Press `Esc` or click `X` to instantly close the thread drawer.

### 👥 5. Mentions & Autocomplete
- **Mention Trigger**: Type `@` to open the interactive autocomplete popup matching teammates by name or `@username`.
- **Special Mentions**: `@channel` and `@everyone` with distinct golden highlight styling.
- **Interactive Mention Chips**: Clicking any `@username` in chat opens their user profile card.
- **Automated In-App Notifications**: Mentioning a user automatically triggers a high-priority in-app notification in their notification drawer.

### 🌐 6. Channels System
- **Create Channel**: Channel name slug validation (`lowercase-and-hyphens-only`), description, topic, category selection, and public vs. private toggle.
- **Channel Header**: Editable topic, member count button, pinned items counter, files gallery trigger, search, and notification mute toggle.
- **Channel Browser**: Explore all public channels, filter by *Joined* vs *Discover*, search by name, and 1-click Join/Leave.
- **Categories**: Organize channels into *General*, *Engineering*, *Product & Design*, *Announcements*, and *Random*.
- **Collaborative Channel Canvas**: Shared markdown notes and meeting documentation per channel.

### ✉️ 7. Direct Messages (DMs)
- **1-on-1 & Group DMs**: Start private conversations with teammates or multi-user group chats.
- **Search User Before Starting**: Filter by name or username with multi-select checkboxes.
- **Group Management**: Rename group conversations and manage participants.
- **Presence Indicators**: Live status dots (Online 🟢, Away 🟡, Do Not Disturb 🔴, Offline ⚪).

### 🔍 8. Global Search (`Ctrl+K`)
- **Command Palette**: Trigger with top search bar or `Ctrl+K` / `Cmd+K`.
- **Filters**: Filter across *All*, *Messages*, *Channels*, *People*, and *Files*.
- **Search Highlighting**: Search terms are highlighted in yellow within matching results.
- **Instant Jump**: Selecting a message result navigates to the channel or DM and scrolls to the message with a glowing highlight pulse.

### 🔔 9. Notifications Center
- **In-App Bell Indicator**: Badge with unread count.
- **Categorized Alerts**: Mentions, DMs, thread replies, and channel activity.
- **Actions**: Mark individual as read, *"Mark all read"*, or click to jump straight to the source message.
- **Notification Preferences**: Toggles for DMs, mentions, threads, and sound alerts.

### 📁 10. Files & Attachments
- **Attachment Support**: Upload images (PNG, JPEG, GIF), PDF documents, code files, and archives up to 25MB.
- **Image Lightbox**: Full-screen modal with Zoom In/Out, 90° Rotation, Download, and Copy Link.
- **PDF Viewer Modal**: In-browser embedded PDF preview with toolbar controls.
- **Channel Files Gallery**: Dedicated repository modal to browse, search, and filter all files shared in the channel.

### 🤝 11. Interactive Collaboration Widgets
- **📊 Team Polls**: Create single-choice or multiple-choice polls with live percentage progress bars and voter tooltips.
- **✅ Interactive Checklists**: Send checklists to chat where any team member can check off tasks in real time with strike-through text and completion tracking.
- **⏰ Scheduled Messages**: Schedule messages to automatically dispatch in 15 minutes, 1 hour, or at a custom time.
- **📌 Pinned Messages**: Pin important messages to channel header with 1-click jump and unpin confirmation.
- **🔖 Saved Items / Bookmarks**: Bookmark any message across workspace channels to view in the Saved Items drawer.

### 👤 12. Profiles, Status & Moderation
- **Custom Status**: Set status emoji, text, and expiry presets (*"In a meeting"*, *"Focusing"*, *"Out for lunch"*).
- **Profile Modal**: Display name, username, bio, department, role, email, and presence.
- **Edit Profile**: Update your identity, avatar, and bio directly.
- **Pair Testing User Switcher**: Top navbar dropdown allows switching between **Sarah Chen** (Admin), **Alex Rivera** (Engineer), **Elena Rostova** (Designer), **Jordan Taylor** (Architect), **Marcus Vance** (Owner), and **Maya Lin** (Intern) to test collaboration in real time!
- **Safety & Moderation**: Report message modal with reason categories, user blocking, and confirmation dialogs.

---

## 🛠 Tech Stack & Architecture

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Vite.
- **Backend API**: Node.js, Express, WebSocket (`ws`), Multer.
- **Persistence**: Dual-layer architecture (Express server + browser LocalStorage fallback) ensuring the app works both connected and offline.
- **Real-Time Layer**: WebSocket broadcast for instant message delivery, typing indicators, reactions, polls, and status updates across browser tabs.

---

## 🚀 Quick Start & Launching Instructions

### 1. Prerequisites
- **Node.js** (v18.0.0 or later)
- **npm** (v9.0.0 or later)

### 2. 1-Click Launch (Recommended)

#### On Windows:
Double-click `run.bat` or execute in PowerShell / Command Prompt:
```cmd
run.bat
```
*This will verify Node, install dependencies if needed, start the backend server, and open `http://localhost:3001` in your default browser!*

#### On macOS / Linux:
```bash
chmod +x run.sh
./run.sh
```

---

### 3. Manual Terminal Commands

#### Option A: Production Mode (Recommended)
```bash
# 1. Install dependencies
npm install

# 2. Build production assets
npm run build

# 3. Start unified Express + WebSocket server
npm start
```
Visit **http://localhost:3001** in your browser!

#### Option B: Development Mode (Hot Reloading)
```bash
# Run both Vite dev server and backend concurrently
npm run dev
```
Visit **http://localhost:5173** (API and WebSockets proxy automatically to backend on 3001).

---

## 🧪 Testing Instructions

### 1. Automated Test Suite
Run the built-in automated test suite to verify core chat logic:
```bash
npm test
```
**Test Coverage Includes:**
- ✅ Message grouping by sender within 5 minutes
- ✅ Reaction toggling and duplicate reaction prevention
- ✅ Mentions parsing (`@user`, `@channel`, `@everyone`)
- ✅ Channel name slug validation and sanitization
- ✅ Interactive poll voting constraints and percentage calculation
- ✅ Interactive checklist item completion tracking
- ✅ Full-text search filtering across messages, channels, and people
- ✅ Thread reply aggregation and latest reply tracking

### 2. Interactive Collaborative Pair Testing
To test real-time collaboration without needing multiple accounts:
1. Open `http://localhost:3001` in your browser.
2. In the top right corner, click on the **active user profile** (default: *Sarah Chen*).
3. Select **Switch User** from the dropdown (e.g. switch to *Alex Rivera* or *Elena Rostova*).
4. Send messages, reply in threads, add emoji reactions, or vote on polls.
5. Notice how unread badges, notifications, and mentions update immediately for each user!
6. Open a second browser window (e.g. Incognito or a different browser) to see real-time WebSocket sync in action.

---

## 📦 Project Structure

```
rblink.chat/
├── dist/                      # Compiled production frontend assets
├── server/
│   └── index.js               # Express + WebSocket server + Multer uploads
├── src/
│   ├── components/
│   │   ├── chat/              # MessageList, MessageItem, Composer, ThreadDrawer, Markdown
│   │   ├── collaboration/     # PollCard, ChecklistCard, LinkPreviewCard, ChannelCanvas
│   │   ├── files/             # FileAttachmentCard, ImageLightbox, PdfViewerModal, FilesGallery
│   │   ├── layout/            # TopNavbar, Sidebar, AppLayout
│   │   ├── modals/            # CreateChannel, BrowseChannels, DirectMessage, Search, UserProfile,
│   │   │                      # StatusModal, WorkspaceSettings, Onboarding, Shortcuts, ReportMessage
│   │   └── ui/                # EmojiPicker, Toast, Skeleton
│   ├── context/
│   │   └── ChatContext.tsx    # Global React state, WebSocket client & local persistence
│   ├── data/
│   │   └── initialData.ts     # Realistic seed data (Workspace, channels, users, threads, polls)
│   ├── styles/
│   │   └── index.css          # Tailwind CSS directives & custom scrollbars
│   ├── types/
│   │   └── index.ts           # Comprehensive TypeScript interfaces
│   ├── utils/
│   │   └── formatters.ts      # Relative time, date dividers, file size, mentions
│   ├── App.tsx                # Main App component
│   └── main.tsx               # React DOM root entrypoint
├── tests/
│   └── test-runner.js         # Automated test suite
├── index.html                 # HTML template with Inter & JetBrains Mono fonts
├── package.json               # Dependencies and scripts
├── run.bat                    # 1-click Windows launcher
├── run.sh                     # 1-click Linux/Mac launcher
├── tailwind.config.js         # Tailwind configuration with Slack theme colors
├── tsconfig.json              # TypeScript configuration
└── vite.config.ts             # Vite configuration with API & WebSocket proxying
```

---

## 📄 License
MIT — 100% Free and Open Source.

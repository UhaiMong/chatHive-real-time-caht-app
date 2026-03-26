# ChatHive 🐝

A production-grade real-time chat application built with a modern full-stack TypeScript architecture.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, Redux Toolkit, Framer Motion |
| UI Primitives | Headless UI, Heroicons, React Hook Form |
| Real-time | Socket.io client |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB with Mongoose |
| Auth | JWT (access + refresh rotation), bcrypt |
| Real-time | Socket.io |
| File Upload | Multer |

---

## Features

- **Secure Auth** — JWT access tokens (15m) + refresh token rotation (7d, 5-token cap per user)
- **Real-time Messaging** — Socket.io with room-based delivery; no polling
- **Direct & Group Chats** — Create DMs instantly or multi-member groups with admin controls
- **Media Sharing** — Images, video, audio, documents with in-message preview
- **Reply Threads** — Quote any message inline
- **Message Management** — Edit, delete for me / delete for everyone, soft deletion
- **Online Presence** — Real-time online/offline with last-seen timestamps
- **Typing Indicators** — Debounced per-conversation, visible in sidebar and header
- **Read Receipts** — Delivered / read status with icons per message
- **Infinite Scroll** — Cursor-based pagination, loads older messages on scroll to top
- **Optimistic UI** — Messages appear instantly with pending state; confirmed on server response
- **User Search** — Regex search across username and email
- **Unread Badges** — Per-conversation unread counters reset on open
- **Toast Notifications** — In-app alerts for new messages from inactive conversations
- **Mobile Responsive** — Sidebar collapses on mobile, slide transitions

---

## Project Structure

```
chathive/
├── server/                     # Express + Socket.io backend
│   └── src/
│       ├── config/             # DB connection, env validation
│       ├── features/
│       │   ├── auth/           # JWT auth service, routes, controller
│       │   ├── users/          # Profile, search, block
│       │   ├── conversations/  # Direct, group management
│       │   └── messages/       # CRUD, pagination, media, search
│       ├── shared/
│       │   ├── middlewares/    # authenticate, errorHandler, upload
│       │   ├── utils/          # jwt, response helpers
│       │   └── types/          # Shared TS interfaces
│       ├── socket/             # Socket.io event handlers
│       ├── app.ts              # Express app factory
│       └── index.ts            # HTTP server entry point
│
└── client/                     # React + Redux frontend
    └── src/
        ├── app/                # App.tsx router + session init
        ├── features/
        │   ├── auth/           # Login, Register pages + authSlice
        │   ├── conversations/  # Sidebar, ConversationItem, modals + slice
        │   ├── chat/           # ChatWindow, MessageList, Bubble, Input + slice
        │   └── notifications/  # Toast slice
        └── shared/
            ├── components/
            │   ├── ui/         # Avatar, Button, Input, Modal, Toast, etc.
            │   └── layout/     # AppLayout, RouteGuards
            ├── hooks/          # useSocket, useTyping, useAuth
            ├── services/       # axios instance, apiServices, socket singleton
            ├── store/          # Redux store, hooks, uiSlice
            ├── types/          # Shared TS interfaces
            └── utils/          # cn, formatters, helpers
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)

### 1. Clone and install

```bash
git clone https://github.com/your-org/chathive.git
cd chathive
npm run install:all
```

### 2. Configure server environment

```bash
cd server
cp .env.example .env
```

Edit `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/chathive
JWT_ACCESS_SECRET=your_strong_access_secret
JWT_REFRESH_SECRET=your_strong_refresh_secret
CLIENT_URL=http://localhost:5173
```

### 3. Run in development

```bash
# From project root — starts both server (port 5000) and client (port 5173)
npm run dev
```

Or run separately:

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

### 4. Open the app

Navigate to [http://localhost:5173](http://localhost:5173)

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Sign in, returns tokens |
| POST | `/api/auth/refresh` | — | Rotate refresh token |
| POST | `/api/auth/logout` | ✓ | Invalidate refresh token |
| GET | `/api/auth/me` | ✓ | Get current user payload |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/search?q=` | Search by username/email |
| GET | `/api/users/profile` | Own profile |
| GET | `/api/users/:userId` | Any user profile |
| PATCH | `/api/users/profile` | Update username, bio, avatar |
| POST | `/api/users/:userId/block` | Block user |
| DELETE | `/api/users/:userId/block` | Unblock user |

### Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations` | All user conversations |
| GET | `/api/conversations/direct/:userId` | Get or create DM |
| POST | `/api/conversations/group` | Create group |
| GET | `/api/conversations/:id` | Single conversation |
| PATCH | `/api/conversations/:id` | Update group name/avatar |
| POST | `/api/conversations/:id/participants` | Add members |
| DELETE | `/api/conversations/:id/participants/:userId` | Remove member |
| DELETE | `/api/conversations/:id/leave` | Leave group |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations/:id/messages?cursor=` | Paginated history |
| POST | `/api/conversations/:id/messages` | Send message (multipart) |
| POST | `/api/conversations/:id/messages/read` | Mark all read |
| GET | `/api/conversations/:id/messages/search?q=` | Search messages |
| PATCH | `/api/conversations/:id/messages/:msgId` | Edit message |
| DELETE | `/api/conversations/:id/messages/:msgId/me` | Delete for me |
| DELETE | `/api/conversations/:id/messages/:msgId/all` | Delete for everyone |

---

## Socket.io Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `conversations:join` | — | Join all conversation rooms |
| `message:send` | `{ conversationId, content, type?, replyTo? }` | Send a message |
| `message:edit` | `{ messageId, content, conversationId }` | Edit a message |
| `message:delete` | `{ messageId, conversationId, scope }` | Delete a message |
| `message:read` | `{ conversationId }` | Mark messages as read |
| `typing:start` | `{ conversationId }` | User started typing |
| `typing:stop` | `{ conversationId }` | User stopped typing |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `message:new` | `Message` | New message in a conversation |
| `message:edited` | `Message` | Message was edited |
| `message:deleted` | `{ messageId, conversationId }` | Message was deleted |
| `message:read` | `{ conversationId, userId, readAt }` | Messages read by user |
| `typing:start` | `{ userId, conversationId }` | Someone is typing |
| `typing:stop` | `{ userId, conversationId }` | Someone stopped typing |
| `user:online` | `{ userId }` | User came online |
| `user:offline` | `{ userId, lastSeen }` | User went offline |

---

## Architecture Decisions

- **Feature-based folder structure** — each domain is self-contained with its model, service, controller, and routes
- **Cursor-based pagination** — uses MongoDB `_id` as cursor for stable, efficient message loading
- **Refresh token rotation** — each refresh issues a new refresh token; old one is invalidated; max 5 per user
- **Soft deletion** — messages and conversations are never hard-deleted from the DB
- **Optimistic UI** — messages rendered immediately with a pending state; confirmed/replaced on server response
- **Socket room strategy** — each conversation is a Socket.io room; users join all their rooms on connect
- **Silent 401 refresh** — Axios interceptor queues failed requests and replays them after token refresh

---

## Future Scope

- [ ] WebRTC voice/video calls
- [ ] Message reactions (emoji)
- [ ] Read receipts per participant in groups
- [ ] End-to-end encryption
- [ ] Push notifications (FCM/APNs)
- [ ] Message pinning
- [ ] AI-assisted replies / summarization
- [ ] Link previews
- [ ] Message forwarding
- [ ] User stories / status

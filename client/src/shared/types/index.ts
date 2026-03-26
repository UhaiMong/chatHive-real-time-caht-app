// ── User ─────────────────────────────────────────────────────────────────────
export interface User {
  userId: string;
  _id: string;
  username: string;
  email: string;
  avatar: string | null;
  bio: string;
  status: "online" | "offline" | "away";
  lastSeen: string;
  createdAt: string;
}

// ── Message ───────────────────────────────────────────────────────────────────
export type MessageType =
  | "text"
  | "image"
  | "file"
  | "audio"
  | "video"
  | "system";

export interface MediaAttachment {
  url: string;
  type: "image" | "video" | "audio" | "file";
  name: string;
  size: number;
  mimeType: string;
}

export interface ReadReceipt {
  user: string;
  readAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: Pick<User, "_id" | "username" | "avatar" | "userId">;
  type: MessageType;
  content: string;
  media?: MediaAttachment;
  replyTo?: Message | null;
  readBy: ReadReceipt[];
  deliveredTo: string[];
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  // optimistic UI
  pending?: boolean;
  failed?: boolean;
  localId?: string;
}

// ── Conversation ──────────────────────────────────────────────────────────────
export type ConversationType = "direct" | "group";

export interface Conversation {
  _id: string;
  type: ConversationType;
  participants: User[];
  groupName?: string;
  groupAvatar?: string | null;
  groupAdmin?: string;
  lastMessage?: Message | null;
  lastActivity: string;
  mutedBy: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  // derived
  unreadCount?: number;
  typingUsers?: string[];
}

// ── API ───────────────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: { msg: string; path: string }[];
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface PaginatedMessages {
  messages: Message[];
  nextCursor: string | null;
}

// ── Socket events ─────────────────────────────────────────────────────────────
export interface TypingEvent {
  userId: string;
  conversationId: string;
}

export interface PresenceEvent {
  userId: string;
  lastSeen?: string;
}

export interface ReadEvent {
  conversationId: string;
  userId: string;
  readAt: string;
}

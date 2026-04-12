import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { config } from "../config/env";
import { verifyAccessToken } from "../shared/utils/jwt";
import { userService } from "../features/users/user.service";
import { messageService } from "../features/messages/message.service";
import { conversationService } from "../features/conversations/conversation.service";
import type { IMessage } from "../features/messages/message.model";

// Types

interface AuthSocket extends Socket {
  userId?: string;
  username?: string;
}
// Online of offline user
const onlineUsers = new Map<string, Set<string>>();

const addSocket = (userId: string, socketId: string): void => {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId)!.add(socketId);
};

const removeSocket = (userId: string, socketId: string): boolean => {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return false;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlineUsers.delete(userId);
    return true; // truly offline now
  }
  return false;
};

// Typing
const TYPING_TIMEOUT_MS = 3_000;
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

const typingKey = (socketId: string, conversationId: string) =>
  `${socketId} || ${conversationId}`;

// Per socket rate limit
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 5_000;
const messageRateLimits = new Map<string, { count: number; resetAt: number }>();

const isRateLimited = (socketId: string): boolean => {
  const now = Date.now();
  const bucket = messageRateLimits.get(socketId);

  if (!bucket || now >= bucket.resetAt) {
    messageRateLimits.set(socketId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (bucket.count >= RATE_LIMIT_MAX) return true;
  bucket.count++;
  return false;
};

// Logger helper
const log = {
  info: (msg: string, meta?: object) =>
    console.info(JSON.stringify({ level: "info", msg, ...meta })),
  warn: (msg: string, meta?: object) =>
    console.warn(JSON.stringify({ level: "warn", msg, ...meta })),
  error: (msg: string, meta?: object) =>
    console.error(JSON.stringify({ level: "error", msg, ...meta })),
};

// Main init

let _io: Server | null = null;

export const initSocket = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingInterval: 25_000,
    pingTimeout: 20_000,
  });

  // Auth middleware(Auth socket)

  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Authentication required"));

    try {
      const payload = verifyAccessToken(token);
      socket.userId = payload.userId;
      socket.username = payload.email;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  _io = io;

  // Connection

  io.on("connection", async (socket: AuthSocket) => {
    const userId = socket.userId!;
    const wasOffline = !onlineUsers.has(userId);
    addSocket(userId, socket.id);
    socket.join(userId);

    if (wasOffline) {
      await userService
        .updateStatus(userId, "online")
        .catch((err) =>
          log.error("updateStatus online failed", { userId, err }),
        );
      // Broadcast to everyone else that this user came online
      socket.broadcast.emit("user:online", { userId });
    }

    log.info("socket connected", { userId, socketId: socket.id });
    const joinConversationRooms = async (): Promise<void> => {
      try {
        const conversations =
          await conversationService.getUserConversations(userId);
        conversations.forEach((c) => socket.join(c._id.toString()));
      } catch (err) {
        log.error("joinConversationRooms failed", { userId, err });
        socket.emit("error", { message: "Failed to join conversation rooms" });
      }
    };

    await joinConversationRooms();
    socket.on("conversations:join", joinConversationRooms);

    // Messaging

    socket.on(
      "message:send",
      async (data: {
        conversationId: string;
        content?: string;
        type?: IMessage["type"];
        replyTo?: string;
      }) => {
        if (isRateLimited(socket.id)) {
          socket.emit("message:error", {
            error: "Rate limit exceeded. Slow down.",
          });
          return;
        }

        try {
          const message = await messageService.send({
            conversationId: data.conversationId,
            senderId: userId,
            type: data.type ?? "text",
            content: data.content ?? "",
            replyTo: data.replyTo,
          });
          io.to(data.conversationId).emit("message:new", message);
          await messageService.markDelivered(data.conversationId, userId);
          io.to(data.conversationId).emit("message:delivered", {
            messageId: message._id,
            conversationId: data.conversationId,
            deliveredAt: new Date(),
          });
        } catch (err) {
          log.error("message:send failed", { userId, data, err });
          socket.emit("message:error", { error: "Failed to send message" });
        }
      },
    );

    socket.on("message:read", async (data: { conversationId: string }) => {
      try {
        await messageService.markRead(data.conversationId, userId);
        io.to(data.conversationId).emit("message:read", {
          conversationId: data.conversationId,
          userId,
          readAt: new Date(),
        });
      } catch (err) {
        log.error("message:read failed", {
          userId,
          conversationId: data.conversationId,
          err,
        });
      }
    });

    socket.on(
      "message:edit",
      async (data: {
        messageId: string;
        content: string;
        conversationId: string;
      }) => {
        try {
          const updated = await messageService.editMessage(
            data.messageId,
            userId,
            data.content,
          );
          io.to(data.conversationId).emit("message:edited", updated);
        } catch (err) {
          log.error("message:edit failed", { userId, data, err });
          socket.emit("message:error", { error: "Failed to edit message" });
        }
      },
    );

    socket.on(
      "message:delete",
      async (data: {
        messageId: string;
        conversationId: string;
        scope: "me" | "all";
      }) => {
        try {
          if (data.scope === "all") {
            await messageService.deleteForEveryone(data.messageId, userId);
            io.to(data.conversationId).emit("message:deleted", {
              messageId: data.messageId,
              conversationId: data.conversationId,
            });
          } else {
            await messageService.deleteForMe(data.messageId, userId);
            // Only the requesting socket sees this deletion
            socket.emit("message:deleted", {
              messageId: data.messageId,
              conversationId: data.conversationId,
            });
          }
        } catch (err) {
          log.error("message:delete failed", { userId, data, err });
          socket.emit("message:error", { error: "Failed to delete message" });
        }
      },
    );

    // Typing indicators
    socket.on("typing:start", (data: { conversationId: string }) => {
      const key = typingKey(socket.id, data.conversationId);
      const alreadyTyping = typingTimers.has(key);

      // Reset (or start) the auto-stop timer
      if (alreadyTyping) clearTimeout(typingTimers.get(key)!);

      typingTimers.set(
        key,
        setTimeout(() => {
          typingTimers.delete(key);
          socket.to(data.conversationId).emit("typing:stop", {
            userId,
            conversationId: data.conversationId,
          });
        }, TYPING_TIMEOUT_MS),
      );

      // Only broadcast when typing begins, not on every keystroke
      if (!alreadyTyping) {
        socket.to(data.conversationId).emit("typing:start", {
          userId,
          conversationId: data.conversationId,
        });
      }
    });

    socket.on("typing:stop", (data: { conversationId: string }) => {
      const key = typingKey(socket.id, data.conversationId);
      const timer = typingTimers.get(key);
      if (timer) {
        clearTimeout(timer);
        typingTimers.delete(key);
      }
      socket
        .to(data.conversationId)
        .emit("typing:stop", { userId, conversationId: data.conversationId });
    });

    socket.on("conversation:join", (conversationId: string) => {
      socket.join(conversationId);
    });

    socket.on("conversation:leave", (conversationId: string) => {
      socket.leave(conversationId);
    });

    // Disconnect

    socket.on("disconnect", async (reason) => {
      // Clean up any active typing timers for this socket
      for (const [key, timer] of typingTimers) {
        if (key.startsWith(socket.id + "||")) {
          clearTimeout(timer);
          typingTimers.delete(key);
        }
      }

      // Clean up rate-limit bucket
      messageRateLimits.delete(socket.id);
      const isNowOffline = removeSocket(userId, socket.id);

      if (isNowOffline) {
        await userService
          .updateStatus(userId, "offline")
          .catch((err) =>
            log.error("updateStatus offline failed", { userId, err }),
          );
        socket.broadcast.emit("user:offline", {
          userId,
          lastSeen: new Date(),
        });
      }

      log.info("socket disconnected", { userId, socketId: socket.id, reason });
    });
  });

  return io;
};

// Exports

export const getIO = (): Server => {
  if (!_io) throw new Error("Socket.io not initialized");
  return _io;
};

export const isUserOnline = (userId: string): boolean =>
  onlineUsers.has(userId);

/** All currently online user IDs */
export const getOnlineUsers = (): string[] => Array.from(onlineUsers.keys());

/** How many active sockets a user has (useful for debugging multi-tab) */
export const getUserSocketCount = (userId: string): number =>
  onlineUsers.get(userId)?.size ?? 0;

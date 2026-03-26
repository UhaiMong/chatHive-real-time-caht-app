import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config/env';
import { verifyAccessToken } from '../shared/utils/jwt';
import { userService } from '../features/users/user.service';
import { messageService } from '../features/messages/message.service';
import { conversationService } from '../features/conversations/conversation.service';

interface AuthSocket extends Socket {
  userId?: string;
  username?: string;
}

// In-memory map: userId → socketId (supports single device; extend to Set for multi-device)
const onlineUsers = new Map<string, string>();

export const initSocket = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // ── Auth middleware ──────────────────────────────────────────────────────────
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Authentication required'));

    try {
      const payload = verifyAccessToken(token);
      socket.userId = payload.userId;
      socket.username = payload.email;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ── Connection ───────────────────────────────────────────────────────────────
  io.on('connection', async (socket: AuthSocket) => {
    const userId = socket.userId!;
    onlineUsers.set(userId, socket.id);

    // Update DB status
    await userService.updateStatus(userId, 'online');

    // Join personal room for direct notifications
    socket.join(userId);

    // Broadcast presence to all
    socket.broadcast.emit('user:online', { userId });

    console.log(`🔌 Connected: ${userId}`);

    // ── Join conversation rooms ────────────────────────────────────────────────
    socket.on('conversations:join', async () => {
      try {
        const conversations = await conversationService.getUserConversations(userId);
        conversations.forEach(c => socket.join(c._id.toString()));
      } catch (err) {
        socket.emit('error', { message: 'Failed to join rooms' });
      }
    });

    // ── Messaging ─────────────────────────────────────────────────────────────
    socket.on(
      'message:send',
      async (data: {
        conversationId: string;
        content?: string;
        type?: string;
        replyTo?: string;
      }) => {
        try {
          const message = await messageService.send({
            conversationId: data.conversationId,
            senderId: userId,
            type: (data.type as IMessage['type']) ?? 'text',
            content: data.content ?? '',
            replyTo: data.replyTo,
          });

          // Emit to all in conversation room
          io.to(data.conversationId).emit('message:new', message);

          // Mark delivered for online participants
          await messageService.markDelivered(data.conversationId, userId);
        } catch (err) {
          socket.emit('message:error', { error: 'Failed to send message' });
        }
      }
    );

    socket.on('message:read', async (data: { conversationId: string }) => {
      try {
        await messageService.markRead(data.conversationId, userId);
        io.to(data.conversationId).emit('message:read', {
          conversationId: data.conversationId,
          userId,
          readAt: new Date(),
        });
      } catch {
        // silent
      }
    });

    socket.on(
      'message:edit',
      async (data: { messageId: string; content: string; conversationId: string }) => {
        try {
          const updated = await messageService.editMessage(data.messageId, userId, data.content);
          io.to(data.conversationId).emit('message:edited', updated);
        } catch (err) {
          socket.emit('message:error', { error: 'Failed to edit message' });
        }
      }
    );

    socket.on(
      'message:delete',
      async (data: { messageId: string; conversationId: string; scope: 'me' | 'all' }) => {
        try {
          if (data.scope === 'all') {
            await messageService.deleteForEveryone(data.messageId, userId);
            io.to(data.conversationId).emit('message:deleted', {
              messageId: data.messageId,
              conversationId: data.conversationId,
            });
          } else {
            await messageService.deleteForMe(data.messageId, userId);
            socket.emit('message:deleted', {
              messageId: data.messageId,
              conversationId: data.conversationId,
            });
          }
        } catch (err) {
          socket.emit('message:error', { error: 'Failed to delete message' });
        }
      }
    );

    // ── Typing indicators ─────────────────────────────────────────────────────
    socket.on('typing:start', (data: { conversationId: string }) => {
      socket.to(data.conversationId).emit('typing:start', { userId, conversationId: data.conversationId });
    });

    socket.on('typing:stop', (data: { conversationId: string }) => {
      socket.to(data.conversationId).emit('typing:stop', { userId, conversationId: data.conversationId });
    });

    // ── Conversation management ───────────────────────────────────────────────
    socket.on('conversation:join', (conversationId: string) => {
      socket.join(conversationId);
    });

    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(conversationId);
    });

    // ── Disconnection ─────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      await userService.updateStatus(userId, 'offline');
      socket.broadcast.emit('user:offline', { userId, lastSeen: new Date() });
      console.log(`🔌 Disconnected: ${userId}`);
    });
  });

  return io;
};

// Helper to check if user is online (used by other services if needed)
export const isUserOnline = (userId: string): boolean => onlineUsers.has(userId);
export const getOnlineUsers = (): string[] => Array.from(onlineUsers.keys());

// Import type for convenience
import type { IMessage } from '../features/messages/message.model';

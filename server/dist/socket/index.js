"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserSocketCount = exports.getOnlineUsers = exports.isUserOnline = exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const env_1 = require("../config/env");
const jwt_1 = require("../shared/utils/jwt");
const user_service_1 = require("../features/users/user.service");
const message_service_1 = require("../features/messages/message.service");
const conversation_service_1 = require("../features/conversations/conversation.service");
// Online of offline user
const onlineUsers = new Map();
const addSocket = (userId, socketId) => {
    if (!onlineUsers.has(userId))
        onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socketId);
};
const removeSocket = (userId, socketId) => {
    const sockets = onlineUsers.get(userId);
    if (!sockets)
        return false;
    sockets.delete(socketId);
    if (sockets.size === 0) {
        onlineUsers.delete(userId);
        return true; // truly offline now
    }
    return false;
};
// Typing
const TYPING_TIMEOUT_MS = 3_000;
const typingTimers = new Map();
const typingKey = (socketId, conversationId) => `${socketId} || ${conversationId}`;
// Per socket rate limit
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 5_000;
const messageRateLimits = new Map();
const isRateLimited = (socketId) => {
    const now = Date.now();
    const bucket = messageRateLimits.get(socketId);
    if (!bucket || now >= bucket.resetAt) {
        messageRateLimits.set(socketId, {
            count: 1,
            resetAt: now + RATE_LIMIT_WINDOW_MS,
        });
        return false;
    }
    if (bucket.count >= RATE_LIMIT_MAX)
        return true;
    bucket.count++;
    return false;
};
// Logger helper
const log = {
    info: (msg, meta) => console.info(JSON.stringify({ level: "info", msg, ...meta })),
    warn: (msg, meta) => console.warn(JSON.stringify({ level: "warn", msg, ...meta })),
    error: (msg, meta) => console.error(JSON.stringify({ level: "error", msg, ...meta })),
};
// Main init
let _io = null;
const initSocket = (httpServer) => {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: env_1.config.clientUrl,
            credentials: true,
        },
        transports: ["websocket", "polling"],
        pingInterval: 25_000,
        pingTimeout: 20_000,
    });
    // Auth middleware(Auth socket)
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token)
            return next(new Error("Authentication required"));
        try {
            const payload = (0, jwt_1.verifyAccessToken)(token);
            socket.userId = payload.userId;
            socket.username = payload.email;
            next();
        }
        catch {
            next(new Error("Invalid token"));
        }
    });
    _io = io;
    // Connection
    io.on("connection", async (socket) => {
        const userId = socket.userId;
        const wasOffline = !onlineUsers.has(userId);
        addSocket(userId, socket.id);
        socket.join(userId);
        if (wasOffline) {
            await user_service_1.userService
                .updateStatus(userId, "online")
                .catch((err) => log.error("updateStatus online failed", { userId, err }));
            // Broadcast to everyone else that this user came online
            socket.broadcast.emit("user:online", { userId });
        }
        log.info("socket connected", { userId, socketId: socket.id });
        const joinConversationRooms = async () => {
            try {
                const conversations = await conversation_service_1.conversationService.getUserConversations(userId);
                conversations.forEach((c) => socket.join(c._id.toString()));
            }
            catch (err) {
                log.error("joinConversationRooms failed", { userId, err });
                socket.emit("error", { message: "Failed to join conversation rooms" });
            }
        };
        await joinConversationRooms();
        socket.on("conversations:join", joinConversationRooms);
        // Messaging
        socket.on("message:send", async (data) => {
            if (isRateLimited(socket.id)) {
                socket.emit("message:error", {
                    error: "Rate limit exceeded. Slow down.",
                });
                return;
            }
            try {
                const message = await message_service_1.messageService.send({
                    conversationId: data.conversationId,
                    senderId: userId,
                    type: data.type ?? "text",
                    content: data.content ?? "",
                    replyTo: data.replyTo,
                });
                io.to(data.conversationId).emit("message:new", message);
                await message_service_1.messageService.markDelivered(data.conversationId, userId);
                io.to(data.conversationId).emit("message:delivered", {
                    messageId: message._id,
                    conversationId: data.conversationId,
                    deliveredAt: new Date(),
                });
            }
            catch (err) {
                log.error("message:send failed", { userId, data, err });
                socket.emit("message:error", { error: "Failed to send message" });
            }
        });
        socket.on("message:read", async (data) => {
            try {
                await message_service_1.messageService.markRead(data.conversationId, userId);
                io.to(data.conversationId).emit("message:read", {
                    conversationId: data.conversationId,
                    userId,
                    readAt: new Date(),
                });
            }
            catch (err) {
                log.error("message:read failed", {
                    userId,
                    conversationId: data.conversationId,
                    err,
                });
            }
        });
        socket.on("message:edit", async (data) => {
            try {
                const updated = await message_service_1.messageService.editMessage(data.messageId, userId, data.content);
                io.to(data.conversationId).emit("message:edited", updated);
            }
            catch (err) {
                log.error("message:edit failed", { userId, data, err });
                socket.emit("message:error", { error: "Failed to edit message" });
            }
        });
        socket.on("message:delete", async (data) => {
            try {
                if (data.scope === "all") {
                    await message_service_1.messageService.deleteForEveryone(data.messageId, userId);
                    io.to(data.conversationId).emit("message:deleted", {
                        messageId: data.messageId,
                        conversationId: data.conversationId,
                    });
                }
                else {
                    await message_service_1.messageService.deleteForMe(data.messageId, userId);
                    // Only the requesting socket sees this deletion
                    socket.emit("message:deleted", {
                        messageId: data.messageId,
                        conversationId: data.conversationId,
                    });
                }
            }
            catch (err) {
                log.error("message:delete failed", { userId, data, err });
                socket.emit("message:error", { error: "Failed to delete message" });
            }
        });
        // Typing indicators
        socket.on("typing:start", (data) => {
            const key = typingKey(socket.id, data.conversationId);
            const alreadyTyping = typingTimers.has(key);
            // Reset (or start) the auto-stop timer
            if (alreadyTyping)
                clearTimeout(typingTimers.get(key));
            typingTimers.set(key, setTimeout(() => {
                typingTimers.delete(key);
                socket.to(data.conversationId).emit("typing:stop", {
                    userId,
                    conversationId: data.conversationId,
                });
            }, TYPING_TIMEOUT_MS));
            // Only broadcast when typing begins, not on every keystroke
            if (!alreadyTyping) {
                socket.to(data.conversationId).emit("typing:start", {
                    userId,
                    conversationId: data.conversationId,
                });
            }
        });
        socket.on("typing:stop", (data) => {
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
        socket.on("conversation:join", (conversationId) => {
            socket.join(conversationId);
        });
        socket.on("conversation:leave", (conversationId) => {
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
                await user_service_1.userService
                    .updateStatus(userId, "offline")
                    .catch((err) => log.error("updateStatus offline failed", { userId, err }));
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
exports.initSocket = initSocket;
// Exports
const getIO = () => {
    if (!_io)
        throw new Error("Socket.io not initialized");
    return _io;
};
exports.getIO = getIO;
const isUserOnline = (userId) => onlineUsers.has(userId);
exports.isUserOnline = isUserOnline;
/** All currently online user IDs */
const getOnlineUsers = () => Array.from(onlineUsers.keys());
exports.getOnlineUsers = getOnlineUsers;
/** How many active sockets a user has (useful for debugging multi-tab) */
const getUserSocketCount = (userId) => onlineUsers.get(userId)?.size ?? 0;
exports.getUserSocketCount = getUserSocketCount;
//# sourceMappingURL=index.js.map
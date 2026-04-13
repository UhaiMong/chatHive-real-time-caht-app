"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchMessages = exports.deleteForEveryone = exports.deleteForMe = exports.editMessage = exports.markRead = exports.sendMessage = exports.getMessages = void 0;
// src/modules/message/message.controller.ts
const socket_1 = require("../../socket");
const mongoose_1 = require("mongoose");
const message_service_1 = require("./message.service");
const response_1 = require("../../shared/utils/response");
const AppError_1 = require("../../shared/utils/AppError");
// Constants
const ALLOWED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "audio/mpeg",
    "audio/ogg",
    "audio/wav",
    "audio/webm",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
]);
const MAX_SEARCH_QUERY_LENGTH = 200;
const MAX_MESSAGE_CONTENT_LENGTH = 5000;
const CURSOR_REGEX = /^[a-f\d]{24}$/i; // ObjectId as cursor
//  Guards
function requireObjectId(value, fieldName) {
    if (typeof value !== "string" || !(0, mongoose_1.isValidObjectId)(value)) {
        throw new AppError_1.AppError(`Invalid or missing ${fieldName}`, 400, AppError_1.ErrorCode.BAD_REQUEST);
    }
    return value;
}
function resolveMediaType(mimeType) {
    if (mimeType.startsWith("image/"))
        return "image";
    if (mimeType.startsWith("video/"))
        return "video";
    if (mimeType.startsWith("audio/"))
        return "audio";
    return "file";
}
function buildMediaPayload(file) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        throw new AppError_1.AppError(`Unsupported file type: ${file.mimetype}`, 415, AppError_1.ErrorCode.BAD_REQUEST);
    }
    return {
        url: `/uploads/${file.filename}`,
        type: resolveMediaType(file.mimetype),
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
    };
}
// Controllers
/**
 * GET /conversations/:conversationId/messages?cursor=<objectId>&limit=<n>
 * Returns paginated messages using cursor-based pagination.
 */
const getMessages = async (req, res, next) => {
    try {
        const userId = requireObjectId(req.user?.userId, "userId");
        const conversationId = requireObjectId(req.params.conversationId, "conversationId");
        const rawCursor = req.query.cursor;
        const cursor = typeof rawCursor === "string" && CURSOR_REGEX.test(rawCursor)
            ? rawCursor
            : undefined;
        if (rawCursor !== undefined && cursor === undefined) {
            throw new AppError_1.AppError("Invalid cursor format", 400, AppError_1.ErrorCode.BAD_REQUEST);
        }
        const result = await message_service_1.messageService.getMessages(conversationId, userId, cursor);
        (0, response_1.sendSuccess)(res, result, "Messages fetched", 200);
    }
    catch (err) {
        next(err);
    }
};
exports.getMessages = getMessages;
/**
 * POST /conversations/:conversationId/messages
 * Sends a new message (text or media via multipart/form-data).
 */
const sendMessage = async (req, res, next) => {
    try {
        const userId = requireObjectId(req.user?.userId, "userId");
        const conversationId = requireObjectId(req.params.conversationId, "conversationId");
        const { content, replyTo } = req.body;
        // Build media payload from uploaded file (if any)
        const media = req.file
            ? buildMediaPayload(req.file)
            : undefined;
        // A message must have either content or a media attachment
        const trimmedContent = content?.trim() ?? "";
        if (!media && trimmedContent.length === 0) {
            throw new AppError_1.AppError("Message must contain content or a media attachment", 400, AppError_1.ErrorCode.BAD_REQUEST);
        }
        if (trimmedContent.length > MAX_MESSAGE_CONTENT_LENGTH) {
            throw new AppError_1.AppError(`Message content must be ${MAX_MESSAGE_CONTENT_LENGTH} characters or fewer`, 400, AppError_1.ErrorCode.BAD_REQUEST);
        }
        // Validate optional replyTo reference
        if (replyTo !== undefined && !(0, mongoose_1.isValidObjectId)(replyTo)) {
            throw new AppError_1.AppError("Invalid replyTo message ID", 400, AppError_1.ErrorCode.BAD_REQUEST);
        }
        const message = await message_service_1.messageService.send({
            conversationId,
            senderId: userId,
            type: media ? media.type : "text",
            content: trimmedContent,
            media,
            replyTo,
        });
        (0, socket_1.getIO)().to(req.params.conversationId).emit("message:new", message);
        (0, response_1.sendSuccess)(res, message, "Message sent", 201);
    }
    catch (err) {
        next(err);
    }
};
exports.sendMessage = sendMessage;
/**
 * PATCH /conversations/:conversationId/messages/read
 * Marks all unread messages in a conversation as read for the current user.
 */
const markRead = async (req, res, next) => {
    try {
        const userId = requireObjectId(req.user?.userId, "userId");
        const conversationId = requireObjectId(req.params.conversationId, "conversationId");
        await message_service_1.messageService.markRead(conversationId, userId);
        (0, response_1.sendSuccess)(res, null, "Conversation marked as read", 200);
    }
    catch (err) {
        next(err);
    }
};
exports.markRead = markRead;
/**
 * PATCH /messages/:messageId
 * Edits the text content of a message (sender only, text messages only).
 */
const editMessage = async (req, res, next) => {
    try {
        const userId = requireObjectId(req.user?.userId, "userId");
        const messageId = requireObjectId(req.params.messageId, "messageId");
        const { content } = req.body;
        if (typeof content !== "string" || content.trim().length === 0) {
            throw new AppError_1.AppError("Edited content must be a non-empty string", 400, AppError_1.ErrorCode.BAD_REQUEST);
        }
        if (content.trim().length > MAX_MESSAGE_CONTENT_LENGTH) {
            throw new AppError_1.AppError(`Message content must be ${MAX_MESSAGE_CONTENT_LENGTH} characters or fewer`, 400, AppError_1.ErrorCode.BAD_REQUEST);
        }
        const message = await message_service_1.messageService.editMessage(messageId, userId, content.trim());
        (0, response_1.sendSuccess)(res, message, "Message edited", 200);
    }
    catch (err) {
        next(err);
    }
};
exports.editMessage = editMessage;
/**
 * DELETE /messages/:messageId/for-me
 * Soft-deletes a message for the current user only.
 */
const deleteForMe = async (req, res, next) => {
    try {
        const userId = requireObjectId(req.user?.userId, "userId");
        const messageId = requireObjectId(req.params.messageId, "messageId");
        await message_service_1.messageService.deleteForMe(messageId, userId);
        (0, response_1.sendSuccess)(res, null, "Message removed from your view", 200);
    }
    catch (err) {
        next(err);
    }
};
exports.deleteForMe = deleteForMe;
/**
 * DELETE /messages/:messageId/for-everyone
 * Hard-deletes (or tombstones) a message for all participants (sender only).
 */
const deleteForEveryone = async (req, res, next) => {
    try {
        const userId = requireObjectId(req.user?.userId, "userId");
        const messageId = requireObjectId(req.params.messageId, "messageId");
        await message_service_1.messageService.deleteForEveryone(messageId, userId);
        (0, response_1.sendSuccess)(res, null, "Message deleted for everyone", 200);
    }
    catch (err) {
        next(err);
    }
};
exports.deleteForEveryone = deleteForEveryone;
/**
 * GET /conversations/:conversationId/messages/search?q=<term>
 * Full-text search within a conversation the user is a member of.
 */
const searchMessages = async (req, res, next) => {
    try {
        const userId = requireObjectId(req.user?.userId, "userId");
        const conversationId = requireObjectId(req.params.conversationId, "conversationId");
        const rawQuery = req.query.q;
        if (typeof rawQuery !== "string" || rawQuery.trim().length === 0) {
            throw new AppError_1.AppError("Search query `q` is required", 400, AppError_1.ErrorCode.BAD_REQUEST);
        }
        if (rawQuery.trim().length > MAX_SEARCH_QUERY_LENGTH) {
            throw new AppError_1.AppError(`Search query must be ${MAX_SEARCH_QUERY_LENGTH} characters or fewer`, 400, AppError_1.ErrorCode.BAD_REQUEST);
        }
        const messages = await message_service_1.messageService.searchMessages(conversationId, userId, rawQuery.trim());
        (0, response_1.sendSuccess)(res, messages, "Search results", 200);
    }
    catch (err) {
        next(err);
    }
};
exports.searchMessages = searchMessages;
//# sourceMappingURL=message.controller.js.map
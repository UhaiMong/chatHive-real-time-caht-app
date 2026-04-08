// src/modules/message/message.controller.ts

import { Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";
import { AuthRequest } from "../../shared/types";
import { messageService } from "./message.service";
import { sendSuccess } from "../../shared/utils/response";
import { AppError, ErrorCode } from "../../shared/utils/AppError";

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── DTOs ─────────────────────────────────────────────────────────────────────

type MediaType = "image" | "video" | "audio" | "file";

interface MediaPayload {
  url: string;
  type: MediaType;
  name: string;
  size: number;
  mimeType: string;
}

interface SendMessageBody {
  content?: string;
  replyTo?: string;
}

interface EditMessageBody {
  content: string;
}

// ─── Guards ───────────────────────────────────────────────────────────────────

function requireObjectId(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !isValidObjectId(value)) {
    throw new AppError(
      `Invalid or missing ${fieldName}`,
      400,
      ErrorCode.BAD_REQUEST,
    );
  }
  return value;
}

function resolveMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "file";
}

function buildMediaPayload(file: Express.Multer.File): MediaPayload {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new AppError(
      `Unsupported file type: ${file.mimetype}`,
      415,
      ErrorCode.BAD_REQUEST,
    );
  }

  return {
    url: `/uploads/${file.filename}`,
    type: resolveMediaType(file.mimetype),
    name: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
  };
}

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /conversations/:conversationId/messages?cursor=<objectId>&limit=<n>
 * Returns paginated messages using cursor-based pagination.
 */
export const getMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireObjectId(req.user?.userId, "userId");
    const conversationId = requireObjectId(
      req.params.conversationId,
      "conversationId",
    );

    const rawCursor = req.query.cursor;
    const cursor =
      typeof rawCursor === "string" && CURSOR_REGEX.test(rawCursor)
        ? rawCursor
        : undefined;

    if (rawCursor !== undefined && cursor === undefined) {
      throw new AppError("Invalid cursor format", 400, ErrorCode.BAD_REQUEST);
    }

    const result = await messageService.getMessages(
      conversationId,
      userId,
      cursor,
    );
    sendSuccess(res, result, "Messages fetched", 200);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /conversations/:conversationId/messages
 * Sends a new message (text or media via multipart/form-data).
 */
export const sendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireObjectId(req.user?.userId, "userId");
    const conversationId = requireObjectId(
      req.params.conversationId,
      "conversationId",
    );
    const { content, replyTo } = req.body as SendMessageBody;

    // Build media payload from uploaded file (if any)
    const media: MediaPayload | undefined = req.file
      ? buildMediaPayload(req.file)
      : undefined;

    // A message must have either content or a media attachment
    const trimmedContent = content?.trim() ?? "";
    if (!media && trimmedContent.length === 0) {
      throw new AppError(
        "Message must contain content or a media attachment",
        400,
        ErrorCode.BAD_REQUEST,
      );
    }

    if (trimmedContent.length > MAX_MESSAGE_CONTENT_LENGTH) {
      throw new AppError(
        `Message content must be ${MAX_MESSAGE_CONTENT_LENGTH} characters or fewer`,
        400,
        ErrorCode.BAD_REQUEST,
      );
    }

    // Validate optional replyTo reference
    if (replyTo !== undefined && !isValidObjectId(replyTo)) {
      throw new AppError(
        "Invalid replyTo message ID",
        400,
        ErrorCode.BAD_REQUEST,
      );
    }

    const message = await messageService.send({
      conversationId,
      senderId: userId,
      type: media ? media.type : "text",
      content: trimmedContent,
      media,
      replyTo,
    });

    sendSuccess(res, message, "Message sent", 201);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /conversations/:conversationId/messages/read
 * Marks all unread messages in a conversation as read for the current user.
 */
export const markRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireObjectId(req.user?.userId, "userId");
    const conversationId = requireObjectId(
      req.params.conversationId,
      "conversationId",
    );

    await messageService.markRead(conversationId, userId);
    sendSuccess(res, null, "Conversation marked as read", 200);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /messages/:messageId
 * Edits the text content of a message (sender only, text messages only).
 */
export const editMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireObjectId(req.user?.userId, "userId");
    const messageId = requireObjectId(req.params.messageId, "messageId");
    const { content } = req.body as EditMessageBody;

    if (typeof content !== "string" || content.trim().length === 0) {
      throw new AppError(
        "Edited content must be a non-empty string",
        400,
        ErrorCode.BAD_REQUEST,
      );
    }

    if (content.trim().length > MAX_MESSAGE_CONTENT_LENGTH) {
      throw new AppError(
        `Message content must be ${MAX_MESSAGE_CONTENT_LENGTH} characters or fewer`,
        400,
        ErrorCode.BAD_REQUEST,
      );
    }

    const message = await messageService.editMessage(
      messageId,
      userId,
      content.trim(),
    );
    sendSuccess(res, message, "Message edited", 200);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /messages/:messageId/for-me
 * Soft-deletes a message for the current user only.
 */
export const deleteForMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireObjectId(req.user?.userId, "userId");
    const messageId = requireObjectId(req.params.messageId, "messageId");

    await messageService.deleteForMe(messageId, userId);
    sendSuccess(res, null, "Message removed from your view", 200);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /messages/:messageId/for-everyone
 * Hard-deletes (or tombstones) a message for all participants (sender only).
 */
export const deleteForEveryone = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireObjectId(req.user?.userId, "userId");
    const messageId = requireObjectId(req.params.messageId, "messageId");

    await messageService.deleteForEveryone(messageId, userId);
    sendSuccess(res, null, "Message deleted for everyone", 200);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /conversations/:conversationId/messages/search?q=<term>
 * Full-text search within a conversation the user is a member of.
 */
export const searchMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireObjectId(req.user?.userId, "userId");
    const conversationId = requireObjectId(
      req.params.conversationId,
      "conversationId",
    );

    const rawQuery = req.query.q;
    if (typeof rawQuery !== "string" || rawQuery.trim().length === 0) {
      throw new AppError(
        "Search query `q` is required",
        400,
        ErrorCode.BAD_REQUEST,
      );
    }

    if (rawQuery.trim().length > MAX_SEARCH_QUERY_LENGTH) {
      throw new AppError(
        `Search query must be ${MAX_SEARCH_QUERY_LENGTH} characters or fewer`,
        400,
        ErrorCode.BAD_REQUEST,
      );
    }

    const messages = await messageService.searchMessages(
      conversationId,
      userId,
      rawQuery.trim(),
    );
    sendSuccess(res, messages, "Search results", 200);
  } catch (err) {
    next(err);
  }
};

import { Response, NextFunction } from "express";
import { AuthRequest } from "../../shared/types";
/**
 * GET /conversations/:conversationId/messages?cursor=<objectId>&limit=<n>
 * Returns paginated messages using cursor-based pagination.
 */
export declare const getMessages: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /conversations/:conversationId/messages
 * Sends a new message (text or media via multipart/form-data).
 */
export declare const sendMessage: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * PATCH /conversations/:conversationId/messages/read
 * Marks all unread messages in a conversation as read for the current user.
 */
export declare const markRead: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * PATCH /messages/:messageId
 * Edits the text content of a message (sender only, text messages only).
 */
export declare const editMessage: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * DELETE /messages/:messageId/for-me
 * Soft-deletes a message for the current user only.
 */
export declare const deleteForMe: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * DELETE /messages/:messageId/for-everyone
 * Hard-deletes (or tombstones) a message for all participants (sender only).
 */
export declare const deleteForEveryone: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /conversations/:conversationId/messages/search?q=<term>
 * Full-text search within a conversation the user is a member of.
 */
export declare const searchMessages: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=message.controller.d.ts.map
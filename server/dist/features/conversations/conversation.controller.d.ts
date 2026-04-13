import { Response, NextFunction } from "express";
import { AuthRequest } from "../../shared/types";
/**
 * GET /conversations
 */
export declare const getMyConversations: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /conversations/direct/:userId
 * Returns an existing direct conversation with the target user,
 * or creates one if none exists.
 */
export declare const getOrCreateDirect: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /conversations/group
 * Creates a new group conversation.
 */
export declare const createGroup: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /conversations/:conversationId
 * Returns a single conversation by ID (must be a participant).
 */
export declare const getConversation: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * PATCH /conversations/:conversationId
 * Updates a group conversation's metadata (admin only).
 */
export declare const updateGroup: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /conversations/:conversationId/participants
 * Adds new participants to a group (admin only).
 */
export declare const addParticipants: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * DELETE /conversations/:conversationId/participants/:userId
 * Removes a participant from a group (admin only).
 */
export declare const removeParticipant: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * DELETE /conversations/:conversationId/leave
 * Allows the authenticated user to leave a group conversation.
 */
export declare const leaveGroup: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=conversation.controller.d.ts.map
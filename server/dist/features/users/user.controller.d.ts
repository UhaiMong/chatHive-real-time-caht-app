import { Response, NextFunction } from "express";
import { AuthRequest } from "../../shared/types";
/**
 * GET /users/:userId?
 * Returns the profile of a specific user, or the authenticated user if
 * no :userId param is provided.
 */
export declare const getProfile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * PATCH /users/me
 * Updates the authenticated user's own profile (username, bio, avatar).
 * Avatar is optional and uploaded via multipart/form-data.
 */
export declare const updateProfile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /users/search?q=<term>
 * Searches for users by username or display name,
 * excluding the authenticated user from results.
 */
export declare const searchUsers: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /users/:userId/block
 * Blocks a user. Cannot block yourself.
 */
export declare const blockUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * DELETE /users/:userId/block
 * Unblocks a previously blocked user. Cannot unblock yourself.
 */
export declare const unblockUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=user.controller.d.ts.map
// src/modules/user/user.controller.ts

import { Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";
import { AuthRequest } from "../../shared/types";
import { userService } from "./user.service";
import { sendSuccess } from "../../shared/utils/response";
import { AppError, ErrorCode } from "../../shared/utils/AppError";

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_AVATAR_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,30}$/;
const MAX_BIO_LENGTH = 300;
const MAX_SEARCH_LENGTH = 100;

// ─── DTOs ─────────────────────────────────────────────────────────────────────

interface UpdateProfileBody {
  username?: string;
  bio?: string;
}

interface ProfileUpdates {
  username?: string;
  bio?: string;
  avatar?: string;
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

function validateAvatarFile(file: Express.Multer.File): string {
  if (!ALLOWED_AVATAR_MIME_TYPES.has(file.mimetype)) {
    throw new AppError(
      `Avatar must be a JPEG, PNG, WebP, or GIF. Received: ${file.mimetype}`,
      415,
      ErrorCode.BAD_REQUEST,
    );
  }
  return `/uploads/${file.filename}`;
}

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /users/:userId?
 * Returns the profile of a specific user, or the authenticated user if
 * no :userId param is provided.
 */
export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const currentUserId = requireObjectId(req.user?.userId, "userId");

    // Fall back to the authenticated user's own profile if no param given
    const targetId = req.params.userId ?? currentUserId;
    const validatedTargetId = requireObjectId(targetId, "params.userId");

    const user = await userService.getProfile(validatedTargetId);
    sendSuccess(res, user, "Profile fetched", 200);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /users/me
 * Updates the authenticated user's own profile (username, bio, avatar).
 * Avatar is optional and uploaded via multipart/form-data.
 */
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const currentUserId = requireObjectId(req.user?.userId, "userId");
    const { username, bio } = req.body as UpdateProfileBody;

    const updates: ProfileUpdates = {};

    // ── username ──────────────────────────────────────────────────────────
    if (username !== undefined) {
      if (
        typeof username !== "string" ||
        !USERNAME_REGEX.test(username.trim())
      ) {
        throw new AppError(
          "Username must be 3–30 characters and contain only letters, numbers, underscores, dots, or hyphens",
          400,
          ErrorCode.BAD_REQUEST,
        );
      }
      updates.username = username.trim().toLowerCase();
    }

    // ── bio ───────────────────────────────────────────────────────────────
    if (bio !== undefined) {
      if (typeof bio !== "string") {
        throw new AppError("Bio must be a string", 400, ErrorCode.BAD_REQUEST);
      }
      if (bio.length > MAX_BIO_LENGTH) {
        throw new AppError(
          `Bio must be ${MAX_BIO_LENGTH} characters or fewer`,
          400,
          ErrorCode.BAD_REQUEST,
        );
      }
      // Allow explicit empty string to clear bio
      updates.bio = bio.trim();
    }

    // ── avatar (multipart upload) ─────────────────────────────────────────
    if (req.file) {
      updates.avatar = validateAvatarFile(req.file);
    }

    // Reject no-op requests
    if (Object.keys(updates).length === 0) {
      throw new AppError(
        "No updatable fields provided",
        400,
        ErrorCode.BAD_REQUEST,
      );
    }

    const user = await userService.updateProfile(currentUserId, updates);
    sendSuccess(res, user, "Profile updated", 200);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /users/search?q=<term>
 * Searches for users by username or display name,
 * excluding the authenticated user from results.
 */
export const searchUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const currentUserId = requireObjectId(req.user?.userId, "userId");
    const rawQuery = req.query.q;

    if (typeof rawQuery !== "string" || rawQuery.trim().length === 0) {
      throw new AppError(
        "Search query `q` is required",
        400,
        ErrorCode.BAD_REQUEST,
      );
    }

    if (rawQuery.trim().length > MAX_SEARCH_LENGTH) {
      throw new AppError(
        `Search query must be ${MAX_SEARCH_LENGTH} characters or fewer`,
        400,
        ErrorCode.BAD_REQUEST,
      );
    }

    const users = await userService.searchUsers(rawQuery.trim(), currentUserId);
    sendSuccess(res, users, "Search results", 200);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /users/:userId/block
 * Blocks a user. Cannot block yourself.
 */
export const blockUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const currentUserId = requireObjectId(req.user?.userId, "userId");
    const targetUserId = requireObjectId(req.params.userId, "params.userId");

    if (currentUserId === targetUserId) {
      throw new AppError(
        "You cannot block yourself",
        400,
        ErrorCode.BAD_REQUEST,
      );
    }

    await userService.blockUser(currentUserId, targetUserId);
    sendSuccess(res, null, "User blocked", 200);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /users/:userId/block
 * Unblocks a previously blocked user. Cannot unblock yourself.
 */
export const unblockUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const currentUserId = requireObjectId(req.user?.userId, "userId");
    const targetUserId = requireObjectId(req.params.userId, "params.userId");

    if (currentUserId === targetUserId) {
      throw new AppError(
        "You cannot unblock yourself",
        400,
        ErrorCode.BAD_REQUEST,
      );
    }

    await userService.unblockUser(currentUserId, targetUserId);
    sendSuccess(res, null, "User unblocked", 200);
  } catch (err) {
    next(err);
  }
};

"use strict";
// src/modules/user/user.controller.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.unblockUser = exports.blockUser = exports.searchUsers = exports.updateProfile = exports.getProfile = void 0;
const mongoose_1 = require("mongoose");
const user_service_1 = require("./user.service");
const response_1 = require("../../shared/utils/response");
const AppError_1 = require("../../shared/utils/AppError");
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
// ─── Guards ───────────────────────────────────────────────────────────────────
function requireObjectId(value, fieldName) {
    if (typeof value !== "string" || !(0, mongoose_1.isValidObjectId)(value)) {
        throw new AppError_1.AppError(`Invalid or missing ${fieldName}`, 400, AppError_1.ErrorCode.BAD_REQUEST);
    }
    return value;
}
function validateAvatarFile(file) {
    if (!ALLOWED_AVATAR_MIME_TYPES.has(file.mimetype)) {
        throw new AppError_1.AppError(`Avatar must be a JPEG, PNG, WebP, or GIF. Received: ${file.mimetype}`, 415, AppError_1.ErrorCode.BAD_REQUEST);
    }
    return `/uploads/${file.filename}`;
}
// ─── Controllers ──────────────────────────────────────────────────────────────
/**
 * GET /users/:userId?
 * Returns the profile of a specific user, or the authenticated user if
 * no :userId param is provided.
 */
const getProfile = async (req, res, next) => {
    try {
        const currentUserId = requireObjectId(req.user?.userId, "userId");
        // Fall back to the authenticated user's own profile if no param given
        const targetId = req.params.userId ?? currentUserId;
        const validatedTargetId = requireObjectId(targetId, "params.userId");
        const user = await user_service_1.userService.getProfile(validatedTargetId);
        (0, response_1.sendSuccess)(res, user, "Profile fetched", 200);
    }
    catch (err) {
        next(err);
    }
};
exports.getProfile = getProfile;
/**
 * PATCH /users/me
 * Updates the authenticated user's own profile (username, bio, avatar).
 * Avatar is optional and uploaded via multipart/form-data.
 */
const updateProfile = async (req, res, next) => {
    try {
        const currentUserId = requireObjectId(req.user?.userId, "userId");
        const { username, bio } = req.body;
        const updates = {};
        // ── username ──────────────────────────────────────────────────────────
        if (username !== undefined) {
            if (typeof username !== "string" ||
                !USERNAME_REGEX.test(username.trim())) {
                throw new AppError_1.AppError("Username must be 3–30 characters and contain only letters, numbers, underscores, dots, or hyphens", 400, AppError_1.ErrorCode.BAD_REQUEST);
            }
            updates.username = username.trim().toLowerCase();
        }
        // ── bio ───────────────────────────────────────────────────────────────
        if (bio !== undefined) {
            if (typeof bio !== "string") {
                throw new AppError_1.AppError("Bio must be a string", 400, AppError_1.ErrorCode.BAD_REQUEST);
            }
            if (bio.length > MAX_BIO_LENGTH) {
                throw new AppError_1.AppError(`Bio must be ${MAX_BIO_LENGTH} characters or fewer`, 400, AppError_1.ErrorCode.BAD_REQUEST);
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
            throw new AppError_1.AppError("No updatable fields provided", 400, AppError_1.ErrorCode.BAD_REQUEST);
        }
        const user = await user_service_1.userService.updateProfile(currentUserId, updates);
        (0, response_1.sendSuccess)(res, user, "Profile updated", 200);
    }
    catch (err) {
        next(err);
    }
};
exports.updateProfile = updateProfile;
/**
 * GET /users/search?q=<term>
 * Searches for users by username or display name,
 * excluding the authenticated user from results.
 */
const searchUsers = async (req, res, next) => {
    try {
        const currentUserId = requireObjectId(req.user?.userId, "userId");
        const rawQuery = req.query.q;
        if (typeof rawQuery !== "string" || rawQuery.trim().length === 0) {
            throw new AppError_1.AppError("Search query `q` is required", 400, AppError_1.ErrorCode.BAD_REQUEST);
        }
        if (rawQuery.trim().length > MAX_SEARCH_LENGTH) {
            throw new AppError_1.AppError(`Search query must be ${MAX_SEARCH_LENGTH} characters or fewer`, 400, AppError_1.ErrorCode.BAD_REQUEST);
        }
        const users = await user_service_1.userService.searchUsers(rawQuery.trim(), currentUserId);
        (0, response_1.sendSuccess)(res, users, "Search results", 200);
    }
    catch (err) {
        next(err);
    }
};
exports.searchUsers = searchUsers;
/**
 * POST /users/:userId/block
 * Blocks a user. Cannot block yourself.
 */
const blockUser = async (req, res, next) => {
    try {
        const currentUserId = requireObjectId(req.user?.userId, "userId");
        const targetUserId = requireObjectId(req.params.userId, "params.userId");
        if (currentUserId === targetUserId) {
            throw new AppError_1.AppError("You cannot block yourself", 400, AppError_1.ErrorCode.BAD_REQUEST);
        }
        await user_service_1.userService.blockUser(currentUserId, targetUserId);
        (0, response_1.sendSuccess)(res, null, "User blocked", 200);
    }
    catch (err) {
        next(err);
    }
};
exports.blockUser = blockUser;
/**
 * DELETE /users/:userId/block
 * Unblocks a previously blocked user. Cannot unblock yourself.
 */
const unblockUser = async (req, res, next) => {
    try {
        const currentUserId = requireObjectId(req.user?.userId, "userId");
        const targetUserId = requireObjectId(req.params.userId, "params.userId");
        if (currentUserId === targetUserId) {
            throw new AppError_1.AppError("You cannot unblock yourself", 400, AppError_1.ErrorCode.BAD_REQUEST);
        }
        await user_service_1.userService.unblockUser(currentUserId, targetUserId);
        (0, response_1.sendSuccess)(res, null, "User unblocked", 200);
    }
    catch (err) {
        next(err);
    }
};
exports.unblockUser = unblockUser;
//# sourceMappingURL=user.controller.js.map
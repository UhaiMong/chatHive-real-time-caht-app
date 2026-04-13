"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveGroup = exports.removeParticipant = exports.addParticipants = exports.updateGroup = exports.getConversation = exports.createGroup = exports.getOrCreateDirect = exports.getMyConversations = void 0;
const mongoose_1 = require("mongoose");
const conversation_service_1 = require("./conversation.service");
const response_1 = require("../../shared/utils/response");
const AppError_1 = require("../../shared/utils/AppError");
// Guards
function requireObjectId(value, fieldName) {
    if (typeof value !== "string" || !(0, mongoose_1.isValidObjectId)(value)) {
        throw new AppError_1.AppError(`Invalid or missing ${fieldName}`, 400);
    }
    return value;
}
/**
 * Validates an array of ObjectId strings.
 * Throws a 400 AppError if the array is empty or contains invalid ids.
 */
function requireObjectIdArray(value, fieldName) {
    if (!Array.isArray(value) || value.length === 0) {
        throw new AppError_1.AppError(`${fieldName} must be a non-empty array`, 400);
    }
    const invalid = value.filter((id) => !(0, mongoose_1.isValidObjectId)(id));
    if (invalid.length > 0) {
        throw new AppError_1.AppError(`${fieldName} contains invalid IDs: ${invalid.join(", ")}`, 400);
    }
    return value;
}
// All Controllers logic are here
/**
 * GET /conversations
 */
const getMyConversations = async (req, res, next) => {
    try {
        const userId = requireObjectId(req.user?.userId, "userId");
        const conversations = await conversation_service_1.conversationService.getUserConversations(userId);
        (0, response_1.sendSuccess)(res, conversations, "Conversations fetched", 200);
    }
    catch (err) {
        next(err);
    }
};
exports.getMyConversations = getMyConversations;
/**
 * GET /conversations/direct/:userId
 * Returns an existing direct conversation with the target user,
 * or creates one if none exists.
 */
const getOrCreateDirect = async (req, res, next) => {
    try {
        const currentUserId = requireObjectId(req.user?.userId, "userId");
        const targetUserId = requireObjectId(req.params.userId, "params.userId");
        if (currentUserId === targetUserId) {
            throw new AppError_1.AppError("Cannot create a conversation with yourself", 400);
        }
        const conversation = await conversation_service_1.conversationService.getOrCreateDirect(currentUserId, targetUserId);
        (0, response_1.sendSuccess)(res, conversation, "Conversation ready", 200);
    }
    catch (err) {
        next(err);
    }
};
exports.getOrCreateDirect = getOrCreateDirect;
/**
 * POST /conversations/group
 * Creates a new group conversation.
 */
const createGroup = async (req, res, next) => {
    try {
        const currentUserId = requireObjectId(req.user?.userId, "userId");
        const { name, participantIds } = req.body;
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            throw new AppError_1.AppError("Group name is required", 400);
        }
        if (name.trim().length > 100) {
            throw new AppError_1.AppError("Group name must be 100 characters or fewer", 400);
        }
        const validatedParticipantIds = requireObjectIdArray(participantIds, "participantIds");
        // Prevent duplicates and ensure creator isn't manually listed
        const uniqueParticipants = [
            ...new Set(validatedParticipantIds.filter((id) => id !== currentUserId)),
        ];
        if (uniqueParticipants.length < 1) {
            throw new AppError_1.AppError("A group must have at least 2 participants (including you)", 400);
        }
        const conversation = await conversation_service_1.conversationService.createGroup(currentUserId, name.trim(), uniqueParticipants);
        (0, response_1.sendSuccess)(res, conversation, "Group created", 201);
    }
    catch (err) {
        next(err);
    }
};
exports.createGroup = createGroup;
/**
 * GET /conversations/:conversationId
 * Returns a single conversation by ID (must be a participant).
 */
const getConversation = async (req, res, next) => {
    try {
        const currentUserId = requireObjectId(req.user?.userId, "userId");
        const conversationId = requireObjectId(req.params.conversationId, "conversationId");
        const conversation = await conversation_service_1.conversationService.getById(conversationId, currentUserId);
        (0, response_1.sendSuccess)(res, conversation, "Conversation fetched", 200);
    }
    catch (err) {
        next(err);
    }
};
exports.getConversation = getConversation;
/**
 * PATCH /conversations/:conversationId
 * Updates a group conversation's metadata (admin only).
 */
const updateGroup = async (req, res, next) => {
    try {
        const currentUserId = requireObjectId(req.user?.userId, "userId");
        const conversationId = requireObjectId(req.params.conversationId, "conversationId");
        const { groupName, groupAvatar, description } = req.body;
        // Ensure at least one updatable field is present
        if (groupName === undefined &&
            groupAvatar === undefined &&
            description === undefined) {
            throw new AppError_1.AppError("No updatable fields provided", 400);
        }
        const updates = {};
        if (groupName !== undefined) {
            if (typeof groupName !== "string" || groupName.trim().length === 0) {
                throw new AppError_1.AppError("Group name must be a non-empty string", 400);
            }
            if (groupName.trim().length > 100) {
                throw new AppError_1.AppError("Group name must be 100 characters or fewer", 400);
            }
            updates.groupName = groupName.trim();
        }
        if (groupAvatar !== undefined)
            updates.groupAvatar = groupAvatar;
        if (description !== undefined)
            updates.description = description;
        const conversation = await conversation_service_1.conversationService.updateGroup(conversationId, currentUserId, updates);
        (0, response_1.sendSuccess)(res, conversation, "Group updated", 200);
    }
    catch (err) {
        next(err);
    }
};
exports.updateGroup = updateGroup;
/**
 * POST /conversations/:conversationId/participants
 * Adds new participants to a group (admin only).
 */
const addParticipants = async (req, res, next) => {
    try {
        const currentUserId = requireObjectId(req.user?.userId, "userId");
        const conversationId = requireObjectId(req.params.conversationId, "conversationId");
        const { userIds } = req.body;
        const validatedUserIds = requireObjectIdArray(userIds, "userIds");
        const conversation = await conversation_service_1.conversationService.addParticipants(conversationId, currentUserId, validatedUserIds);
        (0, response_1.sendSuccess)(res, conversation, "Participants added", 200);
    }
    catch (err) {
        next(err);
    }
};
exports.addParticipants = addParticipants;
/**
 * DELETE /conversations/:conversationId/participants/:userId
 * Removes a participant from a group (admin only).
 */
const removeParticipant = async (req, res, next) => {
    try {
        const currentUserId = requireObjectId(req.user?.userId, "userId");
        const conversationId = requireObjectId(req.params.conversationId, "conversationId");
        const targetUserId = requireObjectId(req.params.userId, "params.userId");
        if (currentUserId === targetUserId) {
            throw new AppError_1.AppError("Use the leave endpoint to remove yourself", 400);
        }
        const conversation = await conversation_service_1.conversationService.removeParticipant(conversationId, currentUserId, targetUserId);
        (0, response_1.sendSuccess)(res, conversation, "Participant removed", 200);
    }
    catch (err) {
        next(err);
    }
};
exports.removeParticipant = removeParticipant;
/**
 * DELETE /conversations/:conversationId/leave
 * Allows the authenticated user to leave a group conversation.
 */
const leaveGroup = async (req, res, next) => {
    try {
        const currentUserId = requireObjectId(req.user?.userId, "userId");
        const conversationId = requireObjectId(req.params.conversationId, "conversationId");
        await conversation_service_1.conversationService.leaveGroup(conversationId, currentUserId);
        (0, response_1.sendSuccess)(res, null, "Successfully left the group", 200);
    }
    catch (err) {
        next(err);
    }
};
exports.leaveGroup = leaveGroup;
//# sourceMappingURL=conversation.controller.js.map
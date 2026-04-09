import { Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";
import { AuthRequest } from "../../shared/types";
import { conversationService } from "./conversation.service";
import { sendSuccess } from "../../shared/utils/response";
import { AppError } from "../../shared/utils/AppError";

interface CreateGroupBody {
  name: string;
  participantIds: string[];
}

interface UpdateGroupBody {
  groupName?: string;
  groupAvatar?: string;
  description?: string;
}

interface AddParticipantsBody {
  userIds: string[];
}

// Guards

function requireObjectId(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !isValidObjectId(value)) {
    throw new AppError(`Invalid or missing ${fieldName}`, 400);
  }
  return value;
}

/**
 * Validates an array of ObjectId strings.
 * Throws a 400 AppError if the array is empty or contains invalid ids.
 */
function requireObjectIdArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new AppError(`${fieldName} must be a non-empty array`, 400);
  }
  const invalid = value.filter((id) => !isValidObjectId(id));
  if (invalid.length > 0) {
    throw new AppError(
      `${fieldName} contains invalid IDs: ${invalid.join(", ")}`,
      400,
    );
  }
  return value as string[];
}

// All Controllers logic are here

/**
 * GET /conversations
 */
export const getMyConversations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireObjectId(req.user?.userId, "userId");
    const conversations =
      await conversationService.getUserConversations(userId);
    sendSuccess(res, conversations, "Conversations fetched", 200);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /conversations/direct/:userId
 * Returns an existing direct conversation with the target user,
 * or creates one if none exists.
 */
export const getOrCreateDirect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const currentUserId = requireObjectId(req.user?.userId, "userId");
    const targetUserId = requireObjectId(req.params.userId, "params.userId");

    if (currentUserId === targetUserId) {
      throw new AppError("Cannot create a conversation with yourself", 400);
    }

    const conversation = await conversationService.getOrCreateDirect(
      currentUserId,
      targetUserId,
    );
    sendSuccess(res, conversation, "Conversation ready", 200);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /conversations/group
 * Creates a new group conversation.
 */
export const createGroup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const currentUserId = requireObjectId(req.user?.userId, "userId");
    const { name, participantIds } = req.body as CreateGroupBody;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new AppError("Group name is required", 400);
    }
    if (name.trim().length > 100) {
      throw new AppError("Group name must be 100 characters or fewer", 400);
    }

    const validatedParticipantIds = requireObjectIdArray(
      participantIds,
      "participantIds",
    );

    // Prevent duplicates and ensure creator isn't manually listed
    const uniqueParticipants = [
      ...new Set(validatedParticipantIds.filter((id) => id !== currentUserId)),
    ];

    if (uniqueParticipants.length < 1) {
      throw new AppError(
        "A group must have at least 2 participants (including you)",
        400,
      );
    }

    const conversation = await conversationService.createGroup(
      currentUserId,
      name.trim(),
      uniqueParticipants,
    );
    sendSuccess(res, conversation, "Group created", 201);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /conversations/:conversationId
 * Returns a single conversation by ID (must be a participant).
 */
export const getConversation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const currentUserId = requireObjectId(req.user?.userId, "userId");
    const conversationId = requireObjectId(
      req.params.conversationId,
      "conversationId",
    );

    const conversation = await conversationService.getById(
      conversationId,
      currentUserId,
    );
    sendSuccess(res, conversation, "Conversation fetched", 200);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /conversations/:conversationId
 * Updates a group conversation's metadata (admin only).
 */
export const updateGroup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const currentUserId = requireObjectId(req.user?.userId, "userId");
    const conversationId = requireObjectId(
      req.params.conversationId,
      "conversationId",
    );
    const { groupName, groupAvatar, description } = req.body as UpdateGroupBody;

    // Ensure at least one updatable field is present
    if (
      groupName === undefined &&
      groupAvatar === undefined &&
      description === undefined
    ) {
      throw new AppError("No updatable fields provided", 400);
    }

    const updates: UpdateGroupBody = {};
    if (groupName !== undefined) {
      if (typeof groupName !== "string" || groupName.trim().length === 0) {
        throw new AppError("Group name must be a non-empty string", 400);
      }
      if (groupName.trim().length > 100) {
        throw new AppError("Group name must be 100 characters or fewer", 400);
      }
      updates.groupName = groupName.trim();
    }
    if (groupAvatar !== undefined) updates.groupAvatar = groupAvatar;
    if (description !== undefined) updates.description = description;

    const conversation = await conversationService.updateGroup(
      conversationId,
      currentUserId,
      updates,
    );
    sendSuccess(res, conversation, "Group updated", 200);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /conversations/:conversationId/participants
 * Adds new participants to a group (admin only).
 */
export const addParticipants = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const currentUserId = requireObjectId(req.user?.userId, "userId");
    const conversationId = requireObjectId(
      req.params.conversationId,
      "conversationId",
    );
    const { userIds } = req.body as AddParticipantsBody;

    const validatedUserIds = requireObjectIdArray(userIds, "userIds");

    const conversation = await conversationService.addParticipants(
      conversationId,
      currentUserId,
      validatedUserIds,
    );
    sendSuccess(res, conversation, "Participants added", 200);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /conversations/:conversationId/participants/:userId
 * Removes a participant from a group (admin only).
 */
export const removeParticipant = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const currentUserId = requireObjectId(req.user?.userId, "userId");
    const conversationId = requireObjectId(
      req.params.conversationId,
      "conversationId",
    );
    const targetUserId = requireObjectId(req.params.userId, "params.userId");

    if (currentUserId === targetUserId) {
      throw new AppError("Use the leave endpoint to remove yourself", 400);
    }

    const conversation = await conversationService.removeParticipant(
      conversationId,
      currentUserId,
      targetUserId,
    );
    sendSuccess(res, conversation, "Participant removed", 200);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /conversations/:conversationId/leave
 * Allows the authenticated user to leave a group conversation.
 */
export const leaveGroup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const currentUserId = requireObjectId(req.user?.userId, "userId");
    const conversationId = requireObjectId(
      req.params.conversationId,
      "conversationId",
    );

    await conversationService.leaveGroup(conversationId, currentUserId);
    sendSuccess(res, null, "Successfully left the group", 200);
  } catch (err) {
    next(err);
  }
};

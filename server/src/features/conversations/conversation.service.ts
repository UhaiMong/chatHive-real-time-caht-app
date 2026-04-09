import mongoose, { mongo } from "mongoose";
import { Conversation, IConversation } from "./conversation.model";
import { User } from "../users/user.model";

export class ConversationService {
  async getOrCreateDirect(
    userId: string,
    targetId: string,
  ): Promise<IConversation> {
    const uid = new mongoose.Types.ObjectId(userId);
    const tid = new mongoose.Types.ObjectId(targetId);

    let conv = await Conversation.findOne({
      type: "direct",
      participants: { $all: [uid, tid], $size: 2 },
      isDeleted: false,
    })
      .populate("participants", "_id username email avatar status lastSeen")
      .populate("lastMessage");

    if (!conv) {
      conv = await Conversation.create({
        type: "direct",
        participants: [uid, tid],
      });
      await conv.populate(
        "participants",
        "_id username email avatar status lastSeen",
      );
    }

    return conv;
  }

  async createGroup(
    adminId: string,
    name: string,
    participantIds: string[],
  ): Promise<IConversation> {
    const all = [adminId, ...participantIds].map(
      (id) => new mongoose.Types.ObjectId(id),
    );
    const unique = [...new Set(all.map(String))].map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    const conv = await Conversation.create({
      type: "group",
      groupName: name,
      groupAdmin: new mongoose.Types.ObjectId(adminId),
      participants: unique,
    });

    return conv.populate(
      "participants",
      "_id username email avatar status lastSeen",
    );
  }

  async getUserConversations(userId: string): Promise<IConversation[]> {
    return Conversation.find({
      participants: new mongoose.Types.ObjectId(userId),
      isDeleted: false,
    })
      .populate("participants", "_id username email avatar status lastSeen")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "_id username avatar" },
      })
      .sort({ lastActivity: -1 });
  }

  async isMember(conversationId: string, userId: string): Promise<boolean> {
    const member = await Conversation.findOne({
      _id: new mongoose.Types.ObjectId(conversationId),
      participants: new mongoose.Types.ObjectId(userId),
    });

    return member !== null;
  }

  async getById(
    conversationId: string,
    userId: string,
  ): Promise<IConversation> {
    const conv = await Conversation.findOne({
      _id: new mongoose.Types.ObjectId(conversationId),
      participants: new mongoose.Types.ObjectId(userId),
      isDeleted: false,
    })
      .populate("participants", "_id username email avatar status lastSeen")
      .populate("lastMessage");

    if (!conv)
      throw Object.assign(new Error("Conversation not found"), {
        statusCode: 404,
      });
    return conv;
  }

  async updateGroup(
    conversationId: string,
    adminId: string,
    updates: { groupName?: string; groupAvatar?: string },
  ): Promise<IConversation> {
    const conv = await Conversation.findOne({
      _id: new mongoose.Types.ObjectId(conversationId),
      groupAdmin: new mongoose.Types.ObjectId(adminId),
      type: "group",
    });
    if (!conv) throw Object.assign(new Error("Forbidden"), { statusCode: 403 });

    Object.assign(conv, updates);
    await conv.save();
    return conv.populate(
      "participants",
      "_id username email avatar status lastSeen",
    );
  }

  async addParticipants(
    conversationId: string,
    adminId: string,
    userIds: string[],
  ): Promise<IConversation> {
    const conv = await Conversation.findOne({
      _id: new mongoose.Types.ObjectId(conversationId),
      groupAdmin: new mongoose.Types.ObjectId(adminId),
    });
    if (!conv) throw Object.assign(new Error("Forbidden"), { statusCode: 403 });

    const newIds = userIds.map((id) => new mongoose.Types.ObjectId(id));
    conv.participants.push(...newIds);
    await conv.save();
    return conv.populate(
      "participants",
      "_id username email avatar status lastSeen",
    );
  }

  async removeParticipant(
    conversationId: string,
    adminId: string,
    userId: string,
  ): Promise<IConversation> {
    const conv = await Conversation.findOne({
      _id: new mongoose.Types.ObjectId(conversationId),
      groupAdmin: new mongoose.Types.ObjectId(adminId),
    });
    if (!conv) throw Object.assign(new Error("Forbidden"), { statusCode: 403 });

    conv.participants = conv.participants.filter(
      (p) => p.toString() !== userId,
    );
    await conv.save();
    return conv.populate(
      "participants",
      "_id username email avatar status lastSeen",
    );
  }

  async leaveGroup(conversationId: string, userId: string): Promise<void> {
    const conv = await Conversation.findById(conversationId);
    if (!conv) throw Object.assign(new Error("Not found"), { statusCode: 404 });

    conv.participants = conv.participants.filter(
      (p) => p.toString() !== userId,
    );

    if (
      conv.groupAdmin?.toString() === userId &&
      conv.participants.length > 0
    ) {
      conv.groupAdmin = conv.participants[0];
    }

    if (conv.participants.length === 0) conv.isDeleted = true;
    await conv.save();
  }

  async updateLastMessage(
    conversationId: string,
    messageId: mongoose.Types.ObjectId,
  ): Promise<void> {
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: messageId,
      lastActivity: new Date(),
    });
  }
}

export const conversationService = new ConversationService();

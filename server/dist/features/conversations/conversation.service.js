"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationService = exports.ConversationService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const conversation_model_1 = require("./conversation.model");
class ConversationService {
    async getOrCreateDirect(userId, targetId) {
        const uid = new mongoose_1.default.Types.ObjectId(userId);
        const tid = new mongoose_1.default.Types.ObjectId(targetId);
        let conv = await conversation_model_1.Conversation.findOne({
            type: "direct",
            participants: { $all: [uid, tid], $size: 2 },
            isDeleted: false,
        })
            .populate("participants", "_id username email avatar status lastSeen")
            .populate("lastMessage");
        if (!conv) {
            conv = await conversation_model_1.Conversation.create({
                type: "direct",
                participants: [uid, tid],
            });
            await conv.populate("participants", "_id username email avatar status lastSeen");
        }
        return conv;
    }
    async createGroup(adminId, name, participantIds) {
        const all = [adminId, ...participantIds].map((id) => new mongoose_1.default.Types.ObjectId(id));
        const unique = [...new Set(all.map(String))].map((id) => new mongoose_1.default.Types.ObjectId(id));
        const conv = await conversation_model_1.Conversation.create({
            type: "group",
            groupName: name,
            groupAdmin: new mongoose_1.default.Types.ObjectId(adminId),
            participants: unique,
        });
        return conv.populate("participants", "_id username email avatar status lastSeen");
    }
    async getUserConversations(userId) {
        return conversation_model_1.Conversation.find({
            participants: new mongoose_1.default.Types.ObjectId(userId),
            isDeleted: false,
        })
            .populate("participants", "_id username email avatar status lastSeen")
            .populate({
            path: "lastMessage",
            populate: { path: "sender", select: "_id username avatar" },
        })
            .sort({ lastActivity: -1 });
    }
    async isMember(conversationId, userId) {
        const member = await conversation_model_1.Conversation.findOne({
            _id: new mongoose_1.default.Types.ObjectId(conversationId),
            participants: new mongoose_1.default.Types.ObjectId(userId),
        });
        return member !== null;
    }
    async getById(conversationId, userId) {
        const conv = await conversation_model_1.Conversation.findOne({
            _id: new mongoose_1.default.Types.ObjectId(conversationId),
            participants: new mongoose_1.default.Types.ObjectId(userId),
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
    async updateGroup(conversationId, adminId, updates) {
        const conv = await conversation_model_1.Conversation.findOne({
            _id: new mongoose_1.default.Types.ObjectId(conversationId),
            groupAdmin: new mongoose_1.default.Types.ObjectId(adminId),
            type: "group",
        });
        if (!conv)
            throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
        Object.assign(conv, updates);
        await conv.save();
        return conv.populate("participants", "_id username email avatar status lastSeen");
    }
    async addParticipants(conversationId, adminId, userIds) {
        const conv = await conversation_model_1.Conversation.findOne({
            _id: new mongoose_1.default.Types.ObjectId(conversationId),
            groupAdmin: new mongoose_1.default.Types.ObjectId(adminId),
        });
        if (!conv)
            throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
        const newIds = userIds.map((id) => new mongoose_1.default.Types.ObjectId(id));
        conv.participants.push(...newIds);
        await conv.save();
        return conv.populate("participants", "_id username email avatar status lastSeen");
    }
    async removeParticipant(conversationId, adminId, userId) {
        const conv = await conversation_model_1.Conversation.findOne({
            _id: new mongoose_1.default.Types.ObjectId(conversationId),
            groupAdmin: new mongoose_1.default.Types.ObjectId(adminId),
        });
        if (!conv)
            throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
        conv.participants = conv.participants.filter((p) => p.toString() !== userId);
        await conv.save();
        return conv.populate("participants", "_id username email avatar status lastSeen");
    }
    async leaveGroup(conversationId, userId) {
        const conv = await conversation_model_1.Conversation.findById(conversationId);
        if (!conv)
            throw Object.assign(new Error("Not found"), { statusCode: 404 });
        conv.participants = conv.participants.filter((p) => p.toString() !== userId);
        if (conv.groupAdmin?.toString() === userId &&
            conv.participants.length > 0) {
            conv.groupAdmin = conv.participants[0];
        }
        if (conv.participants.length === 0)
            conv.isDeleted = true;
        await conv.save();
    }
    async updateLastMessage(conversationId, messageId) {
        await conversation_model_1.Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: messageId,
            lastActivity: new Date(),
        });
    }
}
exports.ConversationService = ConversationService;
exports.conversationService = new ConversationService();
//# sourceMappingURL=conversation.service.js.map
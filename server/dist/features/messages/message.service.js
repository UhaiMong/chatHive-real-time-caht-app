"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageService = exports.MessageService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const message_model_1 = require("./message.model");
const conversation_model_1 = require("../conversations/conversation.model");
const PAGE_SIZE = 30;
class MessageService {
    async send(input) {
        const { conversationId, senderId, type = "text", content = "", media, replyTo, } = input;
        const convId = new mongoose_1.default.Types.ObjectId(conversationId);
        const sndId = new mongoose_1.default.Types.ObjectId(senderId);
        // Verify sender is participant
        const conv = await conversation_model_1.Conversation.findOne({
            _id: convId,
            participants: sndId,
            isDeleted: false,
        });
        if (!conv)
            throw Object.assign(new Error("Conversation not found"), {
                statusCode: 404,
            });
        const message = await message_model_1.Message.create({
            conversation: convId,
            sender: sndId,
            type,
            content,
            media,
            replyTo: replyTo ? new mongoose_1.default.Types.ObjectId(replyTo) : undefined,
            deliveredTo: [sndId],
        });
        await conversation_model_1.Conversation.findByIdAndUpdate(convId, {
            lastMessage: message._id,
            lastActivity: new Date(),
        });
        return message.populate([
            { path: "sender", select: "_id username avatar" },
            { path: "replyTo", populate: { path: "sender", select: "_id username" } },
        ]);
    }
    async getMessages(conversationId, userId, cursor) {
        const convId = new mongoose_1.default.Types.ObjectId(conversationId);
        const uid = new mongoose_1.default.Types.ObjectId(userId);
        const conv = await conversation_model_1.Conversation.findOne({
            _id: convId,
            participants: uid,
            isDeleted: false,
        });
        if (!conv)
            throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
        const query = {
            conversation: convId,
            deletedFor: { $ne: uid },
            isDeleted: false,
        };
        if (cursor) {
            query["_id"] = { $lt: new mongoose_1.default.Types.ObjectId(cursor) };
        }
        const messages = await message_model_1.Message.find(query)
            .sort({ _id: -1 })
            .limit(PAGE_SIZE + 1)
            .populate("sender", "_id username avatar")
            .populate({
            path: "replyTo",
            populate: { path: "sender", select: "_id username" },
        });
        const hasMore = messages.length > PAGE_SIZE;
        const result = hasMore ? messages.slice(0, PAGE_SIZE) : messages;
        const nextCursor = hasMore
            ? result[result.length - 1]._id.toString()
            : null;
        return { messages: result.reverse(), nextCursor };
    }
    async markDelivered(conversationId, userId) {
        const uid = new mongoose_1.default.Types.ObjectId(userId);
        await message_model_1.Message.updateMany({
            conversation: new mongoose_1.default.Types.ObjectId(conversationId),
            deliveredTo: { $ne: uid },
        }, { $addToSet: { deliveredTo: uid } });
    }
    async markRead(conversationId, userId) {
        const uid = new mongoose_1.default.Types.ObjectId(userId);
        await message_model_1.Message.updateMany({
            conversation: new mongoose_1.default.Types.ObjectId(conversationId),
            sender: { $ne: uid },
            "readBy.user": { $ne: uid },
        }, { $addToSet: { readBy: { user: uid, readAt: new Date() } } });
    }
    async editMessage(messageId, userId, content) {
        const msg = await message_model_1.Message.findOne({
            _id: new mongoose_1.default.Types.ObjectId(messageId),
            sender: new mongoose_1.default.Types.ObjectId(userId),
            isDeleted: false,
        });
        if (!msg)
            throw Object.assign(new Error("Message not found"), { statusCode: 404 });
        msg.content = content;
        msg.isEdited = true;
        msg.editedAt = new Date();
        await msg.save();
        return msg.populate("sender", "_id username avatar");
    }
    async deleteForMe(messageId, userId) {
        await message_model_1.Message.findByIdAndUpdate(messageId, {
            $addToSet: { deletedFor: new mongoose_1.default.Types.ObjectId(userId) },
        });
    }
    async deleteForEveryone(messageId, userId) {
        const msg = await message_model_1.Message.findOne({
            _id: messageId,
            sender: new mongoose_1.default.Types.ObjectId(userId),
        });
        if (!msg)
            throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
        msg.isDeleted = true;
        msg.content = "";
        msg.media = undefined;
        await msg.save();
    }
    async searchMessages(conversationId, userId, query) {
        const convId = new mongoose_1.default.Types.ObjectId(conversationId);
        const uid = new mongoose_1.default.Types.ObjectId(userId);
        const conv = await conversation_model_1.Conversation.findOne({ _id: convId, participants: uid });
        if (!conv)
            throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
        return message_model_1.Message.find({
            conversation: convId,
            content: { $regex: query, $options: "i" },
            isDeleted: false,
            deletedFor: { $ne: uid },
        })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate("sender", "_id username avatar");
    }
}
exports.MessageService = MessageService;
exports.messageService = new MessageService();
//# sourceMappingURL=message.service.js.map
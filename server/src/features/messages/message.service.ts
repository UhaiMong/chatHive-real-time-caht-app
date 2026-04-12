import mongoose from "mongoose";
import { Message, IMessage } from "./message.model";
import { Conversation } from "../conversations/conversation.model";

const PAGE_SIZE = 30;

interface SendMessageInput {
  conversationId: string;
  senderId: string;
  type?: IMessage["type"];
  content?: string;
  media?: IMessage["media"];
  replyTo?: string;
}

export class MessageService {
  async send(input: SendMessageInput): Promise<IMessage> {
    const {
      conversationId,
      senderId,
      type = "text",
      content = "",
      media,
      replyTo,
    } = input;

    const convId = new mongoose.Types.ObjectId(conversationId);
    const sndId = new mongoose.Types.ObjectId(senderId);

    // Verify sender is participant
    const conv = await Conversation.findOne({
      _id: convId,
      participants: sndId,
      isDeleted: false,
    });
    if (!conv)
      throw Object.assign(new Error("Conversation not found"), {
        statusCode: 404,
      });

    const message = await Message.create({
      conversation: convId,
      sender: sndId,
      type,
      content,
      media,
      replyTo: replyTo ? new mongoose.Types.ObjectId(replyTo) : undefined,
      deliveredTo: [sndId],
    });

    await Conversation.findByIdAndUpdate(convId, {
      lastMessage: message._id,
      lastActivity: new Date(),
    });

    return message.populate([
      { path: "sender", select: "_id username avatar" },
      { path: "replyTo", populate: { path: "sender", select: "_id username" } },
    ]);
  }

  async getMessages(
    conversationId: string,
    userId: string,
    cursor?: string,
  ): Promise<{ messages: IMessage[]; nextCursor: string | null }> {
    const convId = new mongoose.Types.ObjectId(conversationId);
    const uid = new mongoose.Types.ObjectId(userId);

    const conv = await Conversation.findOne({
      _id: convId,
      participants: uid,
      isDeleted: false,
    });
    if (!conv) throw Object.assign(new Error("Forbidden"), { statusCode: 403 });

    const query: Record<string, unknown> = {
      conversation: convId,
      deletedFor: { $ne: uid },
      isDeleted: false,
    };

    if (cursor) {
      query["_id"] = { $lt: new mongoose.Types.ObjectId(cursor) };
    }

    const messages = await Message.find(query)
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

  async markDelivered(conversationId: string, userId: string): Promise<void> {
    const uid = new mongoose.Types.ObjectId(userId);
    await Message.updateMany(
      {
        conversation: new mongoose.Types.ObjectId(conversationId),
        deliveredTo: { $ne: uid },
      },
      { $addToSet: { deliveredTo: uid } },
    );
  }

  async markRead(conversationId: string, userId: string): Promise<void> {
    const uid = new mongoose.Types.ObjectId(userId);
    await Message.updateMany(
      {
        conversation: new mongoose.Types.ObjectId(conversationId),
        sender: { $ne: uid },
        "readBy.user": { $ne: uid },
      },
      { $addToSet: { readBy: { user: uid, readAt: new Date() } } },
    );
  }

  async editMessage(
    messageId: string,
    userId: string,
    content: string,
  ): Promise<IMessage> {
    const msg = await Message.findOne({
      _id: new mongoose.Types.ObjectId(messageId),
      sender: new mongoose.Types.ObjectId(userId),
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

  async deleteForMe(messageId: string, userId: string): Promise<void> {
    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { deletedFor: new mongoose.Types.ObjectId(userId) },
    });
  }

  async deleteForEveryone(messageId: string, userId: string): Promise<void> {
    const msg = await Message.findOne({
      _id: messageId,
      sender: new mongoose.Types.ObjectId(userId),
    });
    if (!msg) throw Object.assign(new Error("Forbidden"), { statusCode: 403 });

    msg.isDeleted = true;
    msg.content = "";
    msg.media = undefined;
    await msg.save();
  }

  async searchMessages(
    conversationId: string,
    userId: string,
    query: string,
  ): Promise<IMessage[]> {
    const convId = new mongoose.Types.ObjectId(conversationId);
    const uid = new mongoose.Types.ObjectId(userId);

    const conv = await Conversation.findOne({ _id: convId, participants: uid });
    if (!conv) throw Object.assign(new Error("Forbidden"), { statusCode: 403 });

    return Message.find({
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

export const messageService = new MessageService();

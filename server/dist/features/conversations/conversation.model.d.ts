import mongoose, { Document } from 'mongoose';
export interface IConversation extends Document {
    _id: mongoose.Types.ObjectId;
    type: 'direct' | 'group';
    participants: mongoose.Types.ObjectId[];
    groupName?: string;
    groupAvatar?: string;
    groupAdmin?: mongoose.Types.ObjectId;
    lastMessage?: mongoose.Types.ObjectId;
    lastActivity: Date;
    mutedBy: mongoose.Types.ObjectId[];
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Conversation: mongoose.Model<IConversation, {}, {}, {}, mongoose.Document<unknown, {}, IConversation, {}, mongoose.DefaultSchemaOptions> & IConversation & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IConversation>;
//# sourceMappingURL=conversation.model.d.ts.map
import mongoose, { Document } from 'mongoose';
export interface IMediaAttachment {
    url: string;
    type: 'image' | 'video' | 'audio' | 'file';
    name: string;
    size: number;
    mimeType: string;
}
export interface IMessage extends Document {
    _id: mongoose.Types.ObjectId;
    conversation: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'system';
    content: string;
    media?: IMediaAttachment;
    replyTo?: mongoose.Types.ObjectId;
    readBy: {
        user: mongoose.Types.ObjectId;
        readAt: Date;
    }[];
    deliveredTo: mongoose.Types.ObjectId[];
    isEdited: boolean;
    editedAt?: Date;
    isDeleted: boolean;
    deletedFor: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const Message: mongoose.Model<IMessage, {}, {}, {}, mongoose.Document<unknown, {}, IMessage, {}, mongoose.DefaultSchemaOptions> & IMessage & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IMessage>;
//# sourceMappingURL=message.model.d.ts.map
import mongoose, { Schema, Document } from 'mongoose';

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
  readBy: { user: mongoose.Types.ObjectId; readAt: Date }[];
  deliveredTo: mongoose.Types.ObjectId[];
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedFor: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'audio', 'video', 'system'],
      default: 'text',
    },
    content: { type: String, default: '' },
    media: {
      url: String,
      type: { type: String, enum: ['image', 'video', 'audio', 'file'] },
      name: String,
      size: Number,
      mimeType: String,
    },
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
    readBy: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
    deliveredTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);

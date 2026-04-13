import { Request } from 'express';
import { Types } from 'mongoose';
export interface JwtPayload {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}
export interface AuthRequest extends Request {
    user?: JwtPayload;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    errors?: Record<string, string>[];
}
export type ObjectId = Types.ObjectId;
export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'video' | 'system';
export type ConversationType = 'direct' | 'group';
export type MessageStatus = 'sent' | 'delivered' | 'read';
export type UserStatus = 'online' | 'offline' | 'away';
//# sourceMappingURL=index.d.ts.map
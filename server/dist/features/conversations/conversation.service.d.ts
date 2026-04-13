import mongoose from "mongoose";
import { IConversation } from "./conversation.model";
export declare class ConversationService {
    getOrCreateDirect(userId: string, targetId: string): Promise<IConversation>;
    createGroup(adminId: string, name: string, participantIds: string[]): Promise<IConversation>;
    getUserConversations(userId: string): Promise<IConversation[]>;
    isMember(conversationId: string, userId: string): Promise<boolean>;
    getById(conversationId: string, userId: string): Promise<IConversation>;
    updateGroup(conversationId: string, adminId: string, updates: {
        groupName?: string;
        groupAvatar?: string;
    }): Promise<IConversation>;
    addParticipants(conversationId: string, adminId: string, userIds: string[]): Promise<IConversation>;
    removeParticipant(conversationId: string, adminId: string, userId: string): Promise<IConversation>;
    leaveGroup(conversationId: string, userId: string): Promise<void>;
    updateLastMessage(conversationId: string, messageId: mongoose.Types.ObjectId): Promise<void>;
}
export declare const conversationService: ConversationService;
//# sourceMappingURL=conversation.service.d.ts.map
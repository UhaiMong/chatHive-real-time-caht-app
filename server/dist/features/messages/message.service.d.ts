import { IMessage } from "./message.model";
interface SendMessageInput {
    conversationId: string;
    senderId: string;
    type?: IMessage["type"];
    content?: string;
    media?: IMessage["media"];
    replyTo?: string;
}
export declare class MessageService {
    send(input: SendMessageInput): Promise<IMessage>;
    getMessages(conversationId: string, userId: string, cursor?: string): Promise<{
        messages: IMessage[];
        nextCursor: string | null;
    }>;
    markDelivered(conversationId: string, userId: string): Promise<void>;
    markRead(conversationId: string, userId: string): Promise<void>;
    editMessage(messageId: string, userId: string, content: string): Promise<IMessage>;
    deleteForMe(messageId: string, userId: string): Promise<void>;
    deleteForEveryone(messageId: string, userId: string): Promise<void>;
    searchMessages(conversationId: string, userId: string, query: string): Promise<IMessage[]>;
}
export declare const messageService: MessageService;
export {};
//# sourceMappingURL=message.service.d.ts.map
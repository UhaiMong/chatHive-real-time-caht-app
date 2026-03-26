import { useState, useCallback, memo } from "react";
import { useAppDispatch, useAppSelector } from "../../shared/store/hooks";
import { updateMessage } from "./messagesSlice";
import { addNotification } from "../notifications/notificationsSlice";
import { messagesApi } from "../../shared/services/apiServices";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { ReplyBar } from "./ReplyBar";
import { MessageInput } from "./MessageInput";
import type { Conversation, Message } from "../../shared/types";

interface ChatWindowProps {
  conversation: Conversation;
  currentUserId: string;
}

export const ChatWindow = memo(
  ({ conversation, currentUserId }: ChatWindowProps) => {
    const dispatch = useAppDispatch();
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);

    const handleEditMessage = useCallback((message: Message) => {
      setEditingMessage(message);
    }, []);

    const handleCancelEdit = useCallback(() => {
      setEditingMessage(null);
    }, []);

    const handleEditSubmit = useCallback(
      async (messageId: string, content: string) => {
        try {
          const res = await messagesApi.editMessage(
            conversation._id,
            messageId,
            content,
          );
          dispatch(updateMessage(res.data.data!));
        } catch {
          dispatch(
            addNotification({
              type: "error",
              message: "Failed to edit message",
            }),
          );
        }
        setEditingMessage(null);
      },
      [conversation._id, dispatch],
    );

    const isGroup = conversation.type === "group";

    return (
      <div className="flex flex-col h-full min-h-0 bg-black/50">
        <ChatHeader conversation={conversation} currentUserId={currentUserId} />

        <MessageList
          conversationId={conversation._id}
          currentUserId={currentUserId}
          isGroup={isGroup}
          onEditMessage={handleEditMessage}
        />

        <ReplyBar />

        <MessageInput
          conversationId={conversation._id}
          currentUser={{
            _id: currentUserId,
            username: "",
            avatar: null,
          }}
          editingMessage={editingMessage}
          onCancelEdit={handleCancelEdit}
          onEditSubmit={handleEditSubmit}
        />
      </div>
    );
  },
);

ChatWindow.displayName = "ChatWindow";

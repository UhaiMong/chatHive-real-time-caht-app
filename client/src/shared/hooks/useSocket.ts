import { useEffect, useCallback, useRef } from "react";
import { getSocket } from "../services/socket";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  addMessage,
  updateMessage,
  deleteMessage,
  markMessagesRead,
} from "../../features/chat/messagesSlice";
import {
  updateLastMessage,
  incrementUnread,
  setTyping,
  updateParticipantStatus,
} from "../../features/conversations/conversationsSlice";
import { addNotification } from "../../features/notifications/notificationsSlice";
import type { Message, TypingEvent, PresenceEvent, ReadEvent } from "../types";

export const useSocket = () => {
  const dispatch = useAppDispatch();
  const activeConversationId = useAppSelector((s) => s.ui.activeConversationId);
  const _currentUser = useAppSelector((s) => s.auth.user);
  const currentUserId = useAppSelector((s) => s.auth.user?._id);
  const _conversationIds = useAppSelector((s) =>
    s.conversations.items.map((c) => c._id),
  );

  const activeConvRef = useRef(activeConversationId);
  const currentUserRef = useRef(currentUserId);

  useEffect(() => {
    let socket: ReturnType<typeof getSocket>;
    try {
      socket = getSocket();
    } catch {
      return;
    }

    // Join rooms immediately + rejoin on reconnect
    const joinRooms = () => socket.emit("conversations:join");
    joinRooms();
    socket.on("connect", joinRooms);

    // socket.emit("conversations:join");

    const onNewMessage = (message: Message) => {
      dispatch(addMessage(message));
      dispatch(
        updateLastMessage({ conversationId: message.conversation, message }),
      );

      // Only increment unread if conversation isn't active
      if (
        message.conversation !== activeConvRef.current &&
        message.sender._id !== currentUserRef.current
      ) {
        dispatch(incrementUnread({ conversationId: message.conversation }));
        dispatch(
          addNotification({
            type: "info",
            message: `${message.sender.username}: ${message.content.slice(0, 40) || "📎 Media"}`,
          }),
        );
        // if (message.sender._id !== currentUser?._id) {
        //   dispatch(
        //     addNotification({
        //       type: "info",
        //       message: `${message.sender.username}: ${message.content.slice(0, 40) || "📎 Media"}`,
        //     }),
        //   );
        // }
      }
    };

    const onMessageEdited = (message: Message) => {
      dispatch(updateMessage(message));
    };

    const onMessageDeleted = (data: {
      messageId: string;
      conversationId: string;
    }) => {
      dispatch(deleteMessage(data));
    };

    const onMessageRead = (event: ReadEvent) => {
      dispatch(
        markMessagesRead({
          conversationId: event.conversationId,
          userId: event.userId,
          readAt: event.readAt,
        }),
      );
    };

    const onTypingStart = (event: TypingEvent) => {
      dispatch(
        setTyping({
          conversationId: event.conversationId,
          userId: event.userId,
          isTyping: true,
        }),
      );
    };

    const onTypingStop = (event: TypingEvent) => {
      dispatch(
        setTyping({
          conversationId: event.conversationId,
          userId: event.userId,
          isTyping: false,
        }),
      );
    };

    const onUserOnline = (event: PresenceEvent) => {
      dispatch(
        updateParticipantStatus({ userId: event.userId, status: "online" }),
      );
    };

    const onUserOffline = (event: PresenceEvent) => {
      dispatch(
        updateParticipantStatus({
          userId: event.userId,
          status: "offline",
          lastSeen: event.lastSeen,
        }),
      );
    };

    socket.on("message:new", onNewMessage);
    socket.on("message:edited", onMessageEdited);
    socket.on("message:deleted", onMessageDeleted);
    socket.on("message:read", onMessageRead);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);
    socket.on("user:online", onUserOnline);
    socket.on("user:offline", onUserOffline);

    return () => {
      socket.off("connect", joinRooms);
      socket.off("message:new", onNewMessage);
      socket.off("message:edited", onMessageEdited);
      socket.off("message:deleted", onMessageDeleted);
      socket.off("message:read", onMessageRead);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
      socket.off("user:online", onUserOnline);
      socket.off("user:offline", onUserOffline);
    };
  }, [dispatch]);

  const emitTypingStart = useCallback((conversationId: string) => {
    try {
      getSocket().emit("typing:start", { conversationId });
    } catch {
      /* noop */
    }
  }, []);

  const emitTypingStop = useCallback((conversationId: string) => {
    try {
      getSocket().emit("typing:stop", { conversationId });
    } catch {
      /* noop */
    }
  }, []);

  const emitMarkRead = useCallback((conversationId: string) => {
    try {
      getSocket().emit("message:read", { conversationId });
    } catch {
      /* noop */
    }
  }, []);

  const emitDeleteMessage = useCallback(
    (messageId: string, conversationId: string, scope: "me" | "all") => {
      try {
        getSocket().emit("message:delete", {
          messageId,
          conversationId,
          scope,
        });
      } catch {
        /* noop */
      }
    },
    [],
  );

  return { emitTypingStart, emitTypingStop, emitMarkRead, emitDeleteMessage };
};

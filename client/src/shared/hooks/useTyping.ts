import { useRef, useCallback } from "react";
import { useSocket } from "./useSocket";

export const useTyping = (conversationId: string | null) => {
  const { emitTypingStart, emitTypingStop } = useSocket();
  const typingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const onTyping = useCallback(() => {
    if (!conversationId) return;

    if (!typingRef.current) {
      typingRef.current = true;
      emitTypingStart(conversationId);
    }

    if (timeoutRef.current !== undefined) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      typingRef.current = false;
      emitTypingStop(conversationId);
    }, 2000);
  }, [conversationId, emitTypingStart, emitTypingStop]);

  const stopTyping = useCallback(() => {
    if (!conversationId) return;
    clearTimeout(timeoutRef.current);
    typingRef.current = false;
    emitTypingStop(conversationId);
  }, [conversationId, emitTypingStop]);

  return { onTyping, stopTyping };
};

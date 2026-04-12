import { useRef, useCallback } from "react";
import { getSocket } from "../services/socket";

export const useTyping = (conversationId: string | null) => {
  // const { emitTypingStart, emitTypingStop } = useSocket();
  // const typingRef = useRef(false);
  // const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
  //   undefined,
  // );
  const typingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const onTyping = useCallback(() => {
    if (!conversationId) return;
    if (!typingRef.current) {
      typingRef.current = true;
      try {
        getSocket().emit("typing:start", { conversationId });
      } catch {
        /* noop */
      }
    }
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      typingRef.current = false;
      try {
        getSocket().emit("typing:stop", { conversationId });
      } catch {
        /* noop */
      }
    }, 2000);
  }, [conversationId]);

  const stopTyping = useCallback(() => {
    if (!conversationId) return;
    clearTimeout(timeoutRef.current);
    if (typingRef.current) {
      typingRef.current = false;
      try {
        getSocket().emit("typing:stop", { conversationId });
      } catch {
        /* noop */
      }
    }
  }, [conversationId]);

  return { onTyping, stopTyping };
};

// components/TypingIndicator.tsx
import { RootState } from "@/shared/store";
import React from "react";
import { useSelector } from "react-redux";

interface TypingIndicatorProps {
  conversationId: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  conversationId,
}) => {
  const typingUsers = useSelector(
    (state: RootState) => (state as any).typing?.[conversationId] || {},
  );

  const activeTypers = Object.entries(typingUsers)
    .filter(([_, isTyping]) => isTyping)
    .map(([userId]) => userId);

  if (activeTypers.length === 0) return null;

  return (
    <div className="typing-indicator">
      {activeTypers.join(", ")} {activeTypers.length > 1 ? "are" : "is"}{" "}
      typing...
    </div>
  );
};

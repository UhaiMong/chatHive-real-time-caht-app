import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { cn, formatConversationTime } from "../../shared/utils/helpers";
import { Avatar } from "../../shared/components/ui/Avatar";
import type { Conversation, User } from "../../shared/types";

interface ConversationItemProps {
  conversation: Conversation;
  currentUserId: string;
  isActive: boolean;
  typingUsernames: string[];
  onClick: () => void;
}

// const getDirectPeer = (conv: Conversation, userId: string): User | undefined =>
//   conv.participants.find((p) => p._id !== userId);
const getDirectPeers = (conv: Conversation, userId: string): User[] => {
  return conv.participants.filter((p) => String(p._id) !== String(userId));
};

export const ConversationItem = memo(
  ({
    conversation,
    currentUserId,
    isActive,
    typingUsernames,
    onClick,
  }: ConversationItemProps) => {
    const peers = getDirectPeers(conversation, currentUserId);

    const displayName =
      conversation.type === "group"
        ? (conversation.groupName ?? peers.map((p) => p.username).join(", "))
        : (peers[0]?.username ?? "Unknown");

    const avatarUser =
      conversation.type === "group"
        ? {
            userId: conversation._id,
            username: displayName,
            avatar: conversation.groupAvatar ?? null,
          }
        : (peers[0] ?? {
            userId: conversation._id,
            username: displayName,
            avatar: null,
          });

    const lastMsgPreview = useMemo(() => {
      if (typingUsernames.length > 0) return null;
      const msg = conversation.lastMessage;
      if (!msg) return "No messages yet";
      if (msg.isDeleted) return "🚫 Message deleted";
      if (msg.type !== "text") {
        const icons: Record<string, string> = {
          image: "📷 Photo",
          file: "📎 File",
          audio: "🎵 Audio",
          video: "🎬 Video",
        };
        return icons[msg.type] ?? "📎 Attachment";
      }
      const isMine = msg.sender._id === currentUserId;
      const prefix = isMine
        ? "You: "
        : conversation.type === "group"
          ? `${msg.sender.username}: `
          : "";
      return `${prefix}${msg.content}`;
    }, [
      conversation.lastMessage,
      typingUsernames,
      currentUserId,
      conversation.type,
    ]);

    return (
      <motion.button
        layout
        onClick={onClick}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors hover:bg-green-200 bg-gray-200",
          isActive ? "bg-green-200" : "",
        )}
      >
        <Avatar
          user={avatarUser}
          size="md"
          showStatus={conversation.type === "direct"}
          status={peers[0]?.status}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-sm font-medium truncate">{displayName}</span>
            {conversation.lastActivity && (
              <span className="text-[11px] text-gray-500 shrink-0">
                {formatConversationTime(conversation.lastActivity)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-1 mt-0.5">
            {typingUsernames.length > 0 ? (
              <span className="text-xs text-primary-400 italic truncate flex items-center gap-1">
                <TypingDots />
                {typingUsernames.length === 1
                  ? "typing..."
                  : `${typingUsernames[0]} and ${typingUsernames.length - 1} more...`}
              </span>
            ) : (
              <span className="text-xs text-gray-500 truncate">
                {lastMsgPreview}
              </span>
            )}

            {(conversation.unreadCount ?? 0) > 0 && (
              <span className="shrink-0 min-w-4.5 h-4.5 px-1 bg-primary-600 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {(conversation.unreadCount ?? 0) > 99
                  ? "99+"
                  : conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </motion.button>
    );
  },
);
ConversationItem.displayName = "ConversationItem";

const TypingDots = () => (
  <span className="flex gap-0.5 items-center">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-1 h-1 rounded-full bg-primary-400 animate-bounce-dots"
        style={{ animationDelay: `${i * 0.16}s` }}
      />
    ))}
  </span>
);

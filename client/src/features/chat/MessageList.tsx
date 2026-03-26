import { useEffect, useRef, useCallback, memo, useState } from "react";
import { useInView } from "react-intersection-observer";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "../../shared/store/hooks";
import { fetchMessages } from "./messagesSlice";
import { clearUnread } from "../conversations/conversationsSlice";
import { useSocket } from "../../shared/hooks/useSocket";
import { MessageBubble } from "./MessageBubble";
import { Spinner } from "../../shared/components/ui/Spinner";
import { cn, formatMessageTime } from "../../shared/utils/helpers";
import { format, parseISO, isToday, isYesterday, isSameDay } from "date-fns";
import type { Message } from "../../shared/types";

interface MessageListProps {
  conversationId: string;
  currentUserId: string;
  isGroup: boolean;
  onEditMessage: (message: Message) => void;
}

const DateDivider = ({ date }: { date: string }) => {
  const d = parseISO(date);
  const label = isToday(d)
    ? "Today"
    : isYesterday(d)
      ? "Yesterday"
      : format(d, "MMMM d, yyyy");
  return (
    <div className="flex items-center gap-3 py-2 px-4">
      <div className="flex-1 h-px bg-white/5" />
      <span className="text-[11px] text-gray-600 shrink-0 bg-surface px-2 py-0.5 rounded-full">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
};

export const MessageList = memo(
  ({
    conversationId,
    currentUserId,
    isGroup,
    onEditMessage,
  }: MessageListProps) => {
    const dispatch = useAppDispatch();
    const { emitMarkRead } = useSocket();
    const bottomRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const isInitialLoad = useRef(true);

    const pageData = useAppSelector(
      (s) => s.messages.byConversation[conversationId],
    );
    const messages = pageData?.messages ?? [];
    const nextCursor = pageData?.nextCursor ?? null;
    const loading = pageData?.loading ?? false;
    const initialized = pageData?.initialized ?? false;
    console.log(messages, currentUserId);
    // Sentinel for infinite scroll (top of list)
    const { ref: topSentinel, inView: topInView } = useInView({
      threshold: 0.1,
    });

    // Initial load
    useEffect(() => {
      if (!initialized) {
        dispatch(fetchMessages({ conversationId }));
      }
    }, [conversationId, initialized, dispatch]);

    // Load more on scroll to top
    useEffect(() => {
      if (topInView && nextCursor && !loading) {
        const container = containerRef.current;
        const prevScrollHeight = container?.scrollHeight ?? 0;
        dispatch(fetchMessages({ conversationId, cursor: nextCursor })).then(
          () => {
            if (container) {
              container.scrollTop = container.scrollHeight - prevScrollHeight;
            }
          },
        );
      }
    }, [topInView, nextCursor, loading, conversationId, dispatch]);

    // Auto-scroll to bottom on new messages (only if near bottom)
    useEffect(() => {
      if (!initialized) return;
      if (isInitialLoad.current) {
        bottomRef.current?.scrollIntoView({ behavior: "instant" });
        isInitialLoad.current = false;
        return;
      }
      const container = containerRef.current;
      if (!container) return;
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        120;
      if (isNearBottom) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }, [messages.length, initialized]);

    // Mark read on view
    useEffect(() => {
      if (initialized) {
        emitMarkRead(conversationId);
        dispatch(clearUnread(conversationId));
      }
    }, [conversationId, initialized, emitMarkRead, dispatch]);

    const handleScroll = useCallback(() => {
      const container = containerRef.current;
      if (!container) return;
      const distFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      setShowScrollBtn(distFromBottom > 200);
    }, []);

    const scrollToBottom = () =>
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });

    // Group messages by date and consecutive sender
    const groupedMessages = messages.reduce<
      { date: string; items: Message[] }[]
    >((acc, msg, i) => {
      const msgDate = msg.createdAt.split("T")[0];
      const prevMsg = messages[i - 1];

      if (!prevMsg || prevMsg.createdAt.split("T")[0] !== msgDate) {
        acc.push({ date: msgDate, items: [msg] });
      } else {
        acc[acc.length - 1].items.push(msg);
      }
      return acc;
    }, []);

    return (
      <div className="relative flex-1 min-h-0">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-3 py-4 space-y-1"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.02) 0%, transparent 60%)",
          }}
        >
          {/* Load more sentinel */}
          <div ref={topSentinel} className="h-1" />

          {loading && (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          )}

          {!loading && initialized && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-20">
              <span className="text-4xl">👋</span>
              <p className="text-sm text-gray-500">
                No messages yet. Say hello!
              </p>
            </div>
          )}

          {groupedMessages.map((group) => (
            <div key={group.date}>
              <DateDivider date={`${group.date}T00:00:00.000Z`} />
              <div className="space-y-1">
                {group.items.map((msg, i) => {
                  const prev = group.items[i - 1];
                  const isMine = msg.sender._id === currentUserId;
                  const showAvatar =
                    !prev || prev.sender._id !== msg.sender._id;

                  return (
                    <motion.div
                      key={msg._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <MessageBubble
                        message={msg}
                        isMine={isMine}
                        showAvatar={showAvatar}
                        isGroup={isGroup}
                        conversationId={conversationId}
                        onEdit={onEditMessage}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}

          <div ref={bottomRef} className="h-1" />
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollBtn && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className="absolute bottom-4 right-4 p-2 rounded-full bg-surface-elevated border border-white/10 shadow-lg hover:bg-surface-hover transition-colors"
            >
              <ChevronDownIcon className="w-5 h-5 text-gray-300" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

MessageList.displayName = "MessageList";

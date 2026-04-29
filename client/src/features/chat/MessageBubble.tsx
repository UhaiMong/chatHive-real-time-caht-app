import { memo } from "react";
import {
  PencilIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  DocumentIcon,
  CheckIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import {
  cn,
  formatMessageTime,
  formatFileSize,
} from "../../shared/utils/helpers";
import { Avatar } from "../../shared/components/ui/Avatar";
import { useAppDispatch } from "../../shared/store/hooks";
import { setReplyTo } from "../../shared/store/uiSlice";
import { useSocket } from "../../shared/hooks/useSocket";
import type { Message } from "../../shared/types";
import ActionBtn from "./ActionBtn";

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  showAvatar: boolean;
  isGroup: boolean;
  conversationId: string;
  onEdit: (message: Message) => void;
}

export const MessageBubble = memo(
  ({
    message,
    isMine,
    showAvatar,
    isGroup,
    conversationId,
    onEdit,
  }: MessageBubbleProps) => {
    const dispatch = useAppDispatch();
    const { emitDeleteMessage } = useSocket();

    const isRead = message.readBy.length > 0;
    const isDelivered = message.deliveredTo.length > 1;

    if (message.isDeleted) {
      return (
        <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
          <span className="text-xs text-gray-600 italic px-3 py-1.5 rounded-xl bg-surface-elevated">
            🚫 Message deleted
          </span>
        </div>
      );
    }

    return (
      <div
        className={cn(
          "flex items-end gap-2 group",
          isMine ? "flex-row-reverse" : "flex-row",
        )}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
      >
        {/* Avatar for others in group */}
        {!isMine && isGroup && (
          <div className="w-8 shrink-0 self-end mb-1">
            {showAvatar && <Avatar user={message.sender} size="sm" />}
          </div>
        )}

        <div
          className={cn(
            "flex flex-col max-w-[70%] min-w-0",
            isMine ? "items-end" : "items-start",
          )}
        >
          {/* Sender name in group */}
          {!isMine && isGroup && showAvatar && (
            <span className="text-xs font-medium text-primary-400 px-1 mb-0.5 ml-1">
              {message.sender.username}
            </span>
          )}

          {/* Reply reference */}
          {message.replyTo && typeof message.replyTo === "object" && (
            <div
              className={cn(
                "text-xs rounded-t-xl px-3 py-2 mb-0.5 border-l-2 border-primary-900 max-w-full",
                isMine ? "bg-msg-sent/50 text-right" : "bg-surface-elevated",
              )}
            >
              <span className="font-medium text-primary-400 bg-gray-200 p-1 rounded-sm block truncate">
                {message.replyTo.sender.username}
              </span>
              <span className="text-gray-400 truncate block">
                {message.replyTo.content || "📎 Media"}
              </span>
            </div>
          )}

          {/* Bubble */}
          <div
            className={cn(
              "relative rounded-2xl px-3 py-2 shadow-sm",
              isMine
                ? "bg-msg-sent rounded-br-sm"
                : "bg-msg-received rounded-bl-sm",
              message.pending && "opacity-60",
              message.replyTo && "rounded-t-sm",
            )}
          >
            {/* Media content */}
            {message.media && (
              <div className="mb-2">
                {message.media.type === "image" && (
                  <img
                    src={message.media.url}
                    alt={message.media.name}
                    className="rounded-xl max-w-65 max-h-65 object-cover cursor-pointer"
                    loading="lazy"
                    onClick={() => window.open(message.media!.url, "_blank")}
                  />
                )}
                {message.media.type === "video" && (
                  <video
                    src={message.media.url}
                    controls
                    className="rounded-xl max-w-65 max-h-65"
                  />
                )}
                {message.media.type === "audio" && (
                  <audio
                    src={message.media.url}
                    controls
                    className="max-w-60"
                  />
                )}
                {message.media.type === "file" && (
                  <a
                    href={message.media.url}
                    download={message.media.name}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-black/10 rounded-xl p-2.5 hover:bg-black/20 transition-colors"
                  >
                    <DocumentIcon className="w-8 h-8 text-gray-300 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-200 truncate max-w-40">
                        {message.media.name}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {formatFileSize(message.media.size)}
                      </p>
                    </div>
                  </a>
                )}
              </div>
            )}

            {/* Text content */}
            {message.content && (
              <p
                className={`text-sm p-2.5 text-gray-950 rounded-xl leading-relaxed whitespace-pre-wrap wrap-break-words ${isMine ? "bg-green-400" : "bg-gray-50"}`}
              >
                {message.content}
              </p>
            )}

            {/* Time + status */}
            <div
              className={cn(
                "flex items-center gap-1 mt-1",
                isMine ? "justify-end" : "justify-start",
              )}
            >
              <span className="text-[10px] text-gray-400 leading-none">
                {formatMessageTime(message.createdAt)}
              </span>
              {message.isEdited && (
                <span className="text-[10px] text-gray-500 italic">edited</span>
              )}
              {isMine && (
                <span className="text-[11px] leading-none">
                  {message.pending ? (
                    <span className="w-3 h-3 inline-block rounded-full border border-gray-500 border-t-transparent animate-spin" />
                  ) : isRead ? (
                    <CheckCircleIcon className="w-3.5 h-3.5 text-primary-400" />
                  ) : isDelivered ? (
                    <CheckIcon className="w-3.5 h-3.5 text-gray-400" />
                  ) : (
                    <CheckIcon className="w-3.5 h-3.5 text-gray-600" />
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Hover actions */}
          <div
            className={cn(
              "flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity",
              isMine ? "flex-row-reverse" : "flex-row",
            )}
          >
            <ActionBtn
              icon={<ArrowUturnLeftIcon className="w-3.5 h-3.5" />}
              title="Reply"
              onClick={() => dispatch(setReplyTo(message))}
            />
            {isMine && message.type === "text" && (
              <ActionBtn
                icon={<PencilIcon className="w-3.5 h-3.5" />}
                title="Edit"
                onClick={() => onEdit(message)}
              />
            )}
            {isMine && (
              <ActionBtn
                icon={<TrashIcon className="w-3.5 h-3.5" />}
                title="Delete"
                onClick={() =>
                  emitDeleteMessage(message._id, conversationId, "all")
                }
                danger
              />
            )}
          </div>
        </div>
      </div>
    );
  },
);
MessageBubble.displayName = "MessageBubble";

import {
  useState,
  useRef,
  useCallback,
  KeyboardEvent,
  ChangeEvent,
  memo,
} from "react";
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "../../shared/store/hooks";
import { setReplyTo } from "../../shared/store/uiSlice";
import { addMessage } from "./messagesSlice";
import { useTyping } from "../../shared/hooks/useTyping";
import { messagesApi } from "../../shared/services/apiServices";
import { cn, formatFileSize, isImageType } from "../../shared/utils/helpers";
import { addNotification } from "../notifications/notificationsSlice";
import type { Message } from "../../shared/types";

interface MessageInputProps {
  conversationId: string;
  currentUser: { _id: string; username: string; avatar: string | null };
  editingMessage?: Message | null;
  onCancelEdit: () => void;
  onEditSubmit: (messageId: string, content: string) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const MessageInput = memo(
  ({
    conversationId,
    // currentUser,
    editingMessage,
    onCancelEdit,
    onEditSubmit,
  }: MessageInputProps) => {
    const dispatch = useAppDispatch();
    const replyTo = useAppSelector((s) => s.ui.replyToMessage);
    const [text, setText] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [showEmoji, setShowEmoji] = useState(false);
    const [sending, setSending] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { onTyping, stopTyping } = useTyping(conversationId);

    // Populate textarea when entering edit mode
    const prevEditId = useRef<string | null>(null);
    if (editingMessage && editingMessage._id !== prevEditId.current) {
      prevEditId.current = editingMessage._id;
      setText(editingMessage.content);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
    if (!editingMessage && prevEditId.current) {
      prevEditId.current = null;
    }

    const autoResize = useCallback(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }, []);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (!selected) return;
      if (selected.size > MAX_FILE_SIZE) {
        dispatch(
          addNotification({
            type: "error",
            message: "File exceeds 10MB limit",
          }),
        );
        return;
      }
      setFile(selected);
      if (isImageType(selected.type)) {
        setFilePreview(URL.createObjectURL(selected));
      } else {
        setFilePreview(null);
      }
      e.target.value = "";
    };

    const clearFile = () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
      setFile(null);
      setFilePreview(null);
    };

    const canSend = (text.trim() || file) && !sending;

    const handleSend = async () => {
      if (!canSend) return;
      stopTyping();
      setSending(true);

      if (editingMessage) {
        onEditSubmit(editingMessage._id, text.trim());
        setText("");
        setSending(false);
        return;
      }

      try {
        const formData = new FormData();
        if (text.trim()) formData.append("content", text.trim());
        if (file) formData.append("media", file);
        if (replyTo) formData.append("replyTo", replyTo._id);

        dispatch(setReplyTo(null));
        setText("");
        clearFile();
        if (textareaRef.current) textareaRef.current.style.height = "auto";

        const res = await messagesApi.sendMessage(conversationId, formData);
        const newMsg = res.data.data!;

        dispatch(addMessage(newMsg));
      } catch {
        dispatch(
          addNotification({ type: "error", message: "Failed to send message" }),
        );
      } finally {
        setSending(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    return (
      <div className="shrink-0 bg-surface-secondary">
        {/* Edit mode banner */}
        {editingMessage && (
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="flex-1 min-w-0 border-l-2 border-amber-500 pl-3">
              <span className="text-xs font-medium text-amber-400">
                Editing message
              </span>
            </div>
            <button
              onClick={onCancelEdit}
              className="p-1.5 rounded-lg hover:bg-surface-elevated text-gray-500 hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* File preview */}
        <AnimatePresence>
          {file && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pt-3 overflow-hidden"
            >
              <div className="flex items-center gap-3 bg-surface-elevated rounded-xl p-3 max-w-xs">
                {filePreview ? (
                  <img
                    src={filePreview}
                    alt="preview"
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-surface flex items-center justify-center shrink-0">
                    <PaperClipIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-200 truncate">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={clearFile}
                  className="p-1 rounded-lg hover:bg-surface text-gray-500 hover:text-gray-300 transition-colors shrink-0"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row */}
        <div className="flex items-end gap-2 px-3 py-3 bg-gray-100 text-gray-950">
          {/* File attach */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-full hover:bg-surface-elevated shrink-0"
            title="Attach file"
          >
            <PaperClipIcon className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          />

          {/* Emoji */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowEmoji((p) => !p)}
              className="p-2.5 rounded-full hover:bg-surface-elevated"
              title="Emoji"
            >
              <FaceSmileIcon className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {showEmoji && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute bottom-12 left-0 z-30"
                >
                  <EmojiPicker
                    theme={Theme.DARK}
                    onEmojiClick={(e) => {
                      setText((t) => t + e.emoji);
                      textareaRef.current?.focus();
                    }}
                    height={380}
                    width={320}
                    searchDisabled={false}
                    skinTonesDisabled
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            rows={1}
            placeholder="Type a message…"
            onInput={autoResize}
            onChange={(e) => {
              setText(e.target.value);
              onTyping();
            }}
            onKeyDown={handleKeyDown}
            onBlur={stopTyping}
            onClick={() => setShowEmoji(false)}
            className={cn(
              "flex-1 rounded-full bg-gray-300 px-4 py-2.5 text-sm",
              "placeholder-gray-500 resize-none focus:outline-none",
              "border border-transparent focus:border-primary-600/50 transition-colors",
              "min-h-10.5 max-h-30 leading-relaxed",
              "overflow-y-auto no-scrollbar",
            )}
          />

          {/* Send */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              "p-2.5 rounded-full shrink-0 transition-colors",
              canSend
                ? "bg-primary-600 hover:bg-primary-700"
                : "bg-surface-elevated cursor-not-allowed",
            )}
          >
            {sending ? (
              <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
            ) : (
              <PaperAirplaneIcon className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </div>
    );
  },
);

MessageInput.displayName = "MessageInput";

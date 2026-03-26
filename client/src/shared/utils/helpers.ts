import { clsx, type ClassValue } from "clsx";
import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  parseISO,
} from "date-fns";

export const cn = (...inputs: ClassValue[]): string => clsx(inputs);

export const formatMessageTime = (dateStr: string): string => {
  const date = parseISO(dateStr);
  return format(date, "HH:mm");
};

export const formatConversationTime = (dateStr: string): string => {
  const date = parseISO(dateStr);
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "dd/MM/yyyy");
};

export const formatLastSeen = (dateStr: string): string => {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getInitials = (name: string): string => {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
};

export const getAvatarColor = (userId?: string): string => {
  const colors = [
    "bg-rose-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-blue-500",
    "bg-violet-500",
    "bg-fuchsia-500",
    "bg-pink-500",
  ];

  if (!userId) {
    return colors[0];
  }

  const hash = userId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export const isImageType = (mimeType: string): boolean =>
  mimeType.startsWith("image/");
export const isVideoType = (mimeType: string): boolean =>
  mimeType.startsWith("video/");
export const isAudioType = (mimeType: string): boolean =>
  mimeType.startsWith("audio/");

export const buildApiUrl = (path: string): string => `/api${path}`;

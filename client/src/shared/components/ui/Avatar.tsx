import { memo } from "react";
import { cn, getInitials, getAvatarColor } from "../../utils/helpers";

interface AvatarProps {
  user?: { userId: string; username: string; avatar: string | null };
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
  status?: "online" | "offline" | "away";
  className?: string;
}

const sizeMap = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-xl",
};

const statusDotSize = {
  xs: "w-1.5 h-1.5",
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
  xl: "w-3.5 h-3.5",
};

export const Avatar = memo(
  ({
    user,
    size = "md",
    showStatus = false,
    status,
    className,
  }: AvatarProps) => {
    if (!user) {
      return (
        <div
          className={cn(
            "rounded-full bg-surface-elevated flex-shrink-0",
            sizeMap[size],
            className,
          )}
        />
      );
    }
    return (
      <div className="relative flex-shrink-0">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.username}
            className={cn(
              "rounded-full object-cover",
              sizeMap[size],
              className,
            )}
            loading="lazy"
          />
        ) : (
          <div
            className={cn(
              "rounded-full flex items-center justify-center font-semibold text-white select-none",
              getAvatarColor(user?.userId),
              sizeMap[size],
              className,
            )}
          >
            {getInitials(user.username)}
          </div>
        )}

        {showStatus && status && (
          <span
            className={cn(
              "absolute bottom-0 right-0 rounded-full border-2 border-surface",
              statusDotSize[size],
              status === "online" ? "bg-emerald-400" : "bg-gray-500",
            )}
          />
        )}
      </div>
    );
  },
);

Avatar.displayName = "Avatar";

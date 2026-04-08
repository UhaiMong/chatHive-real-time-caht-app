import { memo, useMemo } from "react";
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  PhoneIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "../../shared/store/hooks";
import { toggleSidebar, setProfilePanelOpen } from "../../shared/store/uiSlice";
import { Avatar } from "../../shared/components/ui/Avatar";
import {
  ContextMenuDrawer,
  ContextMenuItem,
} from "../../shared/components/ui/ContextMenu";
import { formatLastSeen } from "../../shared/utils/helpers";
import type { Conversation } from "../../shared/types";

interface ChatHeaderProps {
  conversation: Conversation;
  currentUserId: string;
}

export const ChatHeader = memo(
  ({ conversation, currentUserId }: ChatHeaderProps) => {
    const dispatch = useAppDispatch();
    const typingUsers = useAppSelector(
      (s) => s.conversations.typingUsers[conversation._id] ?? [],
    );

    const peer =
      conversation.type === "direct"
        ? conversation.participants.find((p) => p._id !== currentUserId)
        : undefined;

    const displayName =
      conversation.type === "group"
        ? (conversation.groupName ?? "Group")
        : (peer?.username ?? "Unknown");

    const avatarUser = peer ?? {
      userId: conversation._id,
      username: displayName,
      avatar: conversation.groupAvatar ?? null,
    };

    const subtitle = useMemo(() => {
      if (typingUsers.length > 0) {
        const names = typingUsers
          .map(
            (id) =>
              conversation.participants.find((p) => p._id === id)?.username,
          )
          .filter(Boolean);
        return names.length === 1
          ? `${names[0]} is typing…`
          : "Several people are typing…";
      }
      if (conversation.type === "direct" && peer) {
        if (peer.status === "online") return "online";
        return peer.lastSeen
          ? `last seen ${formatLastSeen(peer.lastSeen)}`
          : "offline";
      }
      return `${conversation.participants.length} members`;
    }, [conversation, peer, typingUsers]);

    const menuItems: ContextMenuItem[] = [
      {
        label: "View info",
        onClick: () => dispatch(setProfilePanelOpen(true)),
      },
    ];

    return (
      <header className="flex items-center gap-3 px-4 py-3 bg-green-400 text-black shrink-0">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-1.5 -ml-1 rounded-lg transition-colors md:hidden"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>

        <button
          className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity text-left"
          onClick={() => dispatch(setProfilePanelOpen(true))}
        >
          <Avatar
            user={avatarUser}
            size="md"
            showStatus={conversation.type === "direct"}
            status={peer?.status}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{displayName}</p>
            <p
              className={`text-xs truncate transition-colors ${
                typingUsers.length > 0
                  ? "text-primary-400 italic"
                  : "text-gray-500"
              }`}
            >
              {subtitle}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button
            className="p-2 rounded-lg hover:bg-surface-elevated cursor-not-allowed"
            title="Voice call (coming soon)"
          >
            <PhoneIcon className="w-5 h-5" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-surface-elevated transition-colors"
            title="Search"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>
          <ContextMenuDrawer
            items={menuItems}
            trigger={
              <button className="p-2 rounded-lg hover:bg-surface-elevated transition-colors">
                <EllipsisVerticalIcon className="w-5 h-5" />
              </button>
            }
          />
        </div>
      </header>
    );
  },
);

ChatHeader.displayName = "ChatHeader";

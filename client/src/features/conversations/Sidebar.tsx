import { useEffect, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PencilSquareIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  ArrowRightEndOnRectangleIcon,
  CogIcon,
  EllipsisHorizontalCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "../../shared/store/hooks";
import { fetchConversations } from "./conversationsSlice";
import {
  setActiveConversation,
  setSearchQuery,
  setNewChatModalOpen,
  setNewGroupModalOpen,
  setProfilePanelOpen,
} from "../../shared/store/uiSlice";
import { logout } from "../auth/authSlice";
import { ConversationItem } from "./ConversationItem";
import { NewChatModal } from "./NewChatModal";
import { NewGroupModal } from "./NewGroupModal";
import { Avatar } from "../../shared/components/ui/Avatar";
import { Input } from "../../shared/components/ui/Input";
import { EmptyState } from "../../shared/components/ui/EmptyState";
import { Spinner } from "../../shared/components/ui/Spinner";
import { ContextMenuDrawer } from "../../shared/components/ui/ContextMenu";
import { cn } from "../../shared/utils/helpers";

export const Sidebar = memo(() => {
  const dispatch = useAppDispatch();
  const {
    items: convs,
    status,
    typingUsers,
  } = useAppSelector((s) => s.conversations);
  const {
    activeConversationId,
    sidebarOpen,
    searchQuery,
    newChatModalOpen,
    newGroupModalOpen,
  } = useAppSelector((s) => s.ui);
  const currentUser = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    if (status === "idle") dispatch(fetchConversations());
  }, [status, dispatch]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return convs;
    const q = searchQuery.toLowerCase();
    return convs.filter((c) => {
      const name =
        c.type === "group"
          ? (c.groupName ?? "")
          : (c.participants.find((p) => p._id !== currentUser?._id)?.username ??
            "");
      return name.toLowerCase().includes(q);
    });
  }, [convs, searchQuery, currentUser?._id]);

  const menuItems = [
    {
      label: "Profile",
      icon: <Cog6ToothIcon className="w-4 h-4" />,
      onClick: () => dispatch(setProfilePanelOpen(true)),
    },
    {
      label: "More",
      icon: <EllipsisHorizontalCircleIcon className="w-4 h-4" />,
      onClick: () => dispatch(setProfilePanelOpen(true)),
    },
    {
      label: "Settings",
      icon: <CogIcon className="w-4 h-4" />,
      onClick: () => dispatch(setProfilePanelOpen(true)),
    },
    {
      label: "Privacy",
      icon: <InformationCircleIcon className="w-4 h-4" />,
      onClick: () => dispatch(setProfilePanelOpen(true)),
    },
    {
      label: "Sign out",
      icon: <ArrowRightEndOnRectangleIcon className="w-4 h-4" />,
      onClick: () => dispatch(logout()),
      danger: true,
    },
  ];

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "flex flex-col h-full w-full md:w-85 shrink-0",
              "bg-surface-secondary border-r border-white/5",
              "absolute md:relative z-20",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 bg-linear-to-r from-amber-400 to-amber-600 text-gray-50">
              <ContextMenuDrawer
                items={menuItems}
                trigger={
                  <button className="flex items-center gap-2 transition-opacity">
                    <Avatar
                      user={currentUser ?? undefined}
                      size="sm"
                      showStatus
                      status="online"
                    />
                    <span className="text-sm font-semibold text-gray-100 hidden xs:block">
                      {currentUser?.username}
                    </span>
                  </button>
                }
              />

              <div className="flex items-center gap-1">
                <button
                  onClick={() => dispatch(setNewGroupModalOpen(true))}
                  className="p-2 rounded-lg hover:bg-surface-elevated text-gray-200 hover:text-gray-50 transition-colors"
                  title="New group"
                >
                  <UserGroupIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => dispatch(setNewChatModalOpen(true))}
                  className="p-2 rounded-lg hover:bg-surface-elevated text-gray-200 hover:text-gray-50 transition-colors"
                  title="New chat"
                >
                  <PencilSquareIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-3 py-2.5 bg-black/80 text-white/80">
              <Input
                placeholder="Search conversations…"
                leftIcon={<MagnifyingGlassIcon className="w-4 h-4" />}
                value={searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              />
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto px-2 py-1 bg-black/90 text-gray-100">
              {status === "loading" && convs.length === 0 && (
                <div className="flex justify-center py-12">
                  <Spinner />
                </div>
              )}
              {status === "succeeded" && filtered.length === 0 && (
                <EmptyState
                  icon={<MagnifyingGlassIcon className="w-10 h-10" />}
                  title={
                    searchQuery
                      ? "No matching conversations"
                      : "No conversations yet"
                  }
                  description={
                    searchQuery
                      ? "Try a different search"
                      : "Start a new chat or group"
                  }
                />
              )}
              <AnimatePresence>
                {filtered.map((conv) => {
                  const typingIds = typingUsers[conv._id] ?? [];
                  const typingNames = typingIds
                    .map(
                      (id) =>
                        conv.participants.find((p) => p._id === id)?.username,
                    )
                    .filter(Boolean) as string[];

                  return (
                    <ConversationItem
                      key={conv._id}
                      conversation={conv}
                      currentUserId={currentUser?._id ?? ""}
                      isActive={activeConversationId === conv._id}
                      typingUsernames={typingNames}
                      onClick={() => dispatch(setActiveConversation(conv._id))}
                    />
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <NewChatModal open={newChatModalOpen} />
      <NewGroupModal open={newGroupModalOpen} />
    </>
  );
});

Sidebar.displayName = "Sidebar";

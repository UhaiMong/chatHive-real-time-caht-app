import { useState, useEffect, useRef } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Modal } from "../../shared/components/ui/Modal";
import { Input } from "../../shared/components/ui/Input";
import { Avatar } from "../../shared/components/ui/Avatar";
import { Spinner } from "../../shared/components/ui/Spinner";
import { EmptyState } from "../../shared/components/ui/EmptyState";
import { usersApi } from "../../shared/services/apiServices";
import { useAppDispatch } from "../../shared/store/hooks";
import { getOrCreateDirect } from "./conversationsSlice";
import {
  setActiveConversation,
  setNewChatModalOpen,
} from "../../shared/store/uiSlice";
import type { User } from "../../shared/types";

interface NewChatModalProps {
  open: boolean;
}

export const NewChatModal = ({ open }: NewChatModalProps) => {
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await usersApi.search(query);
        setResults(res.data.data ?? []);
      } catch {
        /* noop */
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelect = async (user: User) => {
    const result = await dispatch(getOrCreateDirect(user._id));
    if (getOrCreateDirect.fulfilled.match(result)) {
      dispatch(setActiveConversation(result.payload._id));
    }
    dispatch(setNewChatModalOpen(false));
    setQuery("");
    setResults([]);
  };

  const onClose = () => {
    dispatch(setNewChatModalOpen(false));
    setQuery("");
    setResults([]);
  };

  return (
    <Modal open={open} onClose={onClose} title="New Chat" size="sm">
      <div className="p-4 flex flex-col gap-3">
        <Input
          placeholder="Search by name or email…"
          leftIcon={<MagnifyingGlassIcon className="w-4 h-4" />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        <div className="min-h-50 max-h-80 overflow-y-auto -mx-1 px-1">
          {loading && (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          )}
          {!loading && results.length === 0 && query.trim() && (
            <EmptyState
              title="No users found"
              description="Try a different search"
            />
          )}
          {!loading && !query.trim() && (
            <EmptyState
              title="Search for people"
              description="Find users to start chatting"
            />
          )}
          {!loading &&
            results.map((user) => (
              <button
                key={user._id}
                onClick={() => handleSelect(user)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-elevated transition-colors text-left"
              >
                <Avatar user={user} size="sm" showStatus status={user.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-100 truncate">
                    {user.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </button>
            ))}
        </div>
      </div>
    </Modal>
  );
};

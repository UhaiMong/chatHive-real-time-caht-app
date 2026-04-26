import { useState, useEffect, useRef } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Modal } from "../../shared/components/ui/Modal";
import { Input } from "../../shared/components/ui/Input";
import { Button } from "../../shared/components/ui/Button";
import { Avatar } from "../../shared/components/ui/Avatar";
import { Spinner } from "../../shared/components/ui/Spinner";
import { usersApi } from "../../shared/services/apiServices";
import { useAppDispatch } from "../../shared/store/hooks";
import { createGroup } from "./conversationsSlice";
import {
  setActiveConversation,
  setNewGroupModalOpen,
} from "../../shared/store/uiSlice";
import { addNotification } from "../notifications/notificationsSlice";
import type { User } from "../../shared/types";

interface NewGroupModalProps {
  open: boolean;
}

export const NewGroupModal = ({ open }: NewGroupModalProps) => {
  const dispatch = useAppDispatch();
  const [groupName, setGroupName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const toggle = (user: User) => {
    setSelected((prev) =>
      prev.some((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user],
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selected.length < 2) {
      dispatch(
        addNotification({
          type: "warning",
          message: "Group needs a name and at least 2 members",
        }),
      );
      return;
    }
    setSubmitting(true);
    try {
      const result = await dispatch(
        createGroup({
          name: groupName.trim(),
          participantIds: selected.map((u) => u._id),
        }),
      );
      if (createGroup.fulfilled.match(result)) {
        dispatch(setActiveConversation(result.payload._id));
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const onClose = () => {
    dispatch(setNewGroupModalOpen(false));
    setGroupName("");
    setQuery("");
    setSelected([]);
    setResults([]);
  };

  return (
    <Modal open={open} onClose={onClose} title="New Group" size="sm">
      <div className="p-4 flex flex-col gap-4 border border-gray-200">
        <Input
          className="text-gray-200 border border-gray-200"
          placeholder="Group name…"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          autoFocus
        />

        {selected.length > 0 && (
          <div>
            <p className="text-gray-200 font-semibold mb-1.5">Group Member</p>
            <div className="flex flex-wrap gap-2">
              {selected.map((u) => (
                <span
                  key={u._id}
                  className="flex items-center gap-1.5 bg-primary-600/20 text-primary-300 text-xs rounded-full pl-2.5 pr-1.5 py-1 text-gray-200"
                >
                  {u.username}
                  <button
                    onClick={() => toggle(u)}
                    className="hover:text-white transition-colors"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <Input
          placeholder="Search people to add…"
          className="text-gray-200"
          leftIcon={<MagnifyingGlassIcon className="w-4 h-4" />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="min-h-40 max-h-60 overflow-y-auto -mx-1 px-1">
          {loading && (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          )}
          {!loading &&
            results.map((user) => {
              const isSelected = selected.some((u) => u._id === user._id);
              return (
                <button
                  key={user._id}
                  onClick={() => toggle(user)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
                    isSelected
                      ? "bg-primary-600/10"
                      : "hover:bg-surface-elevated"
                  }`}
                >
                  <Avatar user={user} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-100 truncate">
                      {user.username}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
        </div>

        <Button
          onClick={handleCreate}
          loading={submitting}
          disabled={!groupName.trim() || selected.length < 2}
          className="w-full cursor-pointer font-semibold bg-green-400 text-gray-50"
        >
          Create ({selected.length} members)
        </Button>
      </div>
    </Modal>
  );
};

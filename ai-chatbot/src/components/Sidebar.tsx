"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  Plus,
  Trash2,
  MessageSquare,
  X,
  LogOut,
} from "lucide-react";
import {
  getChatSessions,
  createChatSession,
  deleteChatSession,
  signOutUser,
  type ChatSession,
} from "@/lib/firebase";
import type { User } from "firebase/auth";

interface Props {
  user: User;
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  user,
  currentChatId,
  onSelectChat,
  onNewChat,
  isOpen,
  onClose,
}: Props) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.uid]);

  const loadSessions = async () => {
    setLoading(true);
    const data = await getChatSessions(user.uid);
    setSessions(data);
    setLoading(false);
  };

  const handleNewChat = async () => {
    const id = await createChatSession(user.uid, "New Chat");
    await loadSessions();
    onNewChat(id);
    onClose();
  };

  const handleDelete = async (
    e: React.MouseEvent,
    chatId: string
  ) => {
    e.stopPropagation();
    await deleteChatSession(user.uid, chatId);
    await loadSessions();
    if (currentChatId === chatId) onNewChat("");
  };

  const handleSignOut = async () => {
    await signOutUser();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-30 flex w-72 flex-col bg-gray-900 border-r border-gray-800 transition-transform duration-300 ease-in-out",
          "lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white">AI Chatbot</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-3 py-3">
          <button
            onClick={handleNewChat}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {loading ? (
            <div className="space-y-2 pt-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded-lg bg-gray-800"
                />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="pt-4 text-center text-xs text-gray-600">
              No chats yet. Start one!
            </p>
          ) : (
            <ul className="space-y-1 pt-1">
              {sessions.map((session) => (
                <li key={session.id}>
                  {/* ✅ div instead of button — fixes nested button error */}
                  <div
                    onClick={() => {
                      onSelectChat(session.id);
                      onClose();
                    }}
                    className={clsx(
                      "group flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
                      currentChatId === session.id
                        ? "bg-indigo-600/20 text-indigo-300"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <span className="truncate">{session.title}</span>
                    </div>
                    {/* Delete button — no longer nested inside a button */}
                    <button
                      onClick={(e) => handleDelete(e, session.id)}
                      className="hidden shrink-0 rounded p-1 text-gray-600 hover:text-red-400 group-hover:flex"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* User Footer */}
        <div className="border-t border-gray-800 px-3 py-3">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-gray-800/60 px-3 py-2">
            <div className="flex items-center gap-2 truncate">
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt="avatar"
                  className="h-7 w-7 rounded-full"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">
                  {user.displayName?.[0] ?? "U"}
                </div>
              )}
              <span className="truncate text-xs text-gray-300">
                {user.displayName ?? user.email}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-700 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
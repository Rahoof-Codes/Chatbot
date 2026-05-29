"use client";

import ReactMarkdown from "react-markdown";
import clsx from "clsx";
import { Bot, User } from "lucide-react";
import type { Message } from "@/lib/firebase";

interface Props {
  message: Message;
  isStreaming?: boolean;
}

export default function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === "user";

  return (
    <div
      className={clsx(
        "flex w-full gap-3 px-4 py-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar — Assistant only */}
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
          <Bot className="h-4 w-4" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={clsx(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-indigo-600 text-white"
            : "rounded-tl-sm bg-gray-800 text-gray-100"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {/* Streaming cursor */}
        {isStreaming && !isUser && (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-indigo-400" />
        )}
      </div>

      {/* Avatar — User only */}
      {isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-700 text-white">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
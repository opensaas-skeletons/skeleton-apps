import type { Message } from "@shared/types/ai";

interface UserMessageProps {
  message: Message;
}

export default function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-surface-200 flex items-center justify-center shrink-0 mt-0.5">
        <svg className="w-4 h-4 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-surface-100 rounded-lg px-4 py-3">
          <p className="text-sm text-surface-800 whitespace-pre-wrap">{message.content}</p>
        </div>
        <p className="text-xs text-surface-400 mt-1 px-1">
          {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

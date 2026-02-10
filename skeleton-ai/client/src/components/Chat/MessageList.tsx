import { useRef, useEffect, useState } from "react";
import type { Message } from "@shared/types/ai";
import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";
import StreamingCursor from "./StreamingCursor";

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
}

export default function MessageList({ messages, isStreaming, streamingContent }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-6"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.map((msg) =>
          msg.role === "user" ? (
            <UserMessage key={msg.id} message={msg} />
          ) : (
            <AssistantMessage key={msg.id} message={msg} />
          )
        )}

        {isStreaming && streamingContent && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="markdown-content text-sm text-surface-800 whitespace-pre-wrap">
                {streamingContent}
                <StreamingCursor />
              </div>
            </div>
          </div>
        )}

        {isStreaming && !streamingContent && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div className="flex items-center gap-1 py-2">
              <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-8 w-10 h-10 bg-white border border-surface-200 rounded-full shadow-card flex items-center justify-center text-surface-500 hover:text-surface-700 hover:shadow-card-hover transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </div>
  );
}

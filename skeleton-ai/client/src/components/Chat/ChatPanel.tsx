import { useState } from "react";
import type { Message, Source, RetrievalResult } from "@shared/types/ai";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import SuggestionChips from "./SuggestionChips";

interface ChatPanelProps {
  conversationId: string | null;
  conversationTitle: string;
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  sources: Source[];
  onSendMessage: (content: string, sourceIds?: string[]) => void;
  onStopGeneration: () => void;
  onRenameConversation: (title: string) => void;
  onViewSettings: () => void;
}

export default function ChatPanel({
  conversationId,
  conversationTitle,
  messages,
  isStreaming,
  streamingContent,
  sources,
  onSendMessage,
  onStopGeneration,
  onRenameConversation,
  onViewSettings,
}: ChatPanelProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");

  const handleStartEdit = () => {
    setEditTitle(conversationTitle);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle.trim() !== conversationTitle) {
      onRenameConversation(editTitle.trim());
    }
    setIsEditingTitle(false);
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="h-14 border-b border-surface-200 flex items-center justify-between px-4">
          <h1 className="text-sm font-semibold text-surface-700">Chat</h1>
          <button
            onClick={onViewSettings}
            className="p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        <SuggestionChips
          sources={sources}
          onSendMessage={onSendMessage}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="h-14 border-b border-surface-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 min-w-0">
          {isEditingTitle ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle();
                if (e.key === "Escape") setIsEditingTitle(false);
              }}
              autoFocus
              className="text-sm font-semibold text-surface-700 bg-transparent border-b border-brand-400 focus:outline-none px-0 py-0"
            />
          ) : (
            <h1
              onClick={handleStartEdit}
              className="text-sm font-semibold text-surface-700 truncate cursor-pointer hover:text-brand-600 transition-colors"
              title="Click to rename"
            >
              {conversationTitle || "Untitled Chat"}
            </h1>
          )}
        </div>
        <button
          onClick={onViewSettings}
          className="p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        isStreaming={isStreaming}
        streamingContent={streamingContent}
      />

      {/* Input */}
      <ChatInput
        sources={sources}
        isStreaming={isStreaming}
        onSendMessage={onSendMessage}
        onStopGeneration={onStopGeneration}
      />
    </div>
  );
}

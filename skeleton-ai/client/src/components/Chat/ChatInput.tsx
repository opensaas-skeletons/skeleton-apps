import { useState, useRef, useEffect, useCallback } from "react";
import type { Source } from "@shared/types/ai";

interface ChatInputProps {
  sources: Source[];
  isStreaming: boolean;
  onSendMessage: (content: string, sourceIds?: string[]) => void;
  onStopGeneration: () => void;
}

export default function ChatInput({ sources, isStreaming, onSendMessage, onStopGeneration }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [showSourceFilter, setShowSourceFilter] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [content, adjustHeight]);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || isStreaming) return;
    onSendMessage(trimmed, selectedSourceIds.length > 0 ? selectedSourceIds : undefined);
    setContent("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleSource = (id: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const readySources = sources.filter((s) => s.status === "ready");

  return (
    <div className="border-t border-surface-200 bg-white px-4 py-3">
      <div className="max-w-3xl mx-auto">
        {/* Source filter */}
        {showSourceFilter && readySources.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {readySources.map((source) => (
              <button
                key={source.id}
                onClick={() => toggleSource(source.id)}
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border transition-colors ${
                  selectedSourceIds.includes(source.id)
                    ? "bg-brand-100 border-brand-300 text-brand-700"
                    : "bg-white border-surface-200 text-surface-500 hover:border-surface-300"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                {source.title}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Source filter toggle */}
          {readySources.length > 0 && (
            <button
              onClick={() => setShowSourceFilter(!showSourceFilter)}
              className={`p-2 rounded-lg transition-colors shrink-0 mb-0.5 ${
                showSourceFilter || selectedSourceIds.length > 0
                  ? "text-brand-600 bg-brand-50"
                  : "text-surface-400 hover:text-surface-600 hover:bg-surface-100"
              }`}
              title="Filter sources"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
              </svg>
              {selectedSourceIds.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] bg-brand-600 text-white rounded-full flex items-center justify-center">
                  {selectedSourceIds.length}
                </span>
              )}
            </button>
          )}

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              disabled={isStreaming}
              rows={1}
              className="w-full resize-none px-4 py-3 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 disabled:opacity-50 disabled:cursor-not-allowed placeholder-surface-400"
            />
          </div>

          {/* Send / Stop button */}
          {isStreaming ? (
            <button
              onClick={onStopGeneration}
              className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors shrink-0 mb-0.5"
              title="Stop generation"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!content.trim()}
              className="p-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-surface-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0 mb-0.5"
              title="Send message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          )}
        </div>

        <p className="text-xs text-surface-400 mt-1.5 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
import type { Message } from "@shared/types/ai";
import MarkdownRenderer from "../Shared/MarkdownRenderer";
import SourcesPanel from "./SourcesPanel";

interface AssistantMessageProps {
  message: Message;
}

export default function AssistantMessage({ message }: AssistantMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="flex gap-3 group">
      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0 mt-0.5">
        <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <MarkdownRenderer
          content={message.content}
          sources={message.sources}
        />

        {message.sources && message.sources.length > 0 && (
          <SourcesPanel sources={message.sources} />
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="p-1.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
            )}
          </button>
          <span className="text-xs text-surface-400 px-1">
            {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {message.model && (
            <span className="text-xs text-surface-400 bg-surface-100 px-1.5 py-0.5 rounded">
              {message.model}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

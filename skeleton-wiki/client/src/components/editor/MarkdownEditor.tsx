import { useState, useRef, useEffect } from "react";
import type { Page } from "@shared/types/wiki";

interface Props {
  page: Page;
  onSave: (title: string, content: string) => void;
  onCancel: () => void;
}

export default function MarkdownEditor({ page, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        onSave(title, content);
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [title, content, onSave, onCancel]);

  // Handle tab for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newContent = content.substring(0, start) + "  " + content.substring(end);
      setContent(newContent);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-surface-200 bg-white shrink-0">
        <div className="flex items-center gap-2 text-sm text-surface-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editing
          <span className="text-surface-300">|</span>
          <span className="text-xs text-surface-400">Ctrl+S to save, Esc to cancel</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-xs font-medium text-surface-600 hover:bg-surface-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(title, content)}
            className="px-3 py-1 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-6">
          {/* Title input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Page title..."
            className="w-full text-2xl font-bold text-surface-900 outline-none mb-4 placeholder-surface-300"
          />

          {/* Content textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Start writing with Markdown..."
            className="w-full min-h-[calc(100vh-200px)] text-sm text-surface-700 font-mono leading-relaxed outline-none resize-none placeholder-surface-300"
          />
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import type { Conversation, Source } from "@shared/types/ai";

interface SidebarProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  sources: Source[];
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (id: string, title: string) => void;
  onDeleteConversation: (id: string) => void;
  onViewSources: () => void;
  onViewSync: () => void;
  onViewSettings: () => void;
  onCollapse: () => void;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function statusColor(status: Source["status"]): string {
  switch (status) {
    case "ready": return "bg-green-400";
    case "ingesting": return "bg-yellow-400";
    case "error": return "bg-red-400";
    default: return "bg-surface-400";
  }
}

export default function Sidebar({
  conversations,
  selectedConversationId,
  sources,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  onViewSources,
  onViewSync,
  onViewSettings,
  onCollapse,
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-surface-900 text-white">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-surface-700">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
          <span className="font-semibold text-sm">Skeleton AI</span>
        </div>
        <button
          onClick={onCollapse}
          className="p-1 hover:bg-surface-700 rounded transition-colors"
          title="Collapse sidebar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 py-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <input
          type="text"
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-1.5 text-xs bg-surface-800 border border-surface-700 text-white placeholder-surface-500 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2">
        {filtered.map((conv) => (
          <div
            key={conv.id}
            className={`group relative flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm mb-0.5 ${
              conv.id === selectedConversationId
                ? "bg-surface-700 text-white"
                : "text-surface-300 hover:bg-surface-800 hover:text-white"
            }`}
            onClick={() => onSelectConversation(conv.id)}
          >
            <svg className="w-4 h-4 shrink-0 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            <span className="truncate flex-1">{conv.title || "Untitled"}</span>
            <span className="text-xs text-surface-500 shrink-0">
              {formatRelativeDate(conv.updated_at)}
            </span>

            {/* Context menu button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpenId(menuOpenId === conv.id ? null : conv.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-surface-600 rounded transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {menuOpenId === conv.id && (
              <div className="absolute right-0 top-full mt-1 z-10 bg-surface-800 border border-surface-600 rounded-md shadow-lg py-1 min-w-[120px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(null);
                    const newTitle = window.prompt("Rename conversation:", conv.title);
                    if (newTitle) onRenameConversation(conv.id, newTitle);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-surface-300 hover:bg-surface-700 hover:text-white"
                >
                  Rename
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(null);
                    if (window.confirm("Delete this conversation?")) {
                      onDeleteConversation(conv.id);
                    }
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-surface-700"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-xs text-surface-500 text-center py-4">
            {search ? "No matching conversations" : "No conversations yet"}
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-surface-700 mx-3" />

      {/* Sources section */}
      <div className="px-3 py-2">
        <button
          onClick={onViewSources}
          className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
            Sources
          </span>
          <span className="bg-surface-700 text-surface-300 px-1.5 py-0.5 rounded text-xs font-mono">
            {sources.length}
          </span>
        </button>
        {sources.slice(0, 3).map((source) => (
          <div
            key={source.id}
            className="flex items-center gap-2 px-2 py-1 text-xs text-surface-500"
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor(source.status)}`} />
            <span className="truncate">{source.title}</span>
          </div>
        ))}
        {sources.length > 3 && (
          <p className="text-xs text-surface-600 px-2">+{sources.length - 3} more</p>
        )}
      </div>

      {/* Sync */}
      <div className="px-3 py-1">
        <button
          onClick={onViewSync}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          GitHub Sync
        </button>
      </div>

      {/* Settings */}
      <div className="px-3 pb-3">
        <button
          onClick={onViewSettings}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import type { PageTreeNode } from "@shared/types/wiki";
import PageTree from "./PageTree";
import { useSearch } from "../../hooks/usePages";

interface Props {
  workspaceId: string;
  tree: PageTreeNode[];
  loading: boolean;
  selectedPageId: string | null;
  onSelectPage: (id: string) => void;
  onCreatePage: (parentId?: string | null) => void;
  onDeletePage: (id: string) => void;
  onNavigateToSlug: (slug: string) => void;
}

export default function Sidebar({
  workspaceId,
  tree,
  loading,
  selectedPageId,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  onNavigateToSlug,
}: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { query, setQuery, results, searching } = useSearch(workspaceId);
  const searchRef = useRef<HTMLInputElement>(null);

  // Ctrl+K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchOpen, setQuery]);

  return (
    <aside className="w-64 bg-white border-r border-surface-200 flex flex-col shrink-0 overflow-hidden">
      {/* Search bar */}
      <div className="px-3 py-2 border-b border-surface-100">
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-surface-400 bg-surface-50 rounded-md cursor-pointer hover:bg-surface-100 transition-colors"
          onClick={() => {
            setSearchOpen(true);
            setTimeout(() => searchRef.current?.focus(), 50);
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Search...</span>
          <span className="ml-auto text-xs text-surface-300">Ctrl+K</span>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="absolute inset-0 z-40 bg-black/30" onClick={() => { setSearchOpen(false); setQuery(""); }}>
          <div
            className="absolute top-12 left-4 right-4 max-w-lg mx-auto bg-white rounded-xl shadow-xl border border-surface-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-100">
              <svg className="w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages..."
                className="flex-1 text-sm outline-none"
                autoFocus
              />
              {searching && (
                <span className="text-xs text-surface-400">Searching...</span>
              )}
            </div>
            {results.length > 0 && (
              <div className="max-h-80 overflow-y-auto">
                {results.map((r) => (
                  <button
                    key={r.page.id}
                    onClick={() => {
                      onSelectPage(r.page.id);
                      setSearchOpen(false);
                      setQuery("");
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-surface-50 transition-colors border-b border-surface-50 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{r.page.icon}</span>
                      <span className="text-sm font-medium text-surface-800">{r.page.title}</span>
                      <span className="text-xs text-surface-400 capitalize">{r.match_type}</span>
                    </div>
                    {r.snippet && (
                      <p className="text-xs text-surface-500 mt-0.5 line-clamp-1">{r.snippet.replace(/\*\*/g, "")}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
            {query && !searching && results.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-surface-400">
                No results found
              </div>
            )}
          </div>
        </div>
      )}

      {/* New page button */}
      <div className="px-3 py-2">
        <button
          onClick={() => onCreatePage(null)}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-sm font-medium text-surface-600 hover:bg-surface-50 rounded-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Page
        </button>
      </div>

      {/* Page tree */}
      <div className="flex-1 overflow-y-auto px-1 pb-4">
        {loading ? (
          <div className="px-3 py-4 text-sm text-surface-400">Loading...</div>
        ) : tree.length === 0 ? (
          <div className="px-3 py-4 text-sm text-surface-400 text-center">
            No pages yet
          </div>
        ) : (
          <PageTree
            nodes={tree}
            selectedPageId={selectedPageId}
            onSelectPage={onSelectPage}
            onCreatePage={onCreatePage}
            onDeletePage={onDeletePage}
            depth={0}
          />
        )}
      </div>
    </aside>
  );
}

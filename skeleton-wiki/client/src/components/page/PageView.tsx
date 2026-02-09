import { useState } from "react";
import type { Page } from "@shared/types/wiki";
import PageContent from "./PageContent";
import MarkdownEditor from "../editor/MarkdownEditor";
import VersionHistoryModal from "../modals/VersionHistoryModal";

interface Props {
  page: Page;
  loading: boolean;
  editing: boolean;
  backlinks: Page[];
  onEdit: () => void;
  onSave: (id: string, title: string, content: string) => void;
  onCancel: () => void;
  onNavigateToSlug: (slug: string) => void;
  onNavigateToPage: (id: string) => void;
  onRefresh: () => void;
}

export default function PageView({
  page,
  loading,
  editing,
  backlinks,
  onEdit,
  onSave,
  onCancel,
  onNavigateToSlug,
  onNavigateToPage,
  onRefresh,
}: Props) {
  const [showVersions, setShowVersions] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-surface-400">
        Loading...
      </div>
    );
  }

  if (editing) {
    return (
      <MarkdownEditor
        page={page}
        onSave={(title, content) => onSave(page.id, title, content)}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-8 py-6">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">{page.icon}</span>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">{page.title}</h1>
            <p className="text-xs text-surface-400 mt-1">
              Last updated {new Date(page.updated_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowVersions(true)}
            className="px-2.5 py-1 text-xs font-medium text-surface-500 hover:bg-surface-100 rounded-md transition-colors"
            title="Version history"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={onEdit}
            className="px-3 py-1 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Page content */}
      <PageContent content={page.content} onNavigateToSlug={onNavigateToSlug} />

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <div className="mt-8 pt-6 border-t border-surface-200">
          <h3 className="text-sm font-semibold text-surface-500 mb-2">
            Pages that link here ({backlinks.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {backlinks.map((bl) => (
              <button
                key={bl.id}
                onClick={() => onNavigateToPage(bl.id)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-md transition-colors"
              >
                <span className="text-xs">{bl.icon}</span>
                {bl.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showVersions && (
        <VersionHistoryModal
          pageId={page.id}
          onClose={() => setShowVersions(false)}
          onRestore={() => {
            setShowVersions(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

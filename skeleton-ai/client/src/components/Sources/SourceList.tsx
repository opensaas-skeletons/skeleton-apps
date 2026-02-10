import { useState } from "react";
import type { Source } from "@shared/types/ai";
import SourceForm from "./SourceForm";
import IngestionProgress from "./IngestionProgress";

interface SourceListProps {
  sources: Source[];
  loading: boolean;
  onSelectSource: (id: string) => void;
  onCreate: (input: { title: string; description?: string; source_type: "directory" | "url"; config: Record<string, any> }) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
  onIngest: (id: string) => Promise<void>;
}

function statusBadge(status: Source["status"]) {
  switch (status) {
    case "ready":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Ready</span>;
    case "ingesting":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Ingesting</span>;
    case "error":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">Error</span>;
    default:
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-surface-100 text-surface-600">Pending</span>;
  }
}

export default function SourceList({
  sources,
  loading,
  onSelectSource,
  onCreate,
  onDelete,
  onIngest,
}: SourceListProps) {
  const [showForm, setShowForm] = useState(false);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-surface-400 text-sm">Loading sources...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-surface-800">Sources</h2>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Source
          </button>
        </div>

        {sources.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-surface-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-surface-700 mb-1">No sources yet</h3>
            <p className="text-sm text-surface-500">Add a directory or URL to start indexing documents.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {sources.map((source) => (
              <div
                key={source.id}
                className="bg-white border border-surface-200 rounded-xl p-4 shadow-card hover:shadow-card-hover transition-shadow cursor-pointer"
                onClick={() => onSelectSource(source.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-surface-800">{source.title}</h3>
                    {source.description && (
                      <p className="text-xs text-surface-500 mt-0.5 line-clamp-1">{source.description}</p>
                    )}
                  </div>
                  {statusBadge(source.status)}
                </div>

                {source.status === "ingesting" && (
                  <IngestionProgress />
                )}

                {source.error_message && (
                  <p className="text-xs text-red-600 mt-2 bg-red-50 px-2 py-1 rounded">{source.error_message}</p>
                )}

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-4 text-xs text-surface-500">
                    <span>{source.document_count} docs</span>
                    <span>{source.chunk_count} chunks</span>
                    <span className="capitalize">{source.source_type}</span>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onIngest(source.id)}
                      disabled={source.status === "ingesting"}
                      className="px-2 py-1 text-xs text-brand-600 hover:bg-brand-50 rounded transition-colors disabled:opacity-50"
                    >
                      Ingest
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete source "${source.title}"?`)) {
                          onDelete(source.id);
                        }
                      }}
                      className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <SourceForm
            onSubmit={async (input) => {
              await onCreate(input);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import type { Source, Document } from "@shared/types/ai";
import * as api from "../../api/client";
import IngestionProgress from "./IngestionProgress";
import SourceViewer from "./SourceViewer";

interface SourceDetailProps {
  sourceId: string;
  source: Source;
  onBack: () => void;
  onIngest: (id: string) => Promise<void>;
}

export default function SourceDetail({ sourceId, source, onBack, onIngest }: SourceDetailProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const docs = await api.listDocuments(sourceId);
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoading(false);
    }
  }, [sourceId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Sources
        </button>

        {/* Source info */}
        <div className="bg-white border border-surface-200 rounded-xl p-5 shadow-card mb-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-surface-800">{source.title}</h2>
              {source.description && (
                <p className="text-sm text-surface-500 mt-1">{source.description}</p>
              )}
            </div>
            <button
              onClick={() => onIngest(sourceId)}
              disabled={source.status === "ingesting"}
              className="px-3 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-surface-300 rounded-lg transition-colors"
            >
              Re-ingest
            </button>
          </div>

          {source.status === "ingesting" && <IngestionProgress />}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-xs text-surface-500">Type</p>
              <p className="text-sm font-medium text-surface-700 capitalize">{source.source_type}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500">Status</p>
              <p className="text-sm font-medium text-surface-700 capitalize">{source.status}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500">Documents</p>
              <p className="text-sm font-medium text-surface-700">{source.document_count}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500">Chunks</p>
              <p className="text-sm font-medium text-surface-700">{source.chunk_count}</p>
            </div>
          </div>

          {source.config && Object.keys(source.config).length > 0 && (
            <div className="mt-4 pt-4 border-t border-surface-100">
              <p className="text-xs text-surface-500 mb-1">Config</p>
              <pre className="text-xs text-surface-600 bg-surface-50 rounded-md px-3 py-2 font-mono">
                {JSON.stringify(source.config, null, 2)}
              </pre>
            </div>
          )}

          {source.error_message && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <p className="text-xs text-red-700">{source.error_message}</p>
            </div>
          )}
        </div>

        {/* Documents table */}
        <h3 className="text-sm font-semibold text-surface-700 mb-3">
          Documents ({documents.length})
        </h3>

        {loading ? (
          <div className="text-sm text-surface-400">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-sm text-surface-500">
            No documents found. Try ingesting this source.
          </div>
        ) : (
          <div className="bg-white border border-surface-200 rounded-xl overflow-hidden shadow-card">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200">
                  <th className="text-left text-xs font-medium text-surface-500 px-4 py-2.5">File Path</th>
                  <th className="text-left text-xs font-medium text-surface-500 px-4 py-2.5">Type</th>
                  <th className="text-right text-xs font-medium text-surface-500 px-4 py-2.5">Chunks</th>
                  <th className="text-left text-xs font-medium text-surface-500 px-4 py-2.5">Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => setViewingDocId(doc.id)}
                    className="hover:bg-surface-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2.5 text-sm font-mono text-surface-700 truncate max-w-[300px]">
                      {doc.file_path}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-surface-500">{doc.file_type}</td>
                    <td className="px-4 py-2.5 text-sm text-surface-500 text-right">{doc.chunk_count}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-surface-400 truncate max-w-[120px]">
                      {doc.content_hash.slice(0, 12)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Document viewer modal */}
        {viewingDocId && (
          <SourceViewer
            documentId={viewingDocId}
            onClose={() => setViewingDocId(null)}
          />
        )}
      </div>
    </div>
  );
}

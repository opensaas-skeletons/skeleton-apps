import { useState, useEffect } from "react";
import * as api from "../../api/client";
import type { Document } from "@shared/types/ai";

interface SourceViewerProps {
  documentId: string;
  onClose: () => void;
}

export default function SourceViewer({ documentId, onClose }: SourceViewerProps) {
  const [document, setDocument] = useState<Document | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [doc, docContent] = await Promise.all([
          api.getDocument(documentId),
          api.getDocumentContent(documentId),
        ]);
        setDocument(doc);
        setContent(docContent);
      } catch (err) {
        console.error("Failed to load document:", err);
        setContent("Failed to load document content.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [documentId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-surface-200">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-surface-800 truncate">
              {document?.file_path || "Loading..."}
            </h3>
            {document && (
              <p className="text-xs text-surface-500 mt-0.5">
                {document.file_type} &middot; {document.chunk_count} chunks
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="text-sm text-surface-400">Loading content...</div>
          ) : (
            <pre className="text-xs text-surface-700 bg-surface-50 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
              {content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

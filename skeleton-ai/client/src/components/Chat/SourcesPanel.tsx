import { useState } from "react";
import type { RetrievalResult } from "@shared/types/ai";

interface SourcesPanelProps {
  sources: RetrievalResult[];
}

export default function SourcesPanel({ sources }: SourcesPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);

  return (
    <div className="mt-3 border border-surface-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-surface-50 hover:bg-surface-100 transition-colors text-sm"
      >
        <span className="text-surface-600 font-medium">
          {sources.length} source{sources.length !== 1 ? "s" : ""} used
        </span>
        <svg
          className={`w-4 h-4 text-surface-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="divide-y divide-surface-100">
          {sources.map((source, idx) => (
            <div
              key={source.chunk_id}
              className="px-3 py-2 hover:bg-surface-50 cursor-pointer transition-colors"
              onClick={() =>
                setExpandedSourceId(expandedSourceId === source.chunk_id ? null : source.chunk_id)
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold text-brand-600 bg-brand-100 rounded-full shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-mono text-surface-600 truncate">
                    {source.file_path}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs text-surface-500">{source.source_title}</span>
                  <span className="text-xs text-brand-600 font-medium">
                    {Math.round(source.score * 100)}%
                  </span>
                </div>
              </div>

              {expandedSourceId !== source.chunk_id && (
                <p className="text-xs text-surface-500 mt-1 line-clamp-2 pl-7">
                  {source.content.slice(0, 150)}...
                </p>
              )}

              {expandedSourceId === source.chunk_id && (
                <div className="mt-2 pl-7">
                  <pre className="text-xs text-surface-700 bg-surface-100 rounded-md p-3 overflow-x-auto whitespace-pre-wrap font-mono">
                    {source.content}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

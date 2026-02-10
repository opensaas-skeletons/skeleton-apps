import type { Source } from "@shared/types/ai";

interface SuggestionChipsProps {
  sources: Source[];
  onSendMessage: (content: string) => void;
}

const SUGGESTIONS = [
  "How do I add auth to skeleton-tasks?",
  "Explain the interop standard",
  "What database schema does the CRM use?",
];

export default function SuggestionChips({ sources, onSendMessage }: SuggestionChipsProps) {
  const totalDocs = sources.reduce((sum, s) => sum + s.document_count, 0);
  const totalChunks = sources.reduce((sum, s) => sum + s.chunk_count, 0);

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* AI Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand-100 flex items-center justify-center">
          <svg className="w-9 h-9 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-surface-800 mb-2">
          Ask me anything about your codebase
        </h2>
        <p className="text-sm text-surface-500 mb-6">
          {sources.length > 0 ? (
            <>
              {sources.length} source{sources.length !== 1 ? "s" : ""},{" "}
              {totalDocs} document{totalDocs !== 1 ? "s" : ""},{" "}
              {totalChunks} chunk{totalChunks !== 1 ? "s" : ""} indexed
            </>
          ) : (
            "Add sources to get started with RAG-powered answers"
          )}
        </p>

        {/* Suggestion chips */}
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSendMessage(suggestion)}
              className="px-4 py-2 text-sm text-brand-600 border border-brand-200 hover:bg-brand-50 hover:border-brand-300 rounded-full transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

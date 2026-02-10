const DEFAULT_PROMPT = `You are a helpful AI assistant with access to a knowledge base. Use the provided context to answer questions accurately. If you're not sure about something, say so. Always cite your sources when using information from the knowledge base.`;

interface SystemPromptEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SystemPromptEditor({ value, onChange }: SystemPromptEditorProps) {
  return (
    <div className="bg-white border border-surface-200 rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-surface-800">System Prompt</h3>
        <button
          onClick={() => onChange(DEFAULT_PROMPT)}
          className="px-2 py-1 text-xs text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded transition-colors"
        >
          Reset to Default
        </button>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={DEFAULT_PROMPT}
        rows={6}
        className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 resize-y font-mono leading-relaxed"
      />

      <p className="text-xs text-surface-400 mt-1.5 text-right">
        {value.length} characters
      </p>
    </div>
  );
}

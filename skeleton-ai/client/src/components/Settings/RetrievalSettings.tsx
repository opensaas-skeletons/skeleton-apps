import type { Settings } from "@shared/types/ai";

interface RetrievalSettingsProps {
  settings: Settings;
  onChange: (key: string, value: any) => void;
}

export default function RetrievalSettings({ settings, onChange }: RetrievalSettingsProps) {
  return (
    <div className="bg-white border border-surface-200 rounded-xl p-5 shadow-card">
      <h3 className="text-sm font-semibold text-surface-800 mb-4">Retrieval Parameters</h3>

      <div className="space-y-5">
        {/* Top K */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-surface-600">Top K</label>
            <span className="text-xs font-mono text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
              {settings.top_k}
            </span>
          </div>
          <input
            type="range"
            min={3}
            max={20}
            step={1}
            value={settings.top_k}
            onChange={(e) => onChange("top_k", parseInt(e.target.value))}
            className="w-full h-1.5 bg-surface-200 rounded-full appearance-none cursor-pointer accent-brand-600"
          />
          <div className="flex justify-between text-[10px] text-surface-400 mt-0.5">
            <span>3</span>
            <span>20</span>
          </div>
        </div>

        {/* Similarity Threshold */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-surface-600">Similarity Threshold</label>
            <span className="text-xs font-mono text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
              {settings.similarity_threshold.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0.1}
            max={0.9}
            step={0.05}
            value={settings.similarity_threshold}
            onChange={(e) => onChange("similarity_threshold", parseFloat(e.target.value))}
            className="w-full h-1.5 bg-surface-200 rounded-full appearance-none cursor-pointer accent-brand-600"
          />
          <div className="flex justify-between text-[10px] text-surface-400 mt-0.5">
            <span>0.10</span>
            <span>0.90</span>
          </div>
        </div>

        {/* Temperature */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-surface-600">Temperature</label>
            <span className="text-xs font-mono text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
              {settings.temperature.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.temperature}
            onChange={(e) => onChange("temperature", parseFloat(e.target.value))}
            className="w-full h-1.5 bg-surface-200 rounded-full appearance-none cursor-pointer accent-brand-600"
          />
          <div className="flex justify-between text-[10px] text-surface-400 mt-0.5">
            <span>0</span>
            <span>1</span>
          </div>
        </div>

        {/* Max Tokens */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-surface-600">Max Tokens</label>
            <span className="text-xs font-mono text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
              {settings.max_tokens}
            </span>
          </div>
          <input
            type="range"
            min={256}
            max={4096}
            step={256}
            value={settings.max_tokens}
            onChange={(e) => onChange("max_tokens", parseInt(e.target.value))}
            className="w-full h-1.5 bg-surface-200 rounded-full appearance-none cursor-pointer accent-brand-600"
          />
          <div className="flex justify-between text-[10px] text-surface-400 mt-0.5">
            <span>256</span>
            <span>4096</span>
          </div>
        </div>
      </div>
    </div>
  );
}

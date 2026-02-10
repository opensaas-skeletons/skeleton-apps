import type { Pipeline } from "@shared/types/crm";

interface PipelineSelectorProps {
  pipelines: Pipeline[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function PipelineSelector({ pipelines, selectedId, onSelect }: PipelineSelectorProps) {
  return (
    <select
      value={selectedId || ""}
      onChange={(e) => onSelect(e.target.value)}
      className="px-3 py-1.5 text-sm border border-surface-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
    >
      {pipelines.map((p) => (
        <option key={p.id} value={p.id}>
          {p.title} {p.is_default ? "(Default)" : ""}
        </option>
      ))}
    </select>
  );
}

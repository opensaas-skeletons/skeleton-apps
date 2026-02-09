import { useRef, useEffect } from "react";
import type { Field, SortCondition } from "@shared/types/database";

interface SortBuilderProps {
  fields: Field[];
  sorts: SortCondition[];
  onChange: (sorts: SortCondition[]) => void;
  onClose: () => void;
}

export default function SortBuilder({
  fields,
  sorts,
  onChange,
  onClose,
}: SortBuilderProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const addSort = () => {
    if (fields.length === 0) return;
    const newSort: SortCondition = {
      field_id: fields[0].id,
      direction: "asc",
    };
    onChange([...sorts, newSort]);
  };

  const updateSort = (index: number, update: Partial<SortCondition>) => {
    onChange(
      sorts.map((s, i) => (i === index ? { ...s, ...update } : s))
    );
  };

  const removeSort = (index: number) => {
    onChange(sorts.filter((_, i) => i !== index));
  };

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 w-[360px] bg-white border border-surface-200 rounded-lg shadow-lg z-30 p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-surface-800">Sort</h3>
        {sorts.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="text-xs text-surface-500 hover:text-red-500 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {sorts.length === 0 ? (
        <p className="text-xs text-surface-400 mb-3">
          No sorts applied. Add one to order rows.
        </p>
      ) : (
        <div className="space-y-2 mb-3">
          {sorts.map((sort, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={sort.field_id}
                onChange={(e) =>
                  updateSort(i, { field_id: e.target.value })
                }
                className="flex-1 px-2 py-1 text-xs border border-surface-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-300"
              >
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title}
                  </option>
                ))}
              </select>
              <button
                onClick={() =>
                  updateSort(i, {
                    direction:
                      sort.direction === "asc" ? "desc" : "asc",
                  })
                }
                className="px-3 py-1 text-xs font-medium border border-surface-300 rounded hover:bg-surface-50 transition-colors min-w-[60px] text-center"
              >
                {sort.direction === "asc" ? (
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                    Asc
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                    Desc
                  </span>
                )}
              </button>
              <button
                onClick={() => removeSort(i)}
                className="p-1 text-surface-400 hover:text-red-500 transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={addSort}
        disabled={fields.length === 0}
        className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors disabled:opacity-50"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add sort
      </button>
    </div>
  );
}

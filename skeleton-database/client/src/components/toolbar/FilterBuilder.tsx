import { useRef, useEffect } from "react";
import type { Field, FilterCondition, FilterOperator } from "@shared/types/database";

interface FilterBuilderProps {
  fields: Field[];
  filters: FilterCondition[];
  onChange: (filters: FilterCondition[]) => void;
  onClose: () => void;
}

const TEXT_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: "eq", label: "is" },
  { value: "neq", label: "is not" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "is_empty", label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
];

const NUMBER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: "eq", label: "=" },
  { value: "neq", label: "!=" },
  { value: "gt", label: ">" },
  { value: "lt", label: "<" },
  { value: "gte", label: ">=" },
  { value: "lte", label: "<=" },
  { value: "is_empty", label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
];

const CHECKBOX_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: "eq", label: "is" },
];

function getOperatorsForFieldType(
  fieldType: string
): { value: FilterOperator; label: string }[] {
  switch (fieldType) {
    case "number":
    case "rating":
      return NUMBER_OPERATORS;
    case "checkbox":
      return CHECKBOX_OPERATORS;
    default:
      return TEXT_OPERATORS;
  }
}

export default function FilterBuilder({
  fields,
  filters,
  onChange,
  onClose,
}: FilterBuilderProps) {
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

  const addFilter = () => {
    if (fields.length === 0) return;
    const newFilter: FilterCondition = {
      field_id: fields[0].id,
      operator: "contains",
      value: "",
    };
    onChange([...filters, newFilter]);
  };

  const updateFilter = (
    index: number,
    update: Partial<FilterCondition>
  ) => {
    onChange(
      filters.map((f, i) => (i === index ? { ...f, ...update } : f))
    );
  };

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 w-[480px] bg-white border border-surface-200 rounded-lg shadow-lg z-30 p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-surface-800">Filters</h3>
        {filters.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="text-xs text-surface-500 hover:text-red-500 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {filters.length === 0 ? (
        <p className="text-xs text-surface-400 mb-3">
          No filters applied. Add one to narrow down rows.
        </p>
      ) : (
        <div className="space-y-2 mb-3">
          {filters.map((filter, i) => {
            const field = fields.find((f) => f.id === filter.field_id);
            const operators = getOperatorsForFieldType(
              field?.field_type || "text"
            );
            const hideValue =
              filter.operator === "is_empty" ||
              filter.operator === "is_not_empty";

            return (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={filter.field_id}
                  onChange={(e) =>
                    updateFilter(i, { field_id: e.target.value })
                  }
                  className="flex-1 px-2 py-1 text-xs border border-surface-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-300"
                >
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title}
                    </option>
                  ))}
                </select>
                <select
                  value={filter.operator}
                  onChange={(e) =>
                    updateFilter(i, {
                      operator: e.target.value as FilterOperator,
                    })
                  }
                  className="w-32 px-2 py-1 text-xs border border-surface-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-300"
                >
                  {operators.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
                {!hideValue && (
                  <input
                    type="text"
                    value={filter.value}
                    onChange={(e) =>
                      updateFilter(i, { value: e.target.value })
                    }
                    placeholder="Value"
                    className="flex-1 px-2 py-1 text-xs border border-surface-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-300"
                  />
                )}
                <button
                  onClick={() => removeFilter(i)}
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
            );
          })}
        </div>
      )}

      <button
        onClick={addFilter}
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
        Add filter
      </button>
    </div>
  );
}

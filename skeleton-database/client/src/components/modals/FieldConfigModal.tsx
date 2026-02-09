import { useState } from "react";
import type { Field, FieldType, CreateFieldInput, SelectOption } from "@shared/types/database";
import { FIELD_TYPES, FIELD_TYPE_LABELS, SELECT_COLORS } from "@shared/constants";

interface FieldConfigModalProps {
  tableId: string;
  field: Field | null;
  onSave: (input: CreateFieldInput) => void;
  onClose: () => void;
}

const FIELD_TYPE_ICONS: Record<string, string> = {
  text: "Aa",
  long_text: "Aa+",
  number: "#",
  checkbox: "CB",
  select: "S",
  multi_select: "MS",
  date: "D",
  email: "@",
  url: "U",
  phone: "Ph",
  rating: "R",
  formula: "fx",
  relation: "Lk",
};

export default function FieldConfigModal({
  tableId,
  field,
  onSave,
  onClose,
}: FieldConfigModalProps) {
  const [title, setTitle] = useState(field?.title || "");
  const [fieldType, setFieldType] = useState<FieldType>(
    field?.field_type || "text"
  );
  const [required, setRequired] = useState(field?.required || false);
  const [options, setOptions] = useState<SelectOption[]>(
    field?.config.options || [{ label: "", color: SELECT_COLORS[0] }]
  );
  const [precision, setPrecision] = useState(field?.config.precision ?? 0);

  const handleSave = () => {
    if (!title.trim()) return;

    const config: any = {};
    if (fieldType === "select" || fieldType === "multi_select") {
      config.options = options.filter((o) => o.label.trim());
    }
    if (fieldType === "number") {
      config.precision = precision;
    }

    onSave({
      table_id: tableId,
      title: title.trim(),
      field_type: fieldType,
      config,
      required,
    });
  };

  const addOption = () => {
    const nextColorIndex = options.length % SELECT_COLORS.length;
    setOptions([
      ...options,
      { label: "", color: SELECT_COLORS[nextColorIndex] },
    ]);
  };

  const updateOption = (
    index: number,
    key: keyof SelectOption,
    value: string
  ) => {
    setOptions(
      options.map((o, i) => (i === index ? { ...o, [key]: value } : o))
    );
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <h2 className="text-lg font-semibold text-surface-900">
            {field ? "Edit Field" : "Add Field"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-surface-400 hover:text-surface-600 rounded-md hover:bg-surface-100 transition-colors"
          >
            <svg
              className="w-5 h-5"
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

        <div className="px-6 py-4 space-y-5 max-h-[60vh] overflow-auto">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">
              Field Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter field name"
              autoFocus
              className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">
              Field Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {FIELD_TYPES.map((ft) => (
                <button
                  key={ft}
                  onClick={() => setFieldType(ft as FieldType)}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-xs transition-colors ${
                    fieldType === ft
                      ? "border-brand-400 bg-brand-50 text-brand-700"
                      : "border-surface-200 text-surface-600 hover:bg-surface-50"
                  }`}
                >
                  <span className="text-base font-mono font-bold">
                    {FIELD_TYPE_ICONS[ft] || "?"}
                  </span>
                  <span className="truncate w-full text-center">
                    {FIELD_TYPE_LABELS[ft]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {(fieldType === "select" || fieldType === "multi_select") && (
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Options
              </label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={opt.color}
                        onChange={(e) =>
                          updateOption(i, "color", e.target.value)
                        }
                        className="w-8 h-8 rounded cursor-pointer border border-surface-200"
                      />
                    </div>
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) =>
                        updateOption(i, "label", e.target.value)
                      }
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 px-3 py-1.5 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300"
                    />
                    <button
                      onClick={() => removeOption(i)}
                      className="p-1 text-surface-400 hover:text-red-500 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
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
                <button
                  onClick={addOption}
                  className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
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
                  Add option
                </button>
              </div>
            </div>
          )}

          {fieldType === "number" && (
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                Decimal Precision
              </label>
              <select
                value={precision}
                onChange={(e) => setPrecision(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300"
              >
                <option value={0}>Integer (0)</option>
                <option value={1}>1 decimal</option>
                <option value={2}>2 decimals</option>
                <option value={3}>3 decimals</option>
                <option value={4}>4 decimals</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRequired(!required)}
              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                required
                  ? "bg-brand-500 border-brand-500"
                  : "border-surface-300"
              }`}
            >
              {required && (
                <svg
                  className="w-3.5 h-3.5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
            <label className="text-sm text-surface-700">Required field</label>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-surface-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors disabled:opacity-50"
          >
            {field ? "Update Field" : "Add Field"}
          </button>
        </div>
      </div>
    </div>
  );
}

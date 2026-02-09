import { useState } from "react";
import type { Field, Row } from "@shared/types/database";
import { FIELD_TYPE_LABELS } from "@shared/constants";
import CellEditor from "../grid/CellEditor";
import CellDisplay from "../grid/CellDisplay";

interface FormViewProps {
  fields: Field[];
  rows: Row[];
  onUpdateCell: (rowId: string, fieldId: string, value: unknown) => void;
  onAddRow: () => void;
}

export default function FormView({
  fields,
  rows,
  onUpdateCell,
  onAddRow,
}: FormViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-surface-400">
        <svg
          className="w-12 h-12 mb-3 text-surface-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-lg font-medium">No records</p>
        <p className="text-sm mt-1 mb-4">Add a row to view the form</p>
        <button
          onClick={onAddRow}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors"
        >
          Add Row
        </button>
      </div>
    );
  }

  const row = rows[currentIndex];
  if (!row) return null;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-md text-surface-600 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span className="text-sm text-surface-600">
              Record {currentIndex + 1} of {rows.length}
            </span>
            <button
              onClick={() =>
                setCurrentIndex(Math.min(rows.length - 1, currentIndex + 1))
              }
              disabled={currentIndex >= rows.length - 1}
              className="p-1.5 rounded-md text-surface-600 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card divide-y divide-surface-100">
          {fields.map((field) => (
            <div key={field.id} className="px-6 py-4">
              <label className="block text-xs font-medium text-surface-500 uppercase tracking-wider mb-2">
                {field.title}
                <span className="ml-2 text-surface-400 normal-case tracking-normal">
                  {FIELD_TYPE_LABELS[field.field_type]}
                </span>
              </label>
              <div
                onClick={() => {
                  if (
                    field.field_type !== "formula" &&
                    field.field_type !== "relation"
                  ) {
                    if (field.field_type === "checkbox") {
                      onUpdateCell(row.id, field.id, !row.data[field.id]);
                    } else {
                      setEditingFieldId(field.id);
                    }
                  }
                }}
                className="cursor-pointer min-h-[32px] flex items-center"
              >
                {editingFieldId === field.id ? (
                  <div className="w-full">
                    <CellEditor
                      field={field}
                      value={row.data[field.id]}
                      onSave={(val) => {
                        onUpdateCell(row.id, field.id, val);
                        setEditingFieldId(null);
                      }}
                      onCancel={() => setEditingFieldId(null)}
                    />
                  </div>
                ) : (
                  <CellDisplay field={field} value={row.data[field.id]} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

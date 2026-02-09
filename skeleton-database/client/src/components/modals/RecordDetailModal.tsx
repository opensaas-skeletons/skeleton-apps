import { useState } from "react";
import type { Field, Row } from "@shared/types/database";
import { FIELD_TYPE_LABELS } from "@shared/constants";
import { FieldTypeIcon } from "../grid/FieldHeader";
import CellEditor from "../grid/CellEditor";
import CellDisplay from "../grid/CellDisplay";

interface RecordDetailModalProps {
  row: Row;
  fields: Field[];
  onUpdateCell: (rowId: string, fieldId: string, value: unknown) => void;
  onClose: () => void;
}

export default function RecordDetailModal({
  row,
  fields,
  onUpdateCell,
  onClose,
}: RecordDetailModalProps) {
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <h2 className="text-lg font-semibold text-surface-900">
            Record Detail
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

        <div className="flex-1 overflow-auto px-6 py-4 divide-y divide-surface-100">
          {fields.map((field) => (
            <div key={field.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2 mb-2">
                <FieldTypeIcon fieldType={field.field_type} />
                <span className="text-sm font-medium text-surface-700">
                  {field.title}
                </span>
                <span className="text-xs text-surface-400">
                  {FIELD_TYPE_LABELS[field.field_type]}
                </span>
              </div>
              <div
                onClick={() => {
                  if (
                    field.field_type !== "formula" &&
                    field.field_type !== "relation"
                  ) {
                    if (field.field_type === "checkbox") {
                      onUpdateCell(
                        row.id,
                        field.id,
                        !row.data[field.id]
                      );
                    } else {
                      setEditingFieldId(field.id);
                    }
                  }
                }}
                className="cursor-pointer min-h-[32px] flex items-center relative"
              >
                {editingFieldId === field.id ? (
                  <div className="w-full relative">
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

        <div className="px-6 py-3 border-t border-surface-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

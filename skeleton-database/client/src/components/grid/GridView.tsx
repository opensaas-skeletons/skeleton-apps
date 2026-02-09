import { useState, useCallback } from "react";
import type {
  Field,
  Row,
  CreateFieldInput,
  UpdateFieldInput,
} from "@shared/types/database";
import { useGridNavigation } from "../../hooks/useGridNavigation";
import { useModal } from "../../contexts/ModalContext";
import FieldHeader from "./FieldHeader";
import Cell from "./Cell";
import Pagination from "./Pagination";
import AddRowButton from "./AddRowButton";
import FieldConfigModal from "../modals/FieldConfigModal";

interface GridViewProps {
  fields: Field[];
  rows: Row[];
  page: number;
  perPage: number;
  total: number;
  loading: boolean;
  tableId: string;
  onUpdateCell: (rowId: string, fieldId: string, value: unknown) => void;
  onAddRow: () => void;
  onDeleteRow: (id: string) => void;
  onPageChange: (page: number) => void;
  onExpandRow: (row: Row) => void;
  onAddField: (input: CreateFieldInput) => Promise<Field>;
  onUpdateField: (id: string, input: UpdateFieldInput) => Promise<Field>;
  onDeleteField: (id: string) => void;
}

export default function GridView({
  fields,
  rows,
  page,
  perPage,
  total,
  loading,
  tableId,
  onUpdateCell,
  onAddRow,
  onDeleteRow,
  onPageChange,
  onExpandRow,
  onAddField,
  onUpdateField,
  onDeleteField,
}: GridViewProps) {
  const modal = useModal();
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);

  const {
    selectedCell,
    editingCell,
    selectCell,
    startEditing,
    stopEditing,
    handleKeyDown,
  } = useGridNavigation(rows.length, fields.length);

  const handleFieldAction = useCallback(
    async (field: Field, action: string) => {
      if (action === "edit") {
        setEditingField(field);
        setShowFieldModal(true);
      } else if (action === "delete") {
        const ok = await modal.confirm({ message: `Delete field "${field.title}"?`, variant: "destructive", confirmLabel: "Delete" });
        if (ok) {
          onDeleteField(field.id);
        }
      }
    },
    [onDeleteField, modal]
  );

  const handleSaveField = useCallback(
    async (input: CreateFieldInput) => {
      if (editingField) {
        await onUpdateField(editingField.id, {
          title: input.title,
          config: input.config,
          required: input.required,
        });
      } else {
        await onAddField(input);
      }
      setShowFieldModal(false);
      setEditingField(null);
    },
    [editingField, onAddField, onUpdateField]
  );

  if (loading && rows.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-surface-400">
        Loading table data...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex-1 overflow-auto focus:outline-none"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <table className="w-full border-collapse min-w-max">
          <thead className="sticky top-0 bg-surface-50 z-10">
            <tr className="border-b border-surface-200">
              <th className="w-10 px-2 py-2 text-xs font-medium text-surface-400 text-center bg-surface-50">
                #
              </th>
              <th className="w-8 px-1 py-2 bg-surface-50" />
              {fields.map((field) => (
                <FieldHeader
                  key={field.id}
                  field={field}
                  onAction={handleFieldAction}
                />
              ))}
              <th className="w-10 px-2 py-2 bg-surface-50">
                <button
                  onClick={() => {
                    setEditingField(null);
                    setShowFieldModal(true);
                  }}
                  className="w-6 h-6 flex items-center justify-center text-surface-400 hover:text-brand-500 hover:bg-surface-200 rounded transition-colors"
                  title="Add field"
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
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                className="border-b border-surface-100 hover:bg-surface-50/50 group"
              >
                <td className="px-2 py-0 text-xs text-surface-400 text-center w-10">
                  {(page - 1) * perPage + rowIndex + 1}
                </td>
                <td className="px-1 py-0 w-8">
                  <button
                    onClick={() => onExpandRow(row)}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-surface-400 hover:text-brand-500 rounded transition-all"
                    title="Expand row"
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
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                      />
                    </svg>
                  </button>
                </td>
                {fields.map((field, colIndex) => (
                  <Cell
                    key={field.id}
                    row={row}
                    field={field}
                    isSelected={
                      selectedCell?.row === rowIndex &&
                      selectedCell?.col === colIndex
                    }
                    isEditing={
                      editingCell?.row === rowIndex &&
                      editingCell?.col === colIndex
                    }
                    onSelect={() => selectCell(rowIndex, colIndex)}
                    onStartEdit={() => startEditing(rowIndex, colIndex)}
                    onStopEdit={stopEditing}
                    onUpdateCell={(value) =>
                      onUpdateCell(row.id, field.id, value)
                    }
                  />
                ))}
                <td className="w-10 px-1">
                  <button
                    onClick={async () => {
                      if (await modal.confirm({ message: "Delete this row?", variant: "destructive", confirmLabel: "Delete" })) onDeleteRow(row.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-surface-400 hover:text-red-500 rounded transition-all"
                    title="Delete row"
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <AddRowButton onAdd={onAddRow} />
      </div>
      <Pagination
        page={page}
        total={total}
        perPage={perPage}
        onPageChange={onPageChange}
      />
      {showFieldModal && (
        <FieldConfigModal
          tableId={tableId}
          field={editingField}
          onSave={handleSaveField}
          onClose={() => {
            setShowFieldModal(false);
            setEditingField(null);
          }}
        />
      )}
    </div>
  );
}

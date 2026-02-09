import type { Field, Row } from "@shared/types/database";
import CellDisplay from "./CellDisplay";
import CellEditor from "./CellEditor";

interface CellProps {
  row: Row;
  field: Field;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onUpdateCell: (value: unknown) => void;
}

export default function Cell({
  row,
  field,
  isSelected,
  isEditing,
  onSelect,
  onStartEdit,
  onStopEdit,
  onUpdateCell,
}: CellProps) {
  const value = row.data[field.id];

  const handleClick = () => {
    if (field.field_type === "checkbox") {
      onUpdateCell(!value);
      onSelect();
      return;
    }
    if (!isSelected) {
      onSelect();
    }
  };

  const handleDoubleClick = () => {
    if (
      field.field_type === "checkbox" ||
      field.field_type === "formula" ||
      field.field_type === "relation"
    ) {
      return;
    }
    onStartEdit();
  };

  const cellClass = [
    "px-3 py-1 min-w-[150px] max-w-[300px] border-r border-surface-100 cursor-default transition-colors",
    isEditing ? "cell-editing" : isSelected ? "cell-selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <td
      className={cellClass}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <CellEditor
          field={field}
          value={value}
          onSave={(val) => {
            onUpdateCell(val);
            onStopEdit();
          }}
          onCancel={onStopEdit}
        />
      ) : (
        <CellDisplay field={field} value={value} />
      )}
    </td>
  );
}

import { useState, useCallback } from "react";

interface CellPosition {
  row: number;
  col: number;
}

export function useGridNavigation(
  rowCount: number,
  colCount: number,
  onStartEditCb?: (row: number, col: number, key?: string) => void,
  onCommitEditCb?: () => void
) {
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);

  const selectCell = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col });
    setEditingCell(null);
  }, []);

  const startEditing = useCallback(
    (row: number, col: number, key?: string) => {
      setSelectedCell({ row, col });
      setEditingCell({ row, col });
      onStartEditCb?.(row, col, key);
    },
    [onStartEditCb]
  );

  const stopEditing = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!selectedCell) return;

      const { row, col } = selectedCell;
      const isEditing = editingCell !== null;

      if (e.key === "Escape") {
        if (isEditing) {
          stopEditing();
          e.preventDefault();
        } else {
          setSelectedCell(null);
        }
        return;
      }

      if (e.key === "Enter") {
        if (isEditing) {
          onCommitEditCb?.();
          stopEditing();
          if (row + 1 < rowCount) {
            setSelectedCell({ row: row + 1, col });
          }
        } else {
          startEditing(row, col);
        }
        e.preventDefault();
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        if (isEditing) {
          onCommitEditCb?.();
          stopEditing();
        }
        let nextCol = col + (e.shiftKey ? -1 : 1);
        let nextRow = row;
        if (nextCol >= colCount) {
          nextCol = 0;
          nextRow = row + 1;
        } else if (nextCol < 0) {
          nextCol = colCount - 1;
          nextRow = row - 1;
        }
        if (nextRow >= 0 && nextRow < rowCount) {
          setSelectedCell({ row: nextRow, col: nextCol });
        }
        return;
      }

      if (!isEditing) {
        if (e.key === "ArrowUp" && row > 0) {
          setSelectedCell({ row: row - 1, col });
          e.preventDefault();
        } else if (e.key === "ArrowDown" && row + 1 < rowCount) {
          setSelectedCell({ row: row + 1, col });
          e.preventDefault();
        } else if (e.key === "ArrowLeft" && col > 0) {
          setSelectedCell({ row, col: col - 1 });
          e.preventDefault();
        } else if (e.key === "ArrowRight" && col + 1 < colCount) {
          setSelectedCell({ row, col: col + 1 });
          e.preventDefault();
        } else if (e.key === "Delete" || e.key === "Backspace") {
          startEditing(row, col, "");
          e.preventDefault();
        } else if (
          e.key.length === 1 &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey
        ) {
          startEditing(row, col, e.key);
          e.preventDefault();
        }
      }
    },
    [
      selectedCell,
      editingCell,
      rowCount,
      colCount,
      startEditing,
      stopEditing,
      onCommitEditCb,
    ]
  );

  return {
    selectedCell,
    editingCell,
    selectCell,
    startEditing,
    stopEditing,
    handleKeyDown,
  };
}

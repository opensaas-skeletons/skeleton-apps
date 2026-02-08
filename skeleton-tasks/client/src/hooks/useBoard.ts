/**
 * useBoard Hook
 * =============
 * Manages board state and operations.
 *
 * LLM BUILDERS: This hook is the "brain" of the UI.
 * Add new board-level operations here (e.g., filtering, sorting).
 */

import { useState, useEffect, useCallback } from "react";
import type { BoardWithDetails, Task, CreateTaskInput, UpdateTaskInput, MoveTaskInput } from "@shared/types/task";
import * as api from "../api/client";

export function useBoard(boardId: string | null) {
  const [board, setBoard] = useState<BoardWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoard = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getBoard(boardId);
      setBoard(data);
    } catch (err: any) {
      setError(err.message || "Failed to load board");
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const addTask = useCallback(async (input: CreateTaskInput) => {
    if (!boardId) return;
    try {
      await api.createTask(boardId, input);
      await fetchBoard(); // Refresh the board
    } catch (err: any) {
      setError(err.message);
    }
  }, [boardId, fetchBoard]);

  const editTask = useCallback(async (taskId: string, input: UpdateTaskInput) => {
    try {
      await api.updateTask(taskId, input);
      await fetchBoard();
    } catch (err: any) {
      setError(err.message);
    }
  }, [fetchBoard]);

  const moveTaskToColumn = useCallback(async (taskId: string, input: MoveTaskInput) => {
    if (!board) return;

    // Optimistic update — move the task in local state immediately
    setBoard((prev) => {
      if (!prev) return prev;
      const newColumns = prev.columns.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t.id !== taskId),
      }));

      // Find the task
      let task: Task | undefined;
      for (const col of prev.columns) {
        task = col.tasks.find((t) => t.id === taskId);
        if (task) break;
      }
      if (!task) return prev;

      // Add to target column
      const targetCol = newColumns.find((c) => c.id === input.column_id);
      if (targetCol) {
        const updatedTask = { ...task, column_id: input.column_id, position: input.position };
        targetCol.tasks.splice(input.position, 0, updatedTask);
        // Re-index positions
        targetCol.tasks.forEach((t, i) => (t.position = i));
      }

      return { ...prev, columns: newColumns };
    });

    // Then sync with server
    try {
      await api.moveTask(taskId, input);
    } catch (err: any) {
      // Rollback on error
      setError(err.message);
      await fetchBoard();
    }
  }, [board, fetchBoard]);

  const removeTask = useCallback(async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      await fetchBoard();
    } catch (err: any) {
      setError(err.message);
    }
  }, [fetchBoard]);

  return {
    board,
    loading,
    error,
    refresh: fetchBoard,
    addTask,
    editTask,
    moveTaskToColumn,
    removeTask,
  };
}

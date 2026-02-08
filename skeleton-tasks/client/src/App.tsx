/**
 * App Component
 * =============
 * The root component that ties everything together.
 *
 * LLM BUILDERS: This is the entry point for the UI.
 * - Add routing (react-router) for multi-board navigation
 * - Add a sidebar for board list
 * - Add global state management if needed
 */

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { Board } from "./components/Board";
import { useBoard } from "./hooks/useBoard";
import * as api from "./api/client";
import type { Board as BoardType, CreateTaskInput, UpdateTaskInput } from "@shared/types/task";
import { Loader2, AlertTriangle, Inbox, Trash2 } from "lucide-react";

export default function App() {
  const [boards, setBoards] = useState<BoardType[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const { board, loading, error, refresh, addTask, editTask, moveTaskToColumn, removeTask } =
    useBoard(selectedBoardId);

  // Load boards on mount
  const loadBoards = useCallback(async () => {
    try {
      const boardList = await api.listBoards();
      setBoards(boardList);
      // Auto-select first board if none selected
      if (boardList.length > 0 && !selectedBoardId) {
        setSelectedBoardId(boardList[0].id);
      }
    } catch (err) {
      console.error("Failed to load boards:", err);
    } finally {
      setInitialLoading(false);
    }
  }, [selectedBoardId]);

  useEffect(() => {
    loadBoards();
  }, []);

  // ---- Handlers ----

  const handleNewBoard = async () => {
    const title = prompt("Board name:");
    if (!title) return;

    try {
      const newBoard = await api.createBoard({ title });
      setBoards((prev) => [newBoard, ...prev]);
      setSelectedBoardId(newBoard.id);
    } catch (err) {
      alert("Failed to create board");
    }
  };

  const handleExport = async () => {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skeleton-tasks-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export data");
    }
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const result = await api.importData(data);
        alert(`Imported ${result.imported_boards} board(s) successfully!`);
        await loadBoards();
        refresh();
      } catch (err) {
        alert("Failed to import data. Make sure the file is valid JSON.");
      }
    };
    input.click();
  };

  const handleDeleteBoard = async (boardId: string) => {
    const boardToDelete = boards.find((b) => b.id === boardId);
    if (!boardToDelete) return;

    if (!window.confirm(`Delete board "${boardToDelete.title}"? This will delete all columns and tasks in this board.`)) {
      return;
    }

    try {
      await api.deleteBoard(boardId);
      const remaining = boards.filter((b) => b.id !== boardId);
      setBoards(remaining);
      if (selectedBoardId === boardId) {
        setSelectedBoardId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      alert("Failed to delete board");
    }
  };

  // ---- Render ----

  // Initial loading
  if (initialLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-brand-500" />
          <p className="text-sm text-surface-400">Loading...</p>
        </div>
      </div>
    );
  }

  // No boards yet
  if (boards.length === 0) {
    return (
      <div className="h-screen flex flex-col bg-surface-50">
        <Header
          boardTitle="Welcome"
          onExport={handleExport}
          onImport={handleImport}
          onRefresh={refresh}
          onNewBoard={handleNewBoard}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Inbox size={48} className="mx-auto mb-4 text-surface-300" />
            <h2 className="text-lg font-semibold text-surface-700 mb-2">No boards yet</h2>
            <p className="text-sm text-surface-400 mb-6 max-w-sm">
              Create your first board to start tracking tasks, or import data from another skeleton-based app.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleNewBoard}
                className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                Create Board
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 rounded-lg bg-surface-100 text-surface-600 text-sm font-medium hover:bg-surface-200 transition-colors"
              >
                Import Data
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-surface-50">
      <Header
        boardTitle={board?.title || "Loading..."}
        onExport={handleExport}
        onImport={handleImport}
        onRefresh={refresh}
        onNewBoard={handleNewBoard}
      />

      {/* Board selector (if multiple boards) */}
      {boards.length > 1 && (
        <div className="flex items-center gap-1 px-5 pt-3 pb-0">
          {boards.map((b) => (
            <div key={b.id} className="flex items-center group/tab">
              <button
                onClick={() => setSelectedBoardId(b.id)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${b.id === selectedBoardId
                    ? "bg-brand-100 text-brand-700"
                    : "text-surface-500 hover:bg-surface-100"
                  }
                `}
              >
                {b.title}
              </button>
              <button
                onClick={() => handleDeleteBoard(b.id)}
                className="p-1 rounded opacity-0 group-hover/tab:opacity-100 text-surface-400 hover:text-red-500 hover:bg-red-50 transition-all"
                title={`Delete ${b.title}`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mx-5 mt-3 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Board Content */}
      {loading && !board ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-brand-500" />
        </div>
      ) : board ? (
        <Board
          board={board}
          onAddTask={addTask}
          onEditTask={editTask}
          onMoveTask={moveTaskToColumn}
          onDeleteTask={removeTask}
        />
      ) : null}
    </div>
  );
}

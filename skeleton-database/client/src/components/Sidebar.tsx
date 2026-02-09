import { useState, useEffect, useCallback } from "react";
import type { Base, Table } from "@shared/types/database";
import * as api from "../api/client";
import { useModal } from "../contexts/ModalContext";
import BaseSelector from "./BaseSelector";

interface SidebarProps {
  baseId: string;
  baseName: string;
  selectedTableId: string | null;
  onSelectTable: (table: Table) => void;
  onBackToList: () => void;
  bases: Base[];
  onSwitchBase: (base: Base) => void;
}

export default function Sidebar({
  baseId,
  baseName,
  selectedTableId,
  onSelectTable,
  onBackToList,
  bases,
  onSwitchBase,
}: SidebarProps) {
  const modal = useModal();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBaseSelector, setShowBaseSelector] = useState(false);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listTables(baseId);
      setTables(data.sort((a, b) => a.position - b.position));
    } catch (err: any) {
      console.error("Failed to load tables:", err);
    } finally {
      setLoading(false);
    }
  }, [baseId]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleAddTable = async () => {
    const title = await modal.prompt("Table name:");
    if (!title?.trim()) return;
    try {
      const table = await api.createTable({
        base_id: baseId,
        title: title.trim(),
      });
      setTables((prev) =>
        [...prev, table].sort((a, b) => a.position - b.position)
      );
      onSelectTable(table);
    } catch (err: any) {
      await modal.alert({ message: "Failed to create table: " + err.message, variant: "error" });
    }
  };

  const handleDeleteTable = async (tableId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const table = tables.find((t) => t.id === tableId);
    if (
      !(await modal.confirm({ message: `Delete table "${table?.title}"? This cannot be undone.`, variant: "destructive", confirmLabel: "Delete" }))
    )
      return;
    try {
      await api.deleteTable(tableId);
      setTables((prev) => prev.filter((t) => t.id !== tableId));
    } catch (err: any) {
      await modal.alert({ message: "Failed to delete table: " + err.message, variant: "error" });
    }
  };

  return (
    <aside className="w-56 bg-white border-r border-surface-200 flex flex-col shrink-0">
      <div className="p-3 border-b border-surface-200 relative">
        <button
          onClick={() => setShowBaseSelector(!showBaseSelector)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface-100 transition-colors text-left"
        >
          <svg
            className="w-4 h-4 text-surface-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
            />
          </svg>
          <span className="text-sm font-semibold text-surface-900 truncate flex-1">
            {baseName}
          </span>
          <svg
            className="w-3 h-3 text-surface-400"
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
        </button>
        {showBaseSelector && (
          <BaseSelector
            bases={bases}
            currentBaseId={baseId}
            onSelect={(base) => {
              setShowBaseSelector(false);
              onSwitchBase(base);
            }}
            onBackToList={() => {
              setShowBaseSelector(false);
              onBackToList();
            }}
            onClose={() => setShowBaseSelector(false)}
          />
        )}
      </div>

      <div className="flex-1 overflow-auto py-2">
        <div className="px-3 mb-1">
          <span className="text-xs font-medium text-surface-400 uppercase tracking-wider">
            Tables
          </span>
        </div>
        {loading ? (
          <div className="px-3 py-2 text-xs text-surface-400">Loading...</div>
        ) : tables.length === 0 ? (
          <div className="px-3 py-2 text-xs text-surface-400">
            No tables yet
          </div>
        ) : (
          tables.map((table) => (
            <div
              key={table.id}
              onClick={() => onSelectTable(table)}
              className={`group mx-2 px-2 py-1.5 rounded-md cursor-pointer flex items-center gap-2 transition-colors ${
                selectedTableId === table.id
                  ? "bg-brand-50 text-brand-700"
                  : "text-surface-700 hover:bg-surface-100"
              }`}
            >
              <svg
                className={`w-4 h-4 shrink-0 ${
                  selectedTableId === table.id
                    ? "text-brand-500"
                    : "text-surface-400"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm truncate flex-1">{table.title}</span>
              <button
                onClick={(e) => handleDeleteTable(table.id, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-surface-400 hover:text-red-500 rounded transition-all"
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
          ))
        )}
      </div>

      <div className="p-3 border-t border-surface-200">
        <button
          onClick={handleAddTable}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-surface-600 hover:text-brand-600 hover:bg-surface-100 rounded-md transition-colors"
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
          Add Table
        </button>
      </div>
    </aside>
  );
}

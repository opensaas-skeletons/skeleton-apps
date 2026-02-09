import { useState } from "react";
import type { Base } from "@shared/types/database";
import * as api from "../api/client";
import { useModal } from "../contexts/ModalContext";

interface HeaderProps {
  selectedBase: Base | null;
  onBackToList: () => void;
  onRefresh: () => void;
  onCreateBase: () => void;
}

export default function Header({
  selectedBase,
  onBackToList,
  onRefresh,
  onCreateBase,
}: HeaderProps) {
  const modal = useModal();
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skeleton-database-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      await modal.alert({ message: "Export failed: " + err.message, variant: "error" });
    }
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setImporting(true);
      try {
        const text = await file.text();
        const payload = JSON.parse(text);
        const result = await api.importData(payload);
        await modal.alert({ message: `Imported ${result.imported_bases} base(s) successfully.`, variant: "success" });
        onRefresh();
      } catch (err: any) {
        await modal.alert({ message: "Import failed: " + err.message, variant: "error" });
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  return (
    <header className="bg-white border-b border-surface-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <h1
                className="text-lg font-semibold text-surface-900 cursor-pointer hover:text-brand-600 transition-colors"
                onClick={onBackToList}
              >
                Skeleton Database
              </h1>
              {selectedBase && (
                <>
                  <svg
                    className="w-4 h-4 text-surface-400"
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
                  <span className="text-lg font-medium text-surface-700">
                    {selectedBase.title}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-sm text-surface-600 hover:text-surface-900 hover:bg-surface-100 rounded-md transition-colors"
            >
              Export
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-3 py-1.5 text-sm text-surface-600 hover:text-surface-900 hover:bg-surface-100 rounded-md transition-colors disabled:opacity-50"
            >
              {importing ? "Importing..." : "Import"}
            </button>
            <button
              onClick={onCreateBase}
              className="px-4 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors"
            >
              New Base
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

import { useState } from "react";
import type { Workspace } from "@shared/types/wiki";
import * as api from "../api/client";
import { useModal } from "../contexts/ModalContext";

interface Props {
  workspace: Workspace | null;
  onBack: () => void;
}

export default function Header({ workspace, onBack }: Props) {
  const modal = useModal();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wiki-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      await modal.alert({ message: `Export failed: ${err.message}`, variant: "error" });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const payload = JSON.parse(text);
        const result = await api.importData(payload);
        await modal.alert({
          message: `Imported ${result.imported_workspaces} workspace(s). Refresh to see changes.`,
          variant: "success",
        });
      } catch (err: any) {
        await modal.alert({ message: `Import failed: ${err.message}`, variant: "error" });
      }
    };
    input.click();
  };

  return (
    <header className="bg-white border-b border-surface-200 px-4 h-12 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {workspace ? (
          <>
            <button
              onClick={onBack}
              className="text-surface-400 hover:text-surface-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg">{workspace.icon}</span>
            <h1 className="text-sm font-semibold text-surface-800">{workspace.title}</h1>
          </>
        ) : (
          <>
            <span className="text-lg">📚</span>
            <h1 className="text-sm font-semibold text-surface-800">Skeleton Wiki</h1>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-2.5 py-1 text-xs font-medium text-surface-600 hover:bg-surface-100 rounded-md transition-colors disabled:opacity-50"
        >
          Export
        </button>
        <button
          onClick={handleImport}
          className="px-2.5 py-1 text-xs font-medium text-surface-600 hover:bg-surface-100 rounded-md transition-colors"
        >
          Import
        </button>
      </div>
    </header>
  );
}

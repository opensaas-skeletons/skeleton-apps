import { useState } from "react";
import type { Notification } from "@shared/types/notification";
import * as api from "../api/client";
import { useModal } from "../contexts/ModalContext";
import NotificationBell from "./NotificationBell";
import NotificationPanel from "./NotificationPanel";

interface HeaderProps {
  onRefresh: () => void;
  onCreateNew: () => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export default function Header({
  onRefresh,
  onCreateNew,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
}: HeaderProps) {
  const [importing, setImporting] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const modal = useModal();

  const handleExport = async () => {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skeleton-automation-export-${new Date().toISOString().slice(0, 10)}.json`;
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
        await modal.alert({ message: `Imported ${result.imported_workflows} workflow(s) successfully.`, variant: "success" });
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
    <header className="bg-white border-b border-surface-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-surface-900">
              Skeleton Automation
            </h1>
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

            {/* Notification Bell */}
            <div className="relative">
              <NotificationBell unreadCount={unreadCount} onClick={() => setShowPanel(!showPanel)} />
              {showPanel && (
                <NotificationPanel
                  notifications={notifications}
                  onMarkAsRead={onMarkAsRead}
                  onMarkAllAsRead={onMarkAllAsRead}
                  onClose={() => setShowPanel(false)}
                />
              )}
            </div>

            <button
              onClick={onCreateNew}
              className="px-4 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors"
            >
              New Workflow
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

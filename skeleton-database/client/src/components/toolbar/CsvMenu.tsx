import { useState, useRef, useEffect } from "react";
import * as api from "../../api/client";
import { useModal } from "../../contexts/ModalContext";

interface CsvMenuProps {
  tableId: string;
}

export default function CsvMenu({ tableId }: CsvMenuProps) {
  const modal = useModal();
  const [showMenu, setShowMenu] = useState(false);
  const [importing, setImporting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const handleExportCsv = async () => {
    setShowMenu(false);
    try {
      await api.exportCsv(tableId);
    } catch (err: any) {
      await modal.alert({ message: "CSV export failed: " + err.message, variant: "error" });
    }
  };

  const handleImportCsv = () => {
    setShowMenu(false);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const result = await api.importCsv(tableId, file);
        await modal.alert({
          message: `Imported ${result.rows_created} rows and ${result.fields_created} fields.${
            result.errors.length > 0
              ? `\n\nWarnings:\n${result.errors.join("\n")}`
              : ""
          }`,
          variant: "success",
        });
        window.location.reload();
      } catch (err: any) {
        await modal.alert({ message: "CSV import failed: " + err.message, variant: "error" });
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={importing}
        className="px-3 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-100 border border-surface-200 rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {importing ? "Importing..." : "CSV"}
      </button>

      {showMenu && (
        <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-surface-200 rounded-lg shadow-lg z-20 py-1">
          <button
            onClick={handleImportCsv}
            className="w-full px-3 py-1.5 text-left text-sm text-surface-700 hover:bg-surface-50 flex items-center gap-2"
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import CSV
          </button>
          <button
            onClick={handleExportCsv}
            className="w-full px-3 py-1.5 text-left text-sm text-surface-700 hover:bg-surface-50 flex items-center gap-2"
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export CSV
          </button>
        </div>
      )}
    </div>
  );
}

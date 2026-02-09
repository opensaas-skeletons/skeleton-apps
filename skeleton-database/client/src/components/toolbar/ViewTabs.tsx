import { useState } from "react";
import type { View, ViewType, CreateViewInput } from "@shared/types/database";
import { useModal } from "../../contexts/ModalContext";

interface ViewTabsProps {
  views: View[];
  activeViewId: string | null;
  tableId: string;
  onSetActiveView: (viewId: string | null) => void;
  onAddView: (input: CreateViewInput) => void;
  onRemoveView: (id: string) => void;
}

export default function ViewTabs({
  views,
  activeViewId,
  tableId,
  onSetActiveView,
  onAddView,
  onRemoveView,
}: ViewTabsProps) {
  const modal = useModal();
  const [showNewView, setShowNewView] = useState(false);
  const [newViewTitle, setNewViewTitle] = useState("");
  const [newViewType, setNewViewType] = useState<ViewType>("grid");

  const handleCreate = () => {
    if (!newViewTitle.trim()) return;
    onAddView({
      table_id: tableId,
      title: newViewTitle.trim(),
      view_type: newViewType,
    });
    setNewViewTitle("");
    setShowNewView(false);
  };

  if (views.length === 0 && !showNewView) {
    return (
      <div className="px-4 pt-2 flex items-center gap-2">
        <button
          onClick={() => setShowNewView(true)}
          className="px-2 py-1 text-xs text-surface-500 hover:text-brand-600 transition-colors flex items-center gap-1"
        >
          <svg
            className="w-3 h-3"
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
          Add view
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-2 flex items-center gap-1 border-b border-surface-100 overflow-x-auto">
      <button
        onClick={() => onSetActiveView(null)}
        className={`px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors whitespace-nowrap ${
          activeViewId === null
            ? "bg-white text-brand-700 border border-surface-200 border-b-white -mb-px"
            : "text-surface-500 hover:text-surface-700 hover:bg-surface-50"
        }`}
      >
        All
      </button>
      {views.map((view) => (
        <div key={view.id} className="group flex items-center">
          <button
            onClick={() => onSetActiveView(view.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors whitespace-nowrap ${
              activeViewId === view.id
                ? "bg-white text-brand-700 border border-surface-200 border-b-white -mb-px"
                : "text-surface-500 hover:text-surface-700 hover:bg-surface-50"
            }`}
          >
            {view.view_type === "form" ? (
              <svg
                className="w-3 h-3 inline mr-1"
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
            ) : (
              <svg
                className="w-3 h-3 inline mr-1"
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
            )}
            {view.title}
          </button>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              if (await modal.confirm({ message: `Delete view "${view.title}"?`, variant: "destructive", confirmLabel: "Delete" })) {
                onRemoveView(view.id);
              }
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-surface-400 hover:text-red-500 rounded transition-all -ml-1 mr-1"
          >
            <svg
              className="w-3 h-3"
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
      ))}

      {showNewView ? (
        <div className="flex items-center gap-1 px-2 py-1">
          <input
            type="text"
            value={newViewTitle}
            onChange={(e) => setNewViewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setShowNewView(false);
            }}
            placeholder="View name"
            autoFocus
            className="w-24 px-2 py-0.5 text-xs border border-surface-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-300"
          />
          <select
            value={newViewType}
            onChange={(e) => setNewViewType(e.target.value as ViewType)}
            className="px-1 py-0.5 text-xs border border-surface-300 rounded focus:outline-none"
          >
            <option value="grid">Grid</option>
            <option value="form">Form</option>
          </select>
          <button
            onClick={handleCreate}
            className="p-0.5 text-brand-600 hover:text-brand-700"
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>
          <button
            onClick={() => setShowNewView(false)}
            className="p-0.5 text-surface-400 hover:text-surface-600"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowNewView(true)}
          className="px-2 py-1 text-xs text-surface-400 hover:text-brand-600 transition-colors"
          title="Add view"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

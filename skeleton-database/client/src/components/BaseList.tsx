import type { Base } from "@shared/types/database";
import { BASE_COLORS } from "@shared/constants";
import { useModal } from "../contexts/ModalContext";

interface BaseListProps {
  bases: Base[];
  loading: boolean;
  onSelectBase: (base: Base) => void;
  onCreateBase: () => void;
  onDeleteBase: (id: string) => void;
}

export default function BaseList({
  bases,
  loading,
  onSelectBase,
  onCreateBase,
  onDeleteBase,
}: BaseListProps) {
  const modal = useModal();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-surface-400">Loading bases...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-surface-900">Your Bases</h2>
          <p className="text-surface-500 mt-1">
            Select a base to view its tables, or create a new one.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {bases.map((base) => {
            const color = base.color || BASE_COLORS[0];
            return (
              <div
                key={base.id}
                onClick={() => onSelectBase(base)}
                className="group bg-white rounded-lg shadow-card hover:shadow-card-hover transition-all cursor-pointer overflow-hidden"
              >
                <div
                  className="h-2"
                  style={{ backgroundColor: color }}
                />
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg font-bold"
                      style={{ backgroundColor: color }}
                    >
                      {base.icon || base.title.charAt(0).toUpperCase()}
                    </div>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (
                          await modal.confirm({
                            message: `Delete base "${base.title}"? This cannot be undone.`,
                            variant: "destructive",
                            confirmLabel: "Delete",
                          })
                        ) {
                          onDeleteBase(base.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-surface-400 hover:text-red-500 rounded transition-all"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-surface-900 truncate">
                    {base.title}
                  </h3>
                  {base.description && (
                    <p className="mt-1 text-xs text-surface-500 line-clamp-2">
                      {base.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          <button
            onClick={onCreateBase}
            className="bg-white rounded-lg border-2 border-dashed border-surface-300 hover:border-brand-400 hover:bg-brand-50 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[140px] group"
          >
            <svg
              className="w-8 h-8 text-surface-400 group-hover:text-brand-500 transition-colors"
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
            <span className="mt-2 text-sm font-medium text-surface-500 group-hover:text-brand-600">
              Create Base
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

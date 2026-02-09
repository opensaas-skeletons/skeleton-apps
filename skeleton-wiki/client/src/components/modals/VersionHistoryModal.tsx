import { useEffect, useRef } from "react";
import { usePageVersions } from "../../hooks/usePages";
import { useModal } from "../../contexts/ModalContext";
import * as api from "../../api/client";

interface Props {
  pageId: string;
  onClose: () => void;
  onRestore: () => void;
}

export default function VersionHistoryModal({ pageId, onClose, onRestore }: Props) {
  const { versions, loading } = usePageVersions(pageId);
  const modal = useModal();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleRestore = async (versionId: string, versionNum: number) => {
    const confirmed = await modal.confirm({
      message: `Restore to version ${versionNum}? This will create a new version with the restored content.`,
      confirmLabel: "Restore",
    });
    if (!confirmed) return;

    try {
      await api.restorePageVersion(pageId, versionId);
      onRestore();
    } catch (err: any) {
      await modal.alert({ message: `Restore failed: ${err.message}`, variant: "error" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={containerRef}
        className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <div className="px-5 pt-5 pb-3 border-b border-surface-100 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-semibold text-surface-800">Version History</h2>
          <button
            onClick={onClose}
            className="p-1 text-surface-400 hover:text-surface-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="text-center py-8 text-sm text-surface-400">Loading versions...</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-sm text-surface-400">No versions found</div>
          ) : (
            <div className="space-y-2">
              {versions.map((v, i) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-surface-100 hover:border-surface-200 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-surface-800">
                        Version {v.version_number}
                      </span>
                      {i === 0 && (
                        <span className="text-xs text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-surface-500 mt-0.5">
                      {v.title} — {new Date(v.created_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {v.content.length} characters
                    </p>
                  </div>
                  {i > 0 && (
                    <button
                      onClick={() => handleRestore(v.id, v.version_number)}
                      className="px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 rounded-md transition-colors shrink-0"
                    >
                      Restore
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

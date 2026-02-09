import type { Workspace } from "@shared/types/wiki";
import { useModal } from "../contexts/ModalContext";
import { WORKSPACE_COLORS } from "@shared/constants";

interface Props {
  workspaces: Workspace[];
  loading: boolean;
  onSelect: (id: string) => void;
  onCreate: (title: string, icon?: string, color?: string) => Promise<Workspace>;
  onDelete: (id: string) => Promise<void>;
}

export default function WorkspaceList({ workspaces, loading, onSelect, onCreate, onDelete }: Props) {
  const modal = useModal();

  const handleCreate = async () => {
    const title = await modal.prompt({ message: "Workspace name:", defaultValue: "My Wiki" });
    if (!title) return;
    const color = WORKSPACE_COLORS[workspaces.length % WORKSPACE_COLORS.length];
    try {
      const ws = await onCreate(title, undefined, color);
      onSelect(ws.id);
    } catch (err: any) {
      await modal.alert({ message: `Failed to create workspace: ${err.message}`, variant: "error" });
    }
  };

  const handleDelete = async (e: React.MouseEvent, ws: Workspace) => {
    e.stopPropagation();
    const confirmed = await modal.confirm({
      message: `Delete "${ws.title}" and all its pages? This cannot be undone.`,
      variant: "destructive",
      confirmLabel: "Delete",
    });
    if (confirmed) {
      try {
        await onDelete(ws.id);
      } catch (err: any) {
        await modal.alert({ message: `Failed to delete: ${err.message}`, variant: "error" });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-surface-400">
        Loading workspaces...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-surface-800">Workspaces</h2>
        <button
          onClick={handleCreate}
          className="px-3 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors"
        >
          + New Workspace
        </button>
      </div>

      {workspaces.length === 0 ? (
        <div className="text-center py-12 text-surface-400">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-lg font-medium">No workspaces yet</p>
          <p className="text-sm mt-1">Create your first wiki workspace to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              onClick={() => onSelect(ws.id)}
              className="group bg-white rounded-xl border border-surface-200 p-4 cursor-pointer shadow-card hover:shadow-card-hover transition-all"
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: ws.color + "20" }}
                >
                  {ws.icon}
                </div>
                <button
                  onClick={(e) => handleDelete(e, ws)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-surface-400 hover:text-red-500 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <h3 className="mt-3 font-semibold text-surface-800">{ws.title}</h3>
              {ws.description && (
                <p className="mt-1 text-sm text-surface-500 line-clamp-2">{ws.description}</p>
              )}
              <p className="mt-2 text-xs text-surface-400">
                Updated {new Date(ws.updated_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

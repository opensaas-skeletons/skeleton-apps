import type { SyncRepo } from "@shared/types/ai";

interface RepoListProps {
  repos: SyncRepo[];
  onSync: (repoId: string) => void;
  onEdit: (repo: SyncRepo) => void;
  onDelete: (id: string) => void;
}

function statusBadge(status: SyncRepo["status"]) {
  const styles: Record<string, string> = {
    pending: "bg-surface-100 text-surface-600",
    syncing: "bg-yellow-100 text-yellow-700",
    synced: "bg-green-100 text-green-700",
    error: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    pending: "Pending",
    syncing: "Syncing...",
    synced: "Synced",
    error: "Error",
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function extractRepoName(url: string): string {
  try {
    const parts = url.replace(/\.git$/, "").split("/");
    return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
  } catch {
    return url;
  }
}

export default function RepoList({ repos, onSync, onEdit, onDelete }: RepoListProps) {
  if (repos.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 mx-auto text-surface-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <p className="text-surface-500 text-sm">No repositories configured</p>
        <p className="text-surface-400 text-xs mt-1">Add a GitHub repository to start syncing</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {repos.map((repo) => (
        <div
          key={repo.id}
          className="bg-white border border-surface-200 rounded-lg p-4 hover:border-surface-300 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-surface-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
                <h3 className="text-sm font-medium text-surface-900 truncate">{repo.title}</h3>
                {statusBadge(repo.status)}
              </div>
              <p className="text-xs text-surface-500 truncate mb-2">{extractRepoName(repo.repo_url)}</p>
              <div className="flex items-center gap-4 text-xs text-surface-400">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {repo.branch}
                </span>
                <span>Last sync: {formatDate(repo.last_synced_at)}</span>
                {repo.auto_sync && (
                  <span className="text-green-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Auto
                  </span>
                )}
              </div>
              {repo.error_message && (
                <p className="text-xs text-red-500 mt-2 bg-red-50 px-2 py-1 rounded">
                  {repo.error_message}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 ml-3">
              <button
                onClick={() => onSync(repo.id)}
                disabled={repo.status === "syncing"}
                className="p-1.5 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors disabled:opacity-50"
                title="Sync now"
              >
                <svg className={`w-4 h-4 ${repo.status === "syncing" ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={() => onEdit(repo)}
                className="p-1.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-lg transition-colors"
                title="Edit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete "${repo.title}"? This will also remove the synced source.`)) {
                    onDelete(repo.id);
                  }
                }}
                className="p-1.5 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

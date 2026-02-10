import type { SyncHistory, SyncRepo } from "@shared/types/ai";

interface SyncHistoryListProps {
  history: SyncHistory[];
  repos: SyncRepo[];
}

function statusIcon(status: SyncHistory["status"]) {
  switch (status) {
    case "success":
      return (
        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    case "error":
      return (
        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    case "running":
      return (
        <div className="w-7 h-7 rounded-full bg-yellow-100 flex items-center justify-center">
          <div className="w-3.5 h-3.5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
        </div>
      );
  }
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(start: string, end?: string): string {
  if (!end) return "Running...";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return "<1s";
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  return `${mins}m ${secs % 60}s`;
}

export default function SyncHistoryList({ history, repos }: SyncHistoryListProps) {
  const repoMap = new Map(repos.map((r) => [r.id, r]));

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 mx-auto text-surface-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-surface-500 text-sm">No sync history yet</p>
        <p className="text-surface-400 text-xs mt-1">Sync a repository to see its history</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((entry) => {
        const repo = repoMap.get(entry.repo_id);
        return (
          <div
            key={entry.id}
            className="bg-white border border-surface-200 rounded-lg p-3 flex items-start gap-3"
          >
            {statusIcon(entry.status)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-surface-800">
                  {repo?.title || "Unknown Repo"}
                </span>
                <span className="text-xs text-surface-400">
                  {formatDateTime(entry.started_at)}
                </span>
              </div>
              {entry.status === "success" && (
                <div className="flex items-center gap-3 mt-1 text-xs text-surface-500">
                  <span>{entry.files_changed} files changed</span>
                  {entry.commit_hash && (
                    <span className="font-mono text-surface-400">
                      {entry.commit_hash.slice(0, 7)}
                    </span>
                  )}
                  <span>{formatDuration(entry.started_at, entry.completed_at)}</span>
                </div>
              )}
              {entry.status === "error" && entry.error_message && (
                <p className="text-xs text-red-500 mt-1 truncate">{entry.error_message}</p>
              )}
              {entry.status === "running" && (
                <p className="text-xs text-yellow-600 mt-1">Sync in progress...</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

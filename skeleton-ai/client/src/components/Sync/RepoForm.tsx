import { useState } from "react";
import type { SyncRepo, CreateSyncRepoInput } from "@shared/types/ai";

interface RepoFormProps {
  repo?: SyncRepo | null;
  onSubmit: (input: CreateSyncRepoInput) => Promise<void>;
  onClose: () => void;
}

export default function RepoForm({ repo, onSubmit, onClose }: RepoFormProps) {
  const [title, setTitle] = useState(repo?.title || "");
  const [repoUrl, setRepoUrl] = useState(repo?.repo_url || "");
  const [branch, setBranch] = useState(repo?.branch || "main");
  const [githubToken, setGithubToken] = useState("");
  const [autoSync, setAutoSync] = useState(repo?.auto_sync !== false);
  const [syncInterval, setSyncInterval] = useState(repo?.sync_interval_hours || 168);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        repo_url: repoUrl.trim(),
        branch,
        github_token: githubToken || undefined,
        auto_sync: autoSync,
        sync_interval_hours: syncInterval,
      });
    } catch (err: any) {
      setError(err.message || "Failed to save repository");
    } finally {
      setSubmitting(false);
    }
  };

  const intervalPresets = [
    { label: "Daily", hours: 24 },
    { label: "Weekly", hours: 168 },
    { label: "Bi-weekly", hours: 336 },
    { label: "Monthly", hours: 720 },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-surface-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-surface-900">
            {repo ? "Edit Repository" : "Add Repository"}
          </h2>
          <button onClick={onClose} className="p-1 text-surface-400 hover:text-surface-600 rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-surface-700 mb-1">Display Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Project"
              required
              className="w-full px-3 py-2 text-sm border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-700 mb-1">Repository URL</label>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo.git"
              required
              disabled={!!repo}
              className="w-full px-3 py-2 text-sm border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-surface-50 disabled:text-surface-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-700 mb-1">Branch</label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="w-full px-3 py-2 text-sm border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-700 mb-1">
              GitHub Token <span className="text-surface-400 font-normal">(optional, for private repos)</span>
            </label>
            <input
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder={repo ? "••••••••" : "ghp_..."}
              className="w-full px-3 py-2 text-sm border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-surface-700">Auto-sync enabled</label>
            <button
              type="button"
              onClick={() => setAutoSync(!autoSync)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                autoSync ? "bg-brand-600" : "bg-surface-300"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  autoSync ? "translate-x-4.5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {autoSync && (
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-2">Sync Interval</label>
              <div className="flex gap-2">
                {intervalPresets.map((preset) => (
                  <button
                    key={preset.hours}
                    type="button"
                    onClick={() => setSyncInterval(preset.hours)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      syncInterval === preset.hours
                        ? "bg-brand-100 text-brand-700 border border-brand-300"
                        : "bg-surface-100 text-surface-600 border border-surface-200 hover:bg-surface-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-surface-600 hover:bg-surface-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving..." : repo ? "Update" : "Add Repository"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

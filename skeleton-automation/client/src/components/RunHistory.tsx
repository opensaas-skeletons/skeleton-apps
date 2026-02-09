import { useState, useEffect } from "react";
import type { WorkflowRun } from "@shared/types/workflow";
import { STATUS_COLORS, ACTION_LABELS } from "@shared/constants";
import * as api from "../api/client";

interface RunHistoryProps {
  workflowId: string;
  onClose: () => void;
}

export default function RunHistory({ workflowId, onClose }: RunHistoryProps) {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  useEffect(() => {
    const fetchRuns = async () => {
      setLoading(true);
      try {
        const data = await api.listRuns(workflowId);
        setRuns(data);
      } catch (err: any) {
        console.error("Failed to load runs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRuns();

    // Poll every 2s while any run is still "running"
    const interval = setInterval(async () => {
      try {
        const data = await api.listRuns(workflowId);
        setRuns(data);
      } catch { /* ignore polling errors */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [workflowId]);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString();
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return "running...";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="bg-white rounded-lg border border-surface-200 shadow-card">
      <div className="px-6 py-4 border-b border-surface-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-surface-900">Run History</h2>
        <button
          onClick={onClose}
          className="p-1.5 text-surface-400 hover:text-surface-600 rounded"
        >
          <svg
            className="w-5 h-5"
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

      <div className="px-6 py-4">
        {loading && (
          <p className="text-sm text-surface-400 py-4 text-center">
            Loading runs...
          </p>
        )}

        {!loading && runs.length === 0 && (
          <p className="text-sm text-surface-400 py-4 text-center">
            No runs yet. Trigger the workflow to see execution history.
          </p>
        )}

        {!loading && runs.length > 0 && (
          <div className="space-y-2">
            {runs.map((run) => (
              <div key={run.id} className="border border-surface-200 rounded-md">
                <button
                  onClick={() =>
                    setExpandedRun(expandedRun === run.id ? null : run.id)
                  }
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-surface-50 transition-colors rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: STATUS_COLORS[run.status] || "#6B7280",
                      }}
                    />
                    <span className="text-sm font-medium text-surface-800 capitalize">
                      {run.status}
                    </span>
                    <span className="text-xs text-surface-400">
                      {formatTime(run.started_at)}
                    </span>
                  </div>
                  <span className="text-xs text-surface-400">
                    {formatDuration(run.started_at, run.completed_at)}
                  </span>
                </button>

                {expandedRun === run.id && (
                  <div className="px-4 pb-3 space-y-2">
                    {run.error && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-mono">
                        {run.error}
                      </div>
                    )}

                    {run.action_results && run.action_results.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-surface-500">
                          Actions:
                        </p>
                        {run.action_results.map((result: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-xs p-2 bg-surface-50 rounded"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                result.status === "success"
                                  ? "bg-green-500"
                                  : result.status === "failed"
                                    ? "bg-red-500"
                                    : "bg-surface-400"
                              }`}
                            />
                            <span className="text-surface-600">
                              {ACTION_LABELS[result.action_type] ||
                                result.action_type}
                            </span>
                            <span className="text-surface-400">
                              {result.duration_ms}ms
                            </span>
                            {result.error && (
                              <span className="text-red-500 truncate">
                                {result.error}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {run.trigger_data &&
                      Object.keys(run.trigger_data).length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-surface-500 font-medium">
                            Trigger Data
                          </summary>
                          <pre className="mt-1 p-2 bg-surface-50 rounded overflow-auto text-surface-600 font-mono">
                            {JSON.stringify(run.trigger_data, null, 2)}
                          </pre>
                        </details>
                      )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

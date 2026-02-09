import type { Workflow } from "@shared/types/workflow";
import {
  TRIGGER_LABELS,
  TRIGGER_COLORS,
  ACTION_LABELS,
} from "@shared/constants";
import { useModal } from "../contexts/ModalContext";

interface WorkflowListProps {
  workflows: Workflow[];
  onSelect: (workflow: Workflow) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onTrigger: (id: string) => void;
  onDelete: (id: string) => void;
  onViewRuns: (workflow: Workflow) => void;
}

export default function WorkflowList({
  workflows,
  onSelect,
  onToggle,
  onTrigger,
  onDelete,
  onViewRuns,
}: WorkflowListProps) {
  const modal = useModal();
  if (workflows.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-surface-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-surface-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-surface-700 mb-1">
          No workflows yet
        </h3>
        <p className="text-surface-500">
          Create your first workflow to get started with automation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {workflows.map((workflow) => (
        <div
          key={workflow.id}
          className="bg-white rounded-lg border border-surface-200 shadow-card hover:shadow-card-hover transition-shadow"
        >
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div
                className="flex-1 cursor-pointer"
                onClick={() => onSelect(workflow)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-medium text-surface-900">
                    {workflow.title}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      workflow.enabled
                        ? "bg-green-100 text-green-700"
                        : "bg-surface-100 text-surface-500"
                    }`}
                  >
                    {workflow.enabled ? "Active" : "Disabled"}
                  </span>
                </div>
                {workflow.description && (
                  <p className="text-sm text-surface-500 mb-2 line-clamp-1">
                    {workflow.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-surface-400">
                  <span className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          TRIGGER_COLORS[workflow.trigger.type] || "#6B7280",
                      }}
                    />
                    {TRIGGER_LABELS[workflow.trigger.type] || workflow.trigger.type}
                  </span>
                  <span>
                    {workflow.actions.length} action
                    {workflow.actions.length !== 1 ? "s" : ""}
                    {workflow.actions.length > 0 && (
                      <>
                        {" "}
                        ({workflow.actions
                          .map((a) => ACTION_LABELS[a.type] || a.type)
                          .join(", ")})
                      </>
                    )}
                  </span>
                  {workflow.conditions.length > 0 && (
                    <span>
                      {workflow.conditions.length} condition
                      {workflow.conditions.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 ml-4 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewRuns(workflow);
                  }}
                  title="View run history"
                  className="p-1.5 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTrigger(workflow.id);
                  }}
                  title="Test trigger"
                  className="p-1.5 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
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
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(workflow.id, !workflow.enabled);
                  }}
                  title={workflow.enabled ? "Disable" : "Enable"}
                  className="p-1.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded transition-colors"
                >
                  {workflow.enabled ? (
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
                        d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
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
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                    </svg>
                  )}
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (
                      await modal.confirm({
                        message: `Delete workflow "${workflow.title}"? This cannot be undone.`,
                        variant: "destructive",
                        confirmLabel: "Delete",
                      })
                    ) {
                      onDelete(workflow.id);
                    }
                  }}
                  title="Delete"
                  className="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

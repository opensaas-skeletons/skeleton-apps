import { useState, useEffect } from "react";
import type {
  Workflow,
  TriggerConfig as TriggerConfigType,
  ActionConfig as ActionConfigType,
  Condition,
  CreateWorkflowInput,
} from "@shared/types/workflow";
import TriggerConfig from "./TriggerConfig";
import ActionConfigComponent from "./ActionConfig";
import { CONDITION_OPERATORS } from "@shared/constants";

interface WorkflowEditorProps {
  workflow?: Workflow | null;
  onSave: (input: CreateWorkflowInput) => Promise<void>;
  onCancel: () => void;
}

export default function WorkflowEditor({
  workflow,
  onSave,
  onCancel,
}: WorkflowEditorProps) {
  const [title, setTitle] = useState(workflow?.title || "");
  const [description, setDescription] = useState(workflow?.description || "");
  const [enabled, setEnabled] = useState(workflow?.enabled ?? true);
  const [trigger, setTrigger] = useState<TriggerConfigType>(
    workflow?.trigger || { type: "webhook", config: { path: "/hooks/" } }
  );
  const [conditions, setConditions] = useState<Condition[]>(
    workflow?.conditions || []
  );
  const [actions, setActions] = useState<ActionConfigType[]>(
    workflow?.actions || []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step navigation
  const [step, setStep] = useState(0);
  const steps = ["Trigger", "Conditions", "Actions", "Review"];

  useEffect(() => {
    if (workflow) {
      setTitle(workflow.title);
      setDescription(workflow.description);
      setEnabled(workflow.enabled);
      setTrigger(workflow.trigger);
      setConditions(workflow.conditions);
      setActions(workflow.actions);
    }
  }, [workflow]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (actions.length === 0) {
      setError("At least one action is required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        enabled,
        trigger,
        conditions,
        actions,
      });
    } catch (err: any) {
      setError(err.message || "Failed to save workflow");
    } finally {
      setSaving(false);
    }
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      { field: "", operator: "equals", value: "" },
    ]);
  };

  const updateCondition = (index: number, updated: Condition) => {
    const next = [...conditions];
    next[index] = updated;
    setConditions(next);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-lg border border-surface-200 shadow-card">
      {/* Header */}
      <div className="px-6 py-4 border-b border-surface-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-surface-900">
            {workflow ? "Edit Workflow" : "New Workflow"}
          </h2>
          <button
            onClick={onCancel}
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

        {/* Step Indicators */}
        <div className="flex items-center gap-1 mt-3">
          {steps.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i)}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                i === step
                  ? "bg-brand-100 text-brand-700"
                  : i < step
                    ? "bg-green-50 text-green-600"
                    : "bg-surface-50 text-surface-400"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        {error && (
          <div className="mb-4 px-3 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {/* Basic Info (always visible) */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Workflow"
                className="w-full px-3 py-2 text-sm border border-surface-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this workflow do?"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-surface-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="rounded border-surface-300 text-brand-600 focus:ring-brand-500"
              />
              <label
                htmlFor="enabled"
                className="text-sm text-surface-700"
              >
                Enable workflow immediately
              </label>
            </div>

            <hr className="border-surface-100" />

            <TriggerConfig trigger={trigger} onChange={setTrigger} />
          </div>
        )}

        {/* Step 2: Conditions */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-surface-500">
              Conditions filter when the workflow runs. All conditions must be
              met (AND logic). Leave empty to always run.
            </p>

            {conditions.map((condition, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 border border-surface-200 rounded-md"
              >
                <input
                  type="text"
                  value={condition.field}
                  onChange={(e) =>
                    updateCondition(index, {
                      ...condition,
                      field: e.target.value,
                    })
                  }
                  placeholder="field.path"
                  className="flex-1 px-2 py-1.5 text-sm border border-surface-200 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <select
                  value={condition.operator}
                  onChange={(e) =>
                    updateCondition(index, {
                      ...condition,
                      operator: e.target.value as Condition["operator"],
                    })
                  }
                  className="px-2 py-1.5 text-sm border border-surface-200 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {CONDITION_OPERATORS.map((op) => (
                    <option key={op} value={op}>
                      {op.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={String(condition.value ?? "")}
                  onChange={(e) =>
                    updateCondition(index, {
                      ...condition,
                      value: e.target.value,
                    })
                  }
                  placeholder="value"
                  className="flex-1 px-2 py-1.5 text-sm border border-surface-200 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  onClick={() => removeCondition(index)}
                  className="p-1 text-surface-400 hover:text-red-500 rounded"
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
            ))}

            <button
              onClick={addCondition}
              className="px-3 py-1.5 text-sm border border-dashed border-surface-300 text-surface-500 hover:border-brand-400 hover:text-brand-600 rounded-md transition-colors"
            >
              + Add Condition
            </button>
          </div>
        )}

        {/* Step 3: Actions */}
        {step === 2 && (
          <ActionConfigComponent actions={actions} onChange={setActions} />
        )}

        {/* Step 4: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 bg-surface-50 rounded-lg">
              <h3 className="text-sm font-semibold text-surface-700 mb-2">
                Summary
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex">
                  <dt className="w-24 text-surface-500">Title:</dt>
                  <dd className="text-surface-900 font-medium">
                    {title || "(untitled)"}
                  </dd>
                </div>
                <div className="flex">
                  <dt className="w-24 text-surface-500">Status:</dt>
                  <dd>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-surface-100 text-surface-500"
                      }`}
                    >
                      {enabled ? "Active" : "Disabled"}
                    </span>
                  </dd>
                </div>
                <div className="flex">
                  <dt className="w-24 text-surface-500">Trigger:</dt>
                  <dd className="text-surface-900">
                    {trigger.type}
                    {trigger.type === "schedule" && ` (${trigger.config.cron})`}
                    {trigger.type === "webhook" && ` (${trigger.config.path})`}
                    {trigger.type === "event" &&
                      ` (${trigger.config.source}:${trigger.config.event})`}
                  </dd>
                </div>
                <div className="flex">
                  <dt className="w-24 text-surface-500">Conditions:</dt>
                  <dd className="text-surface-900">
                    {conditions.length === 0
                      ? "None"
                      : `${conditions.length} condition(s)`}
                  </dd>
                </div>
                <div className="flex">
                  <dt className="w-24 text-surface-500">Actions:</dt>
                  <dd className="text-surface-900">
                    {actions.length === 0
                      ? "None"
                      : actions.map((a) => a.type).join(" → ")}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-surface-200 flex items-center justify-between">
        <div>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-sm text-surface-600 hover:text-surface-900 transition-colors"
            >
              Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-surface-600 hover:text-surface-900 transition-colors"
          >
            Cancel
          </button>
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : workflow
                  ? "Update Workflow"
                  : "Create Workflow"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

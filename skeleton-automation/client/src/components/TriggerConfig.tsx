import type { TriggerConfig as TriggerConfigType } from "@shared/types/workflow";
import { TRIGGER_LABELS, TRIGGER_COLORS } from "@shared/constants";

interface TriggerConfigProps {
  trigger: TriggerConfigType;
  onChange: (trigger: TriggerConfigType) => void;
}

export default function TriggerConfig({ trigger, onChange }: TriggerConfigProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-surface-700 mb-2">
          Trigger Type
        </label>
        <div className="flex gap-2">
          {(["webhook", "schedule", "event"] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                if (type === "webhook") {
                  onChange({ type: "webhook", config: { path: "/hooks/" } });
                } else if (type === "schedule") {
                  onChange({
                    type: "schedule",
                    config: { cron: "0 9 * * 1-5" },
                  });
                } else {
                  onChange({
                    type: "event",
                    config: { source: "", event: "" },
                  });
                }
              }}
              className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                trigger.type === type
                  ? "border-brand-500 bg-brand-50 text-brand-700 font-medium"
                  : "border-surface-200 text-surface-600 hover:border-surface-300"
              }`}
            >
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: TRIGGER_COLORS[type] }}
              />
              {TRIGGER_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {trigger.type === "webhook" && (
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">
            Webhook Path
          </label>
          <input
            type="text"
            value={trigger.config.path}
            onChange={(e) =>
              onChange({
                ...trigger,
                config: { ...trigger.config, path: e.target.value },
              })
            }
            placeholder="/hooks/my-trigger"
            className="w-full px-3 py-2 text-sm border border-surface-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-surface-400">
            POST requests to this path will trigger the workflow.
          </p>
        </div>
      )}

      {trigger.type === "schedule" && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">
              Cron Expression
            </label>
            <input
              type="text"
              value={trigger.config.cron}
              onChange={(e) =>
                onChange({
                  ...trigger,
                  config: { ...trigger.config, cron: e.target.value },
                })
              }
              placeholder="0 9 * * 1-5"
              className="w-full px-3 py-2 text-sm font-mono border border-surface-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-surface-400">
              Standard cron format: minute hour day-of-month month day-of-week
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Every hour", cron: "0 * * * *" },
              { label: "Daily 9am", cron: "0 9 * * *" },
              { label: "Weekdays 9am", cron: "0 9 * * 1-5" },
              { label: "Monday 9am", cron: "0 9 * * 1" },
              { label: "Friday 5pm", cron: "0 17 * * 5" },
            ].map((preset) => (
              <button
                key={preset.cron}
                onClick={() =>
                  onChange({
                    ...trigger,
                    config: { ...trigger.config, cron: preset.cron },
                  })
                }
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  trigger.config.cron === preset.cron
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-surface-200 text-surface-500 hover:border-surface-300"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {trigger.type === "event" && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">
              Source App
            </label>
            <input
              type="text"
              value={trigger.config.source}
              onChange={(e) =>
                onChange({
                  ...trigger,
                  config: { ...trigger.config, source: e.target.value },
                })
              }
              placeholder="skeleton-tasks"
              className="w-full px-3 py-2 text-sm border border-surface-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">
              Event Name
            </label>
            <input
              type="text"
              value={trigger.config.event}
              onChange={(e) =>
                onChange({
                  ...trigger,
                  config: { ...trigger.config, event: e.target.value },
                })
              }
              placeholder="task.moved"
              className="w-full px-3 py-2 text-sm border border-surface-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        </div>
      )}
    </div>
  );
}

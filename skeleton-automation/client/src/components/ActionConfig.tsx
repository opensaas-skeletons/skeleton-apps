import type { ActionConfig as ActionConfigType } from "@shared/types/workflow";
import { ACTION_LABELS, ACTION_COLORS } from "@shared/constants";

interface ActionConfigProps {
  actions: ActionConfigType[];
  onChange: (actions: ActionConfigType[]) => void;
}

const DEFAULT_ACTIONS: Record<string, ActionConfigType> = {
  http: {
    type: "http",
    config: { method: "POST", url: "", headers: {}, body: {} },
  },
  email: {
    type: "email",
    config: { to: "", subject: "", body: "" },
  },
  webhook: {
    type: "webhook",
    config: { url: "", payload: {} },
  },
  transform: {
    type: "transform",
    config: { expression: 'return { ...input, processed: true }' },
  },
  delay: {
    type: "delay",
    config: { seconds: 10 },
  },
};

export default function ActionConfig({ actions, onChange }: ActionConfigProps) {
  const addAction = (type: string) => {
    const template = DEFAULT_ACTIONS[type];
    if (template) {
      onChange([...actions, { ...template }]);
    }
  };

  const updateAction = (index: number, updated: ActionConfigType) => {
    const next = [...actions];
    next[index] = updated;
    onChange(next);
  };

  const removeAction = (index: number) => {
    onChange(actions.filter((_, i) => i !== index));
  };

  const moveAction = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= actions.length) return;
    const next = [...actions];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {actions.map((action, index) => (
        <div
          key={index}
          className={`relative border border-surface-200 rounded-lg p-4 ${
            index > 0 ? "step-connector" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-surface-400">
                Step {index + 1}
              </span>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
                style={{ backgroundColor: ACTION_COLORS[action.type] || "#6B7280" }}
              >
                {ACTION_LABELS[action.type] || action.type}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {index > 0 && (
                <button
                  onClick={() => moveAction(index, -1)}
                  className="p-1 text-surface-400 hover:text-surface-600 rounded"
                  title="Move up"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              )}
              {index < actions.length - 1 && (
                <button
                  onClick={() => moveAction(index, 1)}
                  className="p-1 text-surface-400 hover:text-surface-600 rounded"
                  title="Move down"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => removeAction(index)}
                className="p-1 text-surface-400 hover:text-red-500 rounded"
                title="Remove action"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {action.type === "http" && (
            <HttpActionFields
              config={action.config}
              onChange={(config) => updateAction(index, { ...action, config } as ActionConfigType)}
            />
          )}

          {action.type === "email" && (
            <EmailActionFields
              config={action.config}
              onChange={(config) => updateAction(index, { ...action, config } as ActionConfigType)}
            />
          )}

          {action.type === "webhook" && (
            <WebhookActionFields
              config={action.config}
              onChange={(config) => updateAction(index, { ...action, config } as ActionConfigType)}
            />
          )}

          {action.type === "transform" && (
            <TransformActionFields
              config={action.config}
              onChange={(config) => updateAction(index, { ...action, config } as ActionConfigType)}
            />
          )}

          {action.type === "delay" && (
            <DelayActionFields
              config={action.config}
              onChange={(config) => updateAction(index, { ...action, config } as ActionConfigType)}
            />
          )}
        </div>
      ))}

      <div>
        <p className="text-xs font-medium text-surface-500 mb-2">Add Action</p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(DEFAULT_ACTIONS).map((type) => (
            <button
              key={type}
              onClick={() => addAction(type)}
              className="px-3 py-1.5 text-xs border border-dashed border-surface-300 text-surface-500 hover:border-brand-400 hover:text-brand-600 rounded-md transition-colors"
            >
              + {ACTION_LABELS[type] || type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Sub-forms for each action type ----

function HttpActionFields({
  config,
  onChange,
}: {
  config: { method: string; url: string; headers?: Record<string, string>; body?: unknown };
  onChange: (config: any) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select
          value={config.method}
          onChange={(e) => onChange({ ...config, method: e.target.value })}
          className="px-3 py-2 text-sm border border-surface-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={config.url}
          onChange={(e) => onChange({ ...config, url: e.target.value })}
          placeholder="https://api.example.com/endpoint"
          className="flex-1 px-3 py-2 text-sm border border-surface-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-surface-500 mb-1">
          Body (JSON)
        </label>
        <textarea
          value={typeof config.body === "string" ? config.body : JSON.stringify(config.body, null, 2)}
          onChange={(e) => {
            try {
              onChange({ ...config, body: JSON.parse(e.target.value) });
            } catch {
              onChange({ ...config, body: e.target.value });
            }
          }}
          rows={3}
          placeholder='{"key": "value"}'
          className="w-full px-3 py-2 text-sm font-mono border border-surface-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
        />
      </div>
    </div>
  );
}

function EmailActionFields({
  config,
  onChange,
}: {
  config: { to: string; subject: string; body: string };
  onChange: (config: any) => void;
}) {
  return (
    <div className="space-y-3">
      <input
        type="email"
        value={config.to}
        onChange={(e) => onChange({ ...config, to: e.target.value })}
        placeholder="recipient@example.com"
        className="w-full px-3 py-2 text-sm border border-surface-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <input
        type="text"
        value={config.subject}
        onChange={(e) => onChange({ ...config, subject: e.target.value })}
        placeholder="Email subject (supports {{variables}})"
        className="w-full px-3 py-2 text-sm border border-surface-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <textarea
        value={config.body}
        onChange={(e) => onChange({ ...config, body: e.target.value })}
        rows={3}
        placeholder="Email body (supports {{variables}})"
        className="w-full px-3 py-2 text-sm border border-surface-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
      />
    </div>
  );
}

function WebhookActionFields({
  config,
  onChange,
}: {
  config: { url: string; payload?: unknown };
  onChange: (config: any) => void;
}) {
  return (
    <div className="space-y-3">
      <input
        type="text"
        value={config.url}
        onChange={(e) => onChange({ ...config, url: e.target.value })}
        placeholder="https://hooks.example.com/endpoint"
        className="w-full px-3 py-2 text-sm border border-surface-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <div>
        <label className="block text-xs font-medium text-surface-500 mb-1">
          Payload (JSON, optional)
        </label>
        <textarea
          value={
            config.payload
              ? typeof config.payload === "string"
                ? config.payload
                : JSON.stringify(config.payload, null, 2)
              : ""
          }
          onChange={(e) => {
            if (!e.target.value) {
              onChange({ ...config, payload: undefined });
              return;
            }
            try {
              onChange({ ...config, payload: JSON.parse(e.target.value) });
            } catch {
              onChange({ ...config, payload: e.target.value });
            }
          }}
          rows={3}
          placeholder="Leave empty to forward trigger data"
          className="w-full px-3 py-2 text-sm font-mono border border-surface-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
        />
      </div>
    </div>
  );
}

function TransformActionFields({
  config,
  onChange,
}: {
  config: { expression: string };
  onChange: (config: any) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-surface-500 mb-1">
        JavaScript Expression
      </label>
      <textarea
        value={config.expression}
        onChange={(e) => onChange({ ...config, expression: e.target.value })}
        rows={3}
        placeholder='return { ...input, processed: true }'
        className="w-full px-3 py-2 text-sm font-mono border border-surface-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
      />
      <p className="mt-1 text-xs text-surface-400">
        Receives <code className="text-brand-600">input</code> object. Return transformed data for the next action.
      </p>
    </div>
  );
}

function DelayActionFields({
  config,
  onChange,
}: {
  config: { seconds: number };
  onChange: (config: any) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-surface-500 mb-1">
        Delay (seconds)
      </label>
      <input
        type="number"
        value={config.seconds}
        onChange={(e) =>
          onChange({ ...config, seconds: parseInt(e.target.value) || 0 })
        }
        min={1}
        max={300}
        className="w-32 px-3 py-2 text-sm border border-surface-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <p className="mt-1 text-xs text-surface-400">Max 300 seconds (5 minutes).</p>
    </div>
  );
}

import { useState } from "react";
import type { SyncSchedule } from "@shared/types/ai";

interface ScheduleConfigProps {
  schedule: SyncSchedule;
  onUpdate: (updates: Partial<SyncSchedule>) => Promise<SyncSchedule>;
}

const CRON_PRESETS = [
  { label: "Every 6 hours", cron: "0 */6 * * *" },
  { label: "Daily at 3am", cron: "0 3 * * *" },
  { label: "Weekly (Sunday 3am)", cron: "0 3 * * 0" },
  { label: "Monthly (1st at 3am)", cron: "0 3 1 * *" },
];

export default function ScheduleConfig({ schedule, onUpdate }: ScheduleConfigProps) {
  const [enabled, setEnabled] = useState(schedule.enabled);
  const [cronExpression, setCronExpression] = useState(schedule.cron_expression);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await onUpdate({ enabled, cron_expression: cronExpression });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to update schedule:", err);
    } finally {
      setSaving(false);
    }
  };

  const currentPreset = CRON_PRESETS.find((p) => p.cron === cronExpression);

  return (
    <div className="max-w-lg space-y-6">
      {/* Enable/Disable */}
      <div className="bg-white border border-surface-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-surface-900">Auto-Sync Schedule</h3>
            <p className="text-xs text-surface-500 mt-0.5">
              Automatically sync all enabled repositories on a schedule
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? "bg-brand-600" : "bg-surface-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {enabled && (
        <>
          {/* Presets */}
          <div className="bg-white border border-surface-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-surface-900 mb-3">Schedule Frequency</h3>
            <div className="grid grid-cols-2 gap-2">
              {CRON_PRESETS.map((preset) => (
                <button
                  key={preset.cron}
                  onClick={() => setCronExpression(preset.cron)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors text-left ${
                    cronExpression === preset.cron
                      ? "bg-brand-50 text-brand-700 border-brand-300"
                      : "bg-white text-surface-600 border-surface-200 hover:bg-surface-50"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Cron */}
          <div className="bg-white border border-surface-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-surface-900 mb-2">Custom Cron Expression</h3>
            <input
              type="text"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              placeholder="0 3 * * 0"
              className="w-full px-3 py-2 text-sm font-mono border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <p className="text-xs text-surface-400 mt-1.5">
              Format: minute hour day-of-month month day-of-week
              {currentPreset && (
                <span className="text-brand-600 ml-1">({currentPreset.label})</span>
              )}
            </p>
          </div>

          {/* Last Run Info */}
          {schedule.last_run_at && (
            <div className="bg-surface-50 border border-surface-200 rounded-lg p-4">
              <p className="text-xs text-surface-500">
                Last run: {new Date(schedule.last_run_at).toLocaleString()}
              </p>
            </div>
          )}
        </>
      )}

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Schedule"}
        </button>
        {saved && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </span>
        )}
      </div>
    </div>
  );
}

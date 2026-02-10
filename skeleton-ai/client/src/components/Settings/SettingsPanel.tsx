import { useState, useEffect } from "react";
import type { Settings, ProviderInfo } from "@shared/types/ai";
import ProviderSettings from "./ProviderSettings";
import RetrievalSettings from "./RetrievalSettings";
import SystemPromptEditor from "./SystemPromptEditor";

interface SettingsPanelProps {
  settings: Settings | null;
  providers: ProviderInfo[];
  loading: boolean;
  onUpdate: (updates: Partial<Settings>) => Promise<any>;
  onBack: () => void;
}

export default function SettingsPanel({
  settings,
  providers,
  loading,
  onUpdate,
  onBack,
}: SettingsPanelProps) {
  const [draft, setDraft] = useState<Partial<Settings>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setDraft({});
    }
  }, [settings]);

  const merged = settings ? { ...settings, ...draft } : null;

  const handleChange = (key: string, value: any) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (Object.keys(draft).length === 0) return;
    setSaving(true);
    try {
      await onUpdate(draft);
      setDraft({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !merged) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-surface-400 text-sm">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-surface-800">Settings</h2>
          <button
            onClick={handleSave}
            disabled={Object.keys(draft).length === 0 || saving}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              saved
                ? "bg-green-100 text-green-700"
                : "bg-brand-600 hover:bg-brand-700 text-white disabled:bg-surface-300"
            }`}
          >
            {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className="space-y-6">
          <ProviderSettings
            settings={merged}
            providers={providers}
            onChange={handleChange}
          />

          <RetrievalSettings
            settings={merged}
            onChange={handleChange}
          />

          <SystemPromptEditor
            value={merged.system_prompt}
            onChange={(v) => handleChange("system_prompt", v)}
          />
        </div>
      </div>
    </div>
  );
}

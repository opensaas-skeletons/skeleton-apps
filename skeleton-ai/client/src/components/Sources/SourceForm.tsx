import { useState } from "react";
import type { CreateSourceInput } from "@shared/types/ai";

interface SourceFormProps {
  onSubmit: (input: CreateSourceInput) => Promise<void>;
  onCancel: () => void;
  initialValues?: Partial<CreateSourceInput>;
}

export default function SourceForm({ onSubmit, onCancel, initialValues }: SourceFormProps) {
  const [title, setTitle] = useState(initialValues?.title || "");
  const [description, setDescription] = useState(initialValues?.description || "");
  const [sourceType, setSourceType] = useState<"directory" | "url">(initialValues?.source_type || "directory");
  const [path, setPath] = useState(initialValues?.config?.path || "");
  const [url, setUrl] = useState(initialValues?.config?.url || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const config: Record<string, any> = {};
    if (sourceType === "directory") {
      config.path = path;
    } else {
      config.url = url;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        source_type: sourceType,
        config,
      });
    } catch (err) {
      console.error("Failed to create source:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="px-5 pt-5 pb-4 space-y-4">
            <h3 className="text-base font-semibold text-surface-800">Add Source</h3>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Project Source"
                className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Source Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSourceType("directory")}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                    sourceType === "directory"
                      ? "bg-brand-50 border-brand-300 text-brand-700"
                      : "bg-white border-surface-300 text-surface-600 hover:bg-surface-50"
                  }`}
                >
                  Directory
                </button>
                <button
                  type="button"
                  onClick={() => setSourceType("url")}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                    sourceType === "url"
                      ? "bg-brand-50 border-brand-300 text-brand-700"
                      : "bg-white border-surface-300 text-surface-600 hover:bg-surface-50"
                  }`}
                >
                  URL
                </button>
              </div>
            </div>

            {sourceType === "directory" ? (
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Directory Path</label>
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="/path/to/your/project"
                  className="w-full px-3 py-2 text-sm font-mono border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/docs"
                  className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
                />
              </div>
            )}
          </div>

          <div className="px-5 py-3 border-t border-surface-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || submitting}
              className="px-3 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-surface-300 rounded-md transition-colors"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

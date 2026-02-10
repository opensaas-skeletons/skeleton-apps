import { useState, useMemo } from "react";
import { useActivities } from "../../hooks/useActivities";
import { useModal } from "../../contexts/ModalContext";
import { ACTIVITY_TYPES } from "@shared/constants";
import ActivityForm from "./ActivityForm";
import type { Activity, CreateActivityInput, UpdateActivityInput } from "@shared/types/crm";

export default function ActivityFeed() {
  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const { confirm, alert } = useModal();

  const filters = useMemo(() => {
    const f: Record<string, string> = {};
    if (typeFilter) f.type = typeFilter;
    return Object.keys(f).length ? f : undefined;
  }, [typeFilter]);

  const { activities, loading, error, create, update, toggleComplete, remove } = useActivities(filters);

  const handleDelete = async (id: string) => {
    const yes = await confirm({ message: "Delete this activity?", variant: "destructive", confirmLabel: "Delete" });
    if (!yes) return;
    try {
      await remove(id);
    } catch (err: any) {
      await alert({ message: err.message, variant: "error" });
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-6 py-4 border-b border-surface-200 bg-white flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-surface-800">Activities</h2>
          <span className="text-sm text-surface-400">{activities.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 bg-white"
          >
            <option value="">All types</option>
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <button onClick={() => { setEditActivity(null); setShowForm(true); }} className="px-3 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors">
            + Activity
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 px-4 py-2 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-surface-400">Loading activities...</div>
        </div>
      ) : activities.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-surface-500 text-sm">No activities found</p>
            <button onClick={() => setShowForm(true)} className="mt-2 text-sm text-brand-600 hover:text-brand-700">Create your first activity</button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="max-w-3xl mx-auto space-y-1">
            {activities.map((a, idx) => (
              <div key={a.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <ActivityTypeIcon type={a.type} completed={a.completed} />
                  {idx < activities.length - 1 && <div className="w-px flex-1 bg-surface-200 my-1" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="bg-white rounded-lg border border-surface-200 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${a.completed ? "text-surface-400 line-through" : "text-surface-800"}`}>{a.title}</p>
                          <span className="px-2 py-0.5 bg-surface-100 text-surface-500 rounded-full text-xs">{a.type}</span>
                        </div>
                        {a.description && <p className="text-sm text-surface-500 mt-1">{a.description}</p>}
                        <div className="flex items-center gap-3 mt-2 text-xs text-surface-400">
                          {a.contact_name && <span>Contact: {a.contact_name}</span>}
                          {a.deal_title && <span>Deal: {a.deal_title}</span>}
                          {a.company_name && <span>Company: {a.company_name}</span>}
                          {a.due_date && <span>Due: {new Date(a.due_date).toLocaleDateString()}</span>}
                        </div>
                        <p className="text-xs text-surface-300 mt-1">{new Date(a.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleComplete(a)}
                          title={a.completed ? "Mark incomplete" : "Mark complete"}
                          className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${a.completed ? "text-green-600 hover:bg-green-50" : "text-surface-400 hover:bg-surface-100"}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => { setEditActivity(a); setShowForm(true); }}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-surface-400 hover:bg-surface-100 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-surface-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <ActivityForm
          activity={editActivity || undefined}
          onSave={async (input) => {
            if (editActivity) {
              await update(editActivity.id, input as UpdateActivityInput);
            } else {
              await create(input as CreateActivityInput);
            }
            setShowForm(false);
            setEditActivity(null);
          }}
          onClose={() => { setShowForm(false); setEditActivity(null); }}
        />
      )}
    </div>
  );
}

function ActivityTypeIcon({ type, completed }: { type: string; completed: boolean }) {
  const base = "w-9 h-9 rounded-full flex items-center justify-center shrink-0";

  if (completed) {
    return (
      <div className={`${base} bg-green-100`}>
        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  switch (type) {
    case "call":
      return (
        <div className={`${base} bg-green-100`}>
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
      );
    case "email":
      return (
        <div className={`${base} bg-blue-100`}>
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      );
    case "meeting":
      return (
        <div className={`${base} bg-purple-100`}>
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      );
    case "task":
      return (
        <div className={`${base} bg-amber-100`}>
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
      );
    default:
      return (
        <div className={`${base} bg-surface-100`}>
          <svg className="w-4 h-4 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
      );
  }
}

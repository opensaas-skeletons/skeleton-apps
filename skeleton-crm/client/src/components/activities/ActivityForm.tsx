import { useState, useEffect } from "react";
import type { Activity, CreateActivityInput, UpdateActivityInput } from "@shared/types/crm";
import { ACTIVITY_TYPES } from "@shared/constants";
import { useContacts } from "../../hooks/useContacts";
import { useCompanies } from "../../hooks/useCompanies";
import { useDeals } from "../../hooks/useDeals";

interface ActivityFormProps {
  activity?: Activity;
  onSave: (input: CreateActivityInput | UpdateActivityInput) => Promise<void>;
  onClose: () => void;
}

export default function ActivityForm({ activity, onSave, onClose }: ActivityFormProps) {
  const [type, setType] = useState(activity?.type || "note");
  const [title, setTitle] = useState(activity?.title || "");
  const [description, setDescription] = useState(activity?.description || "");
  const [contactId, setContactId] = useState(activity?.contact_id || "");
  const [dealId, setDealId] = useState(activity?.deal_id || "");
  const [companyId, setCompanyId] = useState(activity?.company_id || "");
  const [dueDate, setDueDate] = useState(activity?.due_date?.split("T")[0] || "");
  const [completed, setCompleted] = useState(activity?.completed || false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { contacts } = useContacts();
  const { companies } = useCompanies();
  const { deals } = useDeals();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (activity) {
        const input: UpdateActivityInput = {
          type,
          title: title.trim(),
          description: description.trim() || undefined,
          contact_id: contactId || null,
          deal_id: dealId || null,
          company_id: companyId || null,
          due_date: dueDate || null,
          completed,
        };
        await onSave(input);
      } else {
        const input: CreateActivityInput = {
          type,
          title: title.trim(),
          description: description.trim() || undefined,
          contact_id: contactId || undefined,
          deal_id: dealId || undefined,
          company_id: companyId || undefined,
          due_date: dueDate || undefined,
        };
        await onSave(input);
      }
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-surface-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-surface-800">{activity ? "Edit Activity" : "New Activity"}</h3>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && <div className="mx-6 mt-4 px-4 py-2 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>}

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 bg-white">
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Due date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 resize-none" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Contact</label>
              <select value={contactId} onChange={(e) => setContactId(e.target.value)} className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 bg-white">
                <option value="">None</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Deal</label>
              <select value={dealId} onChange={(e) => setDealId(e.target.value)} className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 bg-white">
                <option value="">None</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Company</label>
              <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 bg-white">
                <option value="">None</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {activity && (
            <div className="flex items-center gap-2">
              <input type="checkbox" id="completed" checked={completed} onChange={(e) => setCompleted(e.target.checked)} className="w-4 h-4 text-brand-600 border-surface-300 rounded focus:ring-brand-300" />
              <label htmlFor="completed" className="text-sm text-surface-700">Mark as completed</label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-md transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors disabled:opacity-50">
              {saving ? "Saving..." : activity ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

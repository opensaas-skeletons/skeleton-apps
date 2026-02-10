import { useState, useEffect } from "react";
import type { Contact, CreateContactInput, UpdateContactInput } from "@shared/types/crm";
import { CONTACT_SOURCES } from "@shared/constants";
import { useCompanies } from "../../hooks/useCompanies";

interface ContactFormProps {
  contact?: Contact;
  onSave: (input: CreateContactInput | UpdateContactInput) => Promise<void>;
  onClose: () => void;
}

export default function ContactForm({ contact, onSave, onClose }: ContactFormProps) {
  const [firstName, setFirstName] = useState(contact?.first_name || "");
  const [lastName, setLastName] = useState(contact?.last_name || "");
  const [email, setEmail] = useState(contact?.email || "");
  const [phone, setPhone] = useState(contact?.phone || "");
  const [companyId, setCompanyId] = useState(contact?.company_id || "");
  const [title, setTitle] = useState(contact?.title || "");
  const [source, setSource] = useState(contact?.source || "manual");
  const [notes, setNotes] = useState(contact?.notes || "");
  const [tags, setTags] = useState(contact?.tags?.join(", ") || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { companies } = useCompanies();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input: CreateContactInput = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        company_id: companyId || undefined,
        title: title.trim() || undefined,
        source,
        notes: notes.trim() || undefined,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      };
      await onSave(input);
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
          <h3 className="text-lg font-semibold text-surface-800">{contact ? "Edit Contact" : "New Contact"}</h3>
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
              <label className="block text-sm font-medium text-surface-700 mb-1">First name *</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Last name *</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Phone</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Company</label>
              <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 bg-white">
                <option value="">None</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. VP of Sales" className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Source</label>
            <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 bg-white">
              {CONTACT_SOURCES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Tags</label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Comma-separated tags" className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 resize-none" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-md transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors disabled:opacity-50">
              {saving ? "Saving..." : contact ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

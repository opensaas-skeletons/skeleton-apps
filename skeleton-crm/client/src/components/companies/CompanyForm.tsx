import { useState, useEffect } from "react";
import type { Company, CreateCompanyInput, UpdateCompanyInput } from "@shared/types/crm";
import { COMPANY_SIZES } from "@shared/constants";

interface CompanyFormProps {
  company?: Company;
  onSave: (input: CreateCompanyInput | UpdateCompanyInput) => Promise<void>;
  onClose: () => void;
}

export default function CompanyForm({ company, onSave, onClose }: CompanyFormProps) {
  const [name, setName] = useState(company?.name || "");
  const [domain, setDomain] = useState(company?.domain || "");
  const [industry, setIndustry] = useState(company?.industry || "");
  const [size, setSize] = useState(company?.size || "");
  const [address, setAddress] = useState(company?.address || "");
  const [notes, setNotes] = useState(company?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Company name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input: CreateCompanyInput = {
        name: name.trim(),
        domain: domain.trim() || undefined,
        industry: industry.trim() || undefined,
        size: size || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
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
          <h3 className="text-lg font-semibold text-surface-800">{company ? "Edit Company" : "New Company"}</h3>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && <div className="mx-6 mt-4 px-4 py-2 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>}

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Domain</label>
              <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Industry</label>
              <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Technology" className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Size</label>
            <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 bg-white">
              <option value="">Select size</option>
              {COMPANY_SIZES.map((s) => (
                <option key={s} value={s}>{s} employees</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Address</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400" />
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
              {saving ? "Saving..." : company ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

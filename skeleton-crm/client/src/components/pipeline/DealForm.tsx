import { useState, useEffect } from "react";
import type { Deal, Contact, Company, CreateDealInput, UpdateDealInput } from "@shared/types/crm";
import { CURRENCIES } from "@shared/constants";
import * as api from "../../api/client";

interface DealFormProps {
  deal?: Deal | null;
  stageId: string;
  pipelineId: string;
  onSave: (input: CreateDealInput | UpdateDealInput) => void;
  onClose: () => void;
}

export default function DealForm({ deal, stageId, pipelineId, onSave, onClose }: DealFormProps) {
  const [title, setTitle] = useState(deal?.title || "");
  const [value, setValue] = useState(deal?.value?.toString() || "0");
  const [currency, setCurrency] = useState(deal?.currency || "USD");
  const [contactId, setContactId] = useState(deal?.contact_id || "");
  const [companyId, setCompanyId] = useState(deal?.company_id || "");
  const [expectedCloseDate, setExpectedCloseDate] = useState(deal?.expected_close_date || "");
  const [notes, setNotes] = useState(deal?.notes || "");
  const [lostReason, setLostReason] = useState(deal?.lost_reason || "");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    api.listContacts().then(setContacts).catch(() => {});
    api.listCompanies().then(setCompanies).catch(() => {});
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (deal) {
      const input: UpdateDealInput = {
        title: title.trim(),
        value: parseFloat(value) || 0,
        currency,
        contact_id: contactId || null,
        company_id: companyId || null,
        expected_close_date: expectedCloseDate || null,
        notes,
        lost_reason: lostReason || null,
      };
      onSave(input);
    } else {
      const input: CreateDealInput = {
        title: title.trim(),
        value: parseFloat(value) || 0,
        currency,
        stage_id: stageId,
        pipeline_id: pipelineId,
        contact_id: contactId || undefined,
        company_id: companyId || undefined,
        expected_close_date: expectedCloseDate || undefined,
        notes,
      };
      onSave(input);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-5 pt-5 pb-2">
          <h2 className="text-base font-semibold text-surface-800">
            {deal ? "Edit Deal" : "New Deal"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Value</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1">Contact</label>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
            >
              <option value="">No contact</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1">Company</label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
            >
              <option value="">No company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1">Expected Close Date</label>
            <input
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 resize-none"
            />
          </div>
          {deal?.status === "lost" && (
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Lost Reason</label>
              <textarea
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 resize-none"
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-md transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors">
              {deal ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import type { Company, Contact, Deal, Activity } from "@shared/types/crm";
import * as api from "../../api/client";
import { useModal } from "../../contexts/ModalContext";
import CompanyForm from "./CompanyForm";

interface CompanyDetailProps {
  companyId: string;
  onBack: () => void;
}

export default function CompanyDetail({ companyId, onBack }: CompanyDetailProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"contacts" | "deals" | "activities">("contacts");
  const [editing, setEditing] = useState(false);
  const { confirm, alert } = useModal();

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [c, ct, d, a] = await Promise.all([
        api.getCompany(companyId),
        api.listContacts({ company_id: companyId }),
        api.listDeals({ company_id: companyId }),
        api.listActivities({ company_id: companyId }),
      ]);
      setCompany(c);
      setContacts(ct);
      setDeals(d);
      setActivities(a);
    } catch (err: any) {
      await alert({ message: err.message, variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [companyId, alert]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleDelete = async () => {
    const yes = await confirm({ message: "Delete this company? This cannot be undone.", variant: "destructive", confirmLabel: "Delete" });
    if (!yes) return;
    try {
      await api.deleteCompany(companyId);
      onBack();
    } catch (err: any) {
      await alert({ message: err.message, variant: "error" });
    }
  };

  if (loading || !company) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-sm text-surface-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <div className="px-6 py-4 border-b border-surface-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-surface-400 hover:text-surface-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-10 h-10 rounded-md bg-surface-100 text-surface-600 flex items-center justify-center text-sm font-medium">
            {company.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-800">{company.name}</h2>
            {company.industry && <p className="text-sm text-surface-500">{company.industry}{company.size ? ` - ${company.size} employees` : ""}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(true)} className="px-3 py-1.5 text-sm text-surface-600 hover:bg-surface-100 rounded-md transition-colors border border-surface-300">
            Edit
          </button>
          <button onClick={handleDelete} className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors border border-red-200">
            Delete
          </button>
        </div>
      </div>

      <div className="px-6 py-6 grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-4">
          <div className="bg-white rounded-lg border border-surface-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-surface-700">Details</h3>
            <InfoRow label="Domain" value={company.domain} />
            <InfoRow label="Industry" value={company.industry} />
            <InfoRow label="Size" value={company.size ? `${company.size} employees` : null} />
            <InfoRow label="Address" value={company.address || null} />
            <InfoRow label="Created" value={new Date(company.created_at).toLocaleDateString()} />
            {company.notes && (
              <div>
                <p className="text-xs text-surface-400 mb-1">Notes</p>
                <p className="text-sm text-surface-600 whitespace-pre-wrap">{company.notes}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-surface-200 p-4">
            <h3 className="text-sm font-semibold text-surface-700 mb-2">Summary</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-surface-800">{contacts.length}</p>
                <p className="text-xs text-surface-400">Contacts</p>
              </div>
              <div>
                <p className="text-lg font-bold text-surface-800">{deals.length}</p>
                <p className="text-xs text-surface-400">Deals</p>
              </div>
              <div>
                <p className="text-lg font-bold text-surface-800">{activities.length}</p>
                <p className="text-xs text-surface-400">Activities</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-2">
          <div className="flex gap-1 mb-4">
            <button onClick={() => setTab("contacts")} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === "contacts" ? "bg-brand-50 text-brand-700" : "text-surface-500 hover:bg-surface-100"}`}>
              Contacts ({contacts.length})
            </button>
            <button onClick={() => setTab("deals")} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === "deals" ? "bg-brand-50 text-brand-700" : "text-surface-500 hover:bg-surface-100"}`}>
              Deals ({deals.length})
            </button>
            <button onClick={() => setTab("activities")} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === "activities" ? "bg-brand-50 text-brand-700" : "text-surface-500 hover:bg-surface-100"}`}>
              Activities ({activities.length})
            </button>
          </div>

          {tab === "contacts" && (
            <div className="space-y-2">
              {contacts.length === 0 ? (
                <p className="text-sm text-surface-400 py-4 text-center">No contacts linked</p>
              ) : (
                contacts.map((c) => (
                  <div key={c.id} className="bg-white rounded-lg border border-surface-200 px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-medium shrink-0">
                      {c.first_name[0]}{c.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-800">{c.first_name} {c.last_name}</p>
                      <p className="text-xs text-surface-400">{c.title || c.email || "-"}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "deals" && (
            <div className="space-y-2">
              {deals.length === 0 ? (
                <p className="text-sm text-surface-400 py-4 text-center">No deals</p>
              ) : (
                deals.map((d) => (
                  <div key={d.id} className="bg-white rounded-lg border border-surface-200 px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-surface-800">{d.title}</p>
                      <p className="text-xs text-surface-400 mt-0.5">{d.stage_title}{d.contact_name ? ` - ${d.contact_name}` : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-surface-800">${d.value.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === "won" ? "bg-green-50 text-green-700" : d.status === "lost" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
                        {d.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "activities" && (
            <div className="space-y-2">
              {activities.length === 0 ? (
                <p className="text-sm text-surface-400 py-4 text-center">No activities</p>
              ) : (
                activities.map((a) => (
                  <div key={a.id} className="bg-white rounded-lg border border-surface-200 px-4 py-3 flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${a.type === "call" ? "bg-green-100" : a.type === "email" ? "bg-blue-100" : a.type === "meeting" ? "bg-purple-100" : "bg-surface-100"}`}>
                      <svg className={`w-4 h-4 ${a.type === "call" ? "text-green-600" : a.type === "email" ? "text-blue-600" : a.type === "meeting" ? "text-purple-600" : "text-surface-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-800">{a.title}</p>
                      {a.description && <p className="text-sm text-surface-500 mt-0.5 truncate">{a.description}</p>}
                      <p className="text-xs text-surface-400 mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                    {a.completed && (
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs shrink-0">Done</span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <CompanyForm
          company={company}
          onSave={async (input) => { await api.updateCompany(companyId, input); await refresh(); setEditing(false); }}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-surface-400">{label}</p>
      <p className="text-sm text-surface-700">{value || "-"}</p>
    </div>
  );
}

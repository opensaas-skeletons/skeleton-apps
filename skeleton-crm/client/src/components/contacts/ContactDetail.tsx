import { useState, useEffect, useCallback } from "react";
import type { Contact, Activity, Deal } from "@shared/types/crm";
import * as api from "../../api/client";
import { useModal } from "../../contexts/ModalContext";
import ContactForm from "./ContactForm";

interface ContactDetailProps {
  contactId: string;
  onBack: () => void;
}

export default function ContactDetail({ contactId, onBack }: ContactDetailProps) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"activities" | "deals">("activities");
  const [editing, setEditing] = useState(false);
  const { confirm, alert } = useModal();

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [c, a, d] = await Promise.all([
        api.getContact(contactId),
        api.listActivities({ contact_id: contactId }),
        api.listDeals({ contact_id: contactId }),
      ]);
      setContact(c);
      setActivities(a);
      setDeals(d);
    } catch (err: any) {
      await alert({ message: err.message, variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [contactId, alert]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleDelete = async () => {
    const yes = await confirm({ message: "Delete this contact? This cannot be undone.", variant: "destructive", confirmLabel: "Delete" });
    if (!yes) return;
    try {
      await api.deleteContact(contactId);
      onBack();
    } catch (err: any) {
      await alert({ message: err.message, variant: "error" });
    }
  };

  if (loading || !contact) {
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
          <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-medium">
            {contact.first_name[0]}{contact.last_name[0]}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-800">{contact.first_name} {contact.last_name}</h2>
            {contact.title && <p className="text-sm text-surface-500">{contact.title}{contact.company_name ? ` at ${contact.company_name}` : ""}</p>}
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
            <InfoRow label="Email" value={contact.email} />
            <InfoRow label="Phone" value={contact.phone} />
            <InfoRow label="Company" value={contact.company_name} />
            <InfoRow label="Source" value={contact.source} />
            <InfoRow label="Created" value={new Date(contact.created_at).toLocaleDateString()} />
            {contact.tags.length > 0 && (
              <div>
                <p className="text-xs text-surface-400 mb-1">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {contact.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full text-xs">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {contact.notes && (
              <div>
                <p className="text-xs text-surface-400 mb-1">Notes</p>
                <p className="text-sm text-surface-600 whitespace-pre-wrap">{contact.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-2">
          <div className="flex gap-1 mb-4">
            <button onClick={() => setTab("activities")} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === "activities" ? "bg-brand-50 text-brand-700" : "text-surface-500 hover:bg-surface-100"}`}>
              Activities ({activities.length})
            </button>
            <button onClick={() => setTab("deals")} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === "deals" ? "bg-brand-50 text-brand-700" : "text-surface-500 hover:bg-surface-100"}`}>
              Deals ({deals.length})
            </button>
          </div>

          {tab === "activities" && (
            <div className="space-y-2">
              {activities.length === 0 ? (
                <p className="text-sm text-surface-400 py-4 text-center">No activities yet</p>
              ) : (
                activities.map((a) => (
                  <div key={a.id} className="bg-white rounded-lg border border-surface-200 px-4 py-3 flex items-start gap-3">
                    <ActivityTypeIcon type={a.type} />
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

          {tab === "deals" && (
            <div className="space-y-2">
              {deals.length === 0 ? (
                <p className="text-sm text-surface-400 py-4 text-center">No deals yet</p>
              ) : (
                deals.map((d) => (
                  <div key={d.id} className="bg-white rounded-lg border border-surface-200 px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-surface-800">{d.title}</p>
                      <p className="text-xs text-surface-400 mt-0.5">{d.stage_title}{d.company_name ? ` - ${d.company_name}` : ""}</p>
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
        </div>
      </div>

      {editing && (
        <ContactForm
          contact={contact}
          onSave={async (input) => { await api.updateContact(contactId, input); await refresh(); setEditing(false); }}
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

function ActivityTypeIcon({ type }: { type: string }) {
  const base = "w-8 h-8 rounded-full flex items-center justify-center shrink-0";
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

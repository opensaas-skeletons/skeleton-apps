import { useRef } from "react";
import { useModal } from "../contexts/ModalContext";
import * as api from "../api/client";

type View = "contacts" | "companies" | "pipeline" | "activities" | "dashboard";

const NAV_ITEMS: { view: View; label: string; icon: JSX.Element }[] = [
  {
    view: "pipeline",
    label: "Pipeline",
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>,
  },
  {
    view: "contacts",
    label: "Contacts",
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  },
  {
    view: "companies",
    label: "Companies",
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  },
  {
    view: "activities",
    label: "Activities",
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    view: "dashboard",
    label: "Dashboard",
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  },
];

interface HeaderProps {
  activeView: View;
  onNavigate: (view: View) => void;
}

export default function Header({ activeView, onNavigate }: HeaderProps) {
  const { alert } = useModal();
  const importRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skeleton-crm-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      await alert({ message: err.message, variant: "error" });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const result = await api.importData(payload);
      await alert({ message: `Import complete: ${result.imported_companies} companies, ${result.imported_contacts} contacts, ${result.imported_pipelines} pipelines, ${result.imported_deals} deals, ${result.imported_activities} activities`, variant: "success" });
      window.location.reload();
    } catch (err: any) {
      await alert({ message: err.message, variant: "error" });
    }
    if (importRef.current) importRef.current.value = "";
  };

  return (
    <header className="bg-white border-b border-surface-200 px-5 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <h1 className="text-lg font-bold text-surface-800 tracking-tight">Skeleton CRM</h1>
        <nav className="flex gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeView === item.view
                  ? "bg-brand-50 text-brand-700"
                  : "text-surface-500 hover:text-surface-700 hover:bg-surface-100"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleExport} className="px-3 py-1.5 text-sm text-surface-600 hover:bg-surface-100 rounded-md transition-colors">
          Export
        </button>
        <button onClick={() => importRef.current?.click()} className="px-3 py-1.5 text-sm text-surface-600 hover:bg-surface-100 rounded-md transition-colors">
          Import
        </button>
        <input ref={importRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
      </div>
    </header>
  );
}

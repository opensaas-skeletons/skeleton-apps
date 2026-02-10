import { useState } from "react";
import Header from "./Header";
import ContactList from "./contacts/ContactList";
import ContactDetail from "./contacts/ContactDetail";
import CompanyList from "./companies/CompanyList";
import CompanyDetail from "./companies/CompanyDetail";
import PipelineBoard from "./pipeline/PipelineBoard";
import ActivityFeed from "./activities/ActivityFeed";
import Dashboard from "./dashboard/Dashboard";

type View = "contacts" | "companies" | "pipeline" | "activities" | "dashboard";

export default function App() {
  const [view, setView] = useState<View>("pipeline");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const handleNavigate = (v: View) => {
    setView(v);
    setSelectedContactId(null);
    setSelectedCompanyId(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header activeView={view} onNavigate={handleNavigate} />
      <main className="flex-1 flex flex-col">
        {view === "contacts" && !selectedContactId && (
          <ContactList onSelectContact={setSelectedContactId} />
        )}
        {view === "contacts" && selectedContactId && (
          <ContactDetail contactId={selectedContactId} onBack={() => setSelectedContactId(null)} />
        )}
        {view === "companies" && !selectedCompanyId && (
          <CompanyList onSelectCompany={setSelectedCompanyId} />
        )}
        {view === "companies" && selectedCompanyId && (
          <CompanyDetail companyId={selectedCompanyId} onBack={() => setSelectedCompanyId(null)} />
        )}
        {view === "pipeline" && <PipelineBoard />}
        {view === "activities" && <ActivityFeed />}
        {view === "dashboard" && <Dashboard />}
      </main>
    </div>
  );
}

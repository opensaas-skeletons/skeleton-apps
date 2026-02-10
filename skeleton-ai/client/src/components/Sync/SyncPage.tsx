import { useState } from "react";
import type { SyncRepo, SyncHistory, SyncSchedule, CreateSyncRepoInput, UpdateSyncRepoInput } from "@shared/types/ai";
import RepoList from "./RepoList";
import RepoForm from "./RepoForm";
import SyncHistoryList from "./SyncHistory";
import ScheduleConfig from "./ScheduleConfig";

type Tab = "repos" | "history" | "schedule";

interface SyncPageProps {
  repos: SyncRepo[];
  history: SyncHistory[];
  schedule: SyncSchedule | null;
  loading: boolean;
  onCreateRepo: (input: CreateSyncRepoInput) => Promise<SyncRepo>;
  onUpdateRepo: (id: string, input: UpdateSyncRepoInput) => Promise<SyncRepo>;
  onDeleteRepo: (id: string) => Promise<void>;
  onTriggerSync: (repoId: string) => Promise<void>;
  onTriggerSyncAll: () => Promise<void>;
  onUpdateSchedule: (updates: Partial<SyncSchedule>) => Promise<SyncSchedule>;
  onBack: () => void;
}

export default function SyncPage({
  repos,
  history,
  schedule,
  loading,
  onCreateRepo,
  onUpdateRepo,
  onDeleteRepo,
  onTriggerSync,
  onTriggerSyncAll,
  onUpdateSchedule,
  onBack,
}: SyncPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("repos");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRepo, setEditingRepo] = useState<SyncRepo | null>(null);

  const tabs: { id: Tab; label: string }[] = [
    { id: "repos", label: "Repositories" },
    { id: "history", label: "Sync History" },
    { id: "schedule", label: "Schedule" },
  ];

  const handleCreateRepo = async (input: CreateSyncRepoInput) => {
    await onCreateRepo(input);
    setShowAddForm(false);
  };

  const handleUpdateRepo = async (input: CreateSyncRepoInput) => {
    if (editingRepo) {
      await onUpdateRepo(editingRepo.id, input);
      setEditingRepo(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-surface-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold text-surface-900">GitHub Sync</h1>
            <p className="text-xs text-surface-500">Manage repository syncing and auto-ingestion</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "repos" && (
            <>
              <button
                onClick={onTriggerSyncAll}
                className="px-3 py-1.5 text-xs font-medium text-surface-600 hover:text-surface-800 bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors"
              >
                Sync All
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Repo
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-3 border-b border-surface-200">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? "text-brand-600 bg-brand-50 border-b-2 border-brand-600"
                  : "text-surface-500 hover:text-surface-700 hover:bg-surface-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === "repos" && (
              <RepoList
                repos={repos}
                onSync={onTriggerSync}
                onEdit={setEditingRepo}
                onDelete={onDeleteRepo}
              />
            )}
            {activeTab === "history" && (
              <SyncHistoryList history={history} repos={repos} />
            )}
            {activeTab === "schedule" && schedule && (
              <ScheduleConfig schedule={schedule} onUpdate={onUpdateSchedule} />
            )}
          </>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingRepo) && (
        <RepoForm
          repo={editingRepo}
          onSubmit={editingRepo ? handleUpdateRepo : handleCreateRepo}
          onClose={() => {
            setShowAddForm(false);
            setEditingRepo(null);
          }}
        />
      )}
    </div>
  );
}

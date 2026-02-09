import { useState } from "react";
import type { Workflow, CreateWorkflowInput } from "@shared/types/workflow";
import { useWorkflows } from "../hooks/useWorkflows";
import { useNotifications } from "../hooks/useNotifications";
import { useModal } from "../contexts/ModalContext";
import Header from "./Header";
import WorkflowList from "./WorkflowList";
import WorkflowEditor from "./WorkflowEditor";
import RunHistory from "./RunHistory";
import NotificationToast from "./NotificationToast";

type View = "list" | "create" | "edit" | "runs";

export default function App() {
  const {
    workflows,
    loading,
    error,
    refresh,
    addWorkflow,
    editWorkflow,
    removeWorkflow,
    trigger,
    toggleEnabled,
  } = useWorkflows();

  const { notifications, unreadCount, toast, dismissToast, markAsRead, markAllAsRead } =
    useNotifications();

  const modal = useModal();

  const [view, setView] = useState<View>("list");
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
    null
  );

  const handleSelect = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setView("edit");
  };

  const handleCreateNew = () => {
    setSelectedWorkflow(null);
    setView("create");
  };

  const handleSave = async (input: CreateWorkflowInput) => {
    if (selectedWorkflow) {
      await editWorkflow(selectedWorkflow.id, input);
    } else {
      await addWorkflow(input);
    }
    setView("list");
    setSelectedWorkflow(null);
  };

  const handleCancel = () => {
    setView("list");
    setSelectedWorkflow(null);
  };

  const handleTrigger = async (id: string) => {
    try {
      await trigger(id);
      // Show runs after triggering
      const workflow = workflows.find((w) => w.id === id);
      if (workflow) {
        setSelectedWorkflow(workflow);
        setView("runs");
      }
    } catch (err: any) {
      await modal.alert({ message: "Trigger failed: " + err.message, variant: "error" });
    }
  };

  const handleViewRuns = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setView("runs");
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <Header
        onRefresh={refresh}
        onCreateNew={handleCreateNew}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {view === "list" && (
          <>
            {loading ? (
              <div className="text-center py-16">
                <p className="text-surface-400">Loading workflows...</p>
              </div>
            ) : (
              <WorkflowList
                workflows={workflows}
                onSelect={handleSelect}
                onToggle={toggleEnabled}
                onTrigger={handleTrigger}
                onDelete={removeWorkflow}
                onViewRuns={handleViewRuns}
              />
            )}
          </>
        )}

        {(view === "create" || view === "edit") && (
          <WorkflowEditor
            workflow={view === "edit" ? selectedWorkflow : null}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}

        {view === "runs" && selectedWorkflow && (
          <RunHistory
            workflowId={selectedWorkflow.id}
            onClose={handleCancel}
          />
        )}
      </main>

      {/* Notification Toast */}
      {toast && <NotificationToast notification={toast} onDismiss={dismissToast} />}
    </div>
  );
}

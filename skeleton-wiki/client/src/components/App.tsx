import { useState, useCallback } from "react";
import { useWorkspaces } from "../hooks/useWorkspaces";
import { usePages, usePage, useBacklinks } from "../hooks/usePages";
import { getPageBySlug } from "../api/client";
import Header from "./Header";
import Sidebar from "./sidebar/Sidebar";
import PageView from "./page/PageView";
import WorkspaceList from "./WorkspaceList";

export default function App() {
  const { workspaces, loading: wsLoading, create: createWs, remove: removeWs } = useWorkspaces();
  const [selectedWsId, setSelectedWsId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const { tree, loading: pagesLoading, create: createPage, update: updatePage, remove: removePage, refresh: refreshPages } = usePages(selectedWsId);
  const { page, loading: pageLoading, refresh: refreshPage } = usePage(selectedPageId);
  const backlinks = useBacklinks(selectedPageId);

  const selectedWs = workspaces.find((w) => w.id === selectedWsId) || null;

  const handleSelectWorkspace = useCallback((id: string) => {
    setSelectedWsId(id);
    setSelectedPageId(null);
    setEditing(false);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedWsId(null);
    setSelectedPageId(null);
    setEditing(false);
  }, []);

  const handleSelectPage = useCallback((id: string) => {
    setSelectedPageId(id);
    setEditing(false);
  }, []);

  const handleCreatePage = useCallback(async (parentId?: string | null) => {
    const p = await createPage("Untitled Page", parentId);
    if (p) {
      setSelectedPageId(p.id);
      setEditing(true);
    }
  }, [createPage]);

  const handleSavePage = useCallback(async (id: string, title: string, content: string) => {
    await updatePage(id, { title, content });
    await refreshPage();
    setEditing(false);
  }, [updatePage, refreshPage]);

  const handleDeletePage = useCallback(async (id: string) => {
    await removePage(id);
    if (selectedPageId === id) {
      setSelectedPageId(null);
    }
  }, [removePage, selectedPageId]);

  const handleNavigateToSlug = useCallback(async (slug: string) => {
    if (!selectedWsId) return;
    try {
      const p = await getPageBySlug(selectedWsId, slug);
      setSelectedPageId(p.id);
      setEditing(false);
    } catch {
      // Page not found — ignore
    }
  }, [selectedWsId]);

  // Workspace list view
  if (!selectedWsId) {
    return (
      <div className="min-h-screen bg-surface-50">
        <Header workspace={null} onBack={handleBack} />
        <WorkspaceList
          workspaces={workspaces}
          loading={wsLoading}
          onSelect={handleSelectWorkspace}
          onCreate={createWs}
          onDelete={removeWs}
        />
      </div>
    );
  }

  // Wiki view with sidebar
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <Header workspace={selectedWs} onBack={handleBack} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          workspaceId={selectedWsId}
          tree={tree}
          loading={pagesLoading}
          selectedPageId={selectedPageId}
          onSelectPage={handleSelectPage}
          onCreatePage={handleCreatePage}
          onDeletePage={handleDeletePage}
          onNavigateToSlug={handleNavigateToSlug}
        />
        <main className="flex-1 overflow-y-auto">
          {selectedPageId && page ? (
            <PageView
              page={page}
              loading={pageLoading}
              editing={editing}
              backlinks={backlinks}
              onEdit={() => setEditing(true)}
              onSave={handleSavePage}
              onCancel={() => setEditing(false)}
              onNavigateToSlug={handleNavigateToSlug}
              onNavigateToPage={handleSelectPage}
              onRefresh={refreshPage}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-surface-400">
              <div className="text-center">
                <div className="text-4xl mb-3">📖</div>
                <p className="text-lg font-medium">Select a page to start reading</p>
                <p className="text-sm mt-1">Or create a new page from the sidebar</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

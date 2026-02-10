import { useState, useCallback, useEffect } from "react";
import AppLayout from "./components/Layout/AppLayout";
import Sidebar from "./components/Layout/Sidebar";
import ChatPanel from "./components/Chat/ChatPanel";
import SourceList from "./components/Sources/SourceList";
import SourceDetail from "./components/Sources/SourceDetail";
import SettingsPanel from "./components/Settings/SettingsPanel";
import SyncPage from "./components/Sync/SyncPage";
import { useConversations } from "./hooks/useConversations";
import { useChat } from "./hooks/useChat";
import { useSources } from "./hooks/useSources";
import { useSettings } from "./hooks/useSettings";
import { useSync } from "./hooks/useSync";

type View = "chat" | "sources" | "settings" | "sync";

export default function App() {
  const [currentView, setCurrentView] = useState<View>("chat");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  const conversations = useConversations();
  const chat = useChat();
  const sources = useSources();
  const settings = useSettings();
  const sync = useSync();

  const selectedConversation = conversations.conversations.find(
    (c) => c.id === conversations.selectedId
  );

  // Load messages when conversation changes
  useEffect(() => {
    if (conversations.selectedId) {
      chat.loadMessages(conversations.selectedId);
    }
  }, [conversations.selectedId]);

  const handleNewChat = useCallback(async () => {
    await conversations.create();
    setCurrentView("chat");
  }, [conversations]);

  const handleSendMessage = useCallback(
    async (content: string, sourceIds?: string[]) => {
      let conversationId = conversations.selectedId;
      if (!conversationId) {
        const conv = await conversations.create(content.slice(0, 50));
        conversationId = conv.id;
      }
      chat.sendMessage(conversationId, content, sourceIds);
    },
    [conversations, chat]
  );

  const handleRenameConversation = useCallback(
    (id: string, title: string) => {
      conversations.rename(id, title);
    },
    [conversations]
  );

  const handleRenameCurrentConversation = useCallback(
    (title: string) => {
      if (conversations.selectedId) {
        conversations.rename(conversations.selectedId, title);
      }
    },
    [conversations]
  );

  const sidebar = (
    <Sidebar
      conversations={conversations.conversations}
      selectedConversationId={conversations.selectedId}
      sources={sources.sources}
      onSelectConversation={(id) => {
        conversations.select(id);
        setCurrentView("chat");
      }}
      onNewChat={handleNewChat}
      onRenameConversation={handleRenameConversation}
      onDeleteConversation={conversations.remove}
      onViewSources={() => {
        setCurrentView("sources");
        setSelectedSourceId(null);
      }}
      onViewSync={() => setCurrentView("sync")}
      onViewSettings={() => setCurrentView("settings")}
      onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
    />
  );

  const renderMainContent = () => {
    if (currentView === "settings") {
      return (
        <SettingsPanel
          settings={settings.settings}
          providers={settings.providers}
          loading={settings.loading}
          onUpdate={settings.update}
          onBack={() => setCurrentView("chat")}
        />
      );
    }

    if (currentView === "sync") {
      return (
        <SyncPage
          repos={sync.repos}
          history={sync.history}
          schedule={sync.schedule}
          loading={sync.loading}
          onCreateRepo={sync.createRepo}
          onUpdateRepo={sync.updateRepo}
          onDeleteRepo={sync.removeRepo}
          onTriggerSync={sync.triggerSync}
          onTriggerSyncAll={sync.triggerSyncAll}
          onUpdateSchedule={sync.updateSchedule}
          onBack={() => setCurrentView("chat")}
        />
      );
    }

    if (currentView === "sources") {
      if (selectedSourceId) {
        const source = sources.sources.find((s) => s.id === selectedSourceId);
        if (source) {
          return (
            <SourceDetail
              sourceId={selectedSourceId}
              source={source}
              onBack={() => setSelectedSourceId(null)}
              onIngest={sources.triggerIngest}
            />
          );
        }
      }
      return (
        <SourceList
          sources={sources.sources}
          loading={sources.loading}
          onSelectSource={setSelectedSourceId}
          onCreate={sources.create}
          onDelete={sources.remove}
          onIngest={sources.triggerIngest}
        />
      );
    }

    // Chat view
    return (
      <>
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="absolute top-3 left-3 z-10 p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-lg transition-colors"
            title="Expand sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}
        <ChatPanel
          conversationId={conversations.selectedId}
          conversationTitle={selectedConversation?.title || ""}
          messages={chat.messages}
          isStreaming={chat.isStreaming}
          streamingContent={chat.streamingContent}
          sources={sources.sources}
          onSendMessage={handleSendMessage}
          onStopGeneration={chat.stopGeneration}
          onRenameConversation={handleRenameCurrentConversation}
          onViewSettings={() => setCurrentView("settings")}
        />
      </>
    );
  };

  return (
    <AppLayout sidebar={sidebar} sidebarCollapsed={sidebarCollapsed}>
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {renderMainContent()}
      </div>
    </AppLayout>
  );
}

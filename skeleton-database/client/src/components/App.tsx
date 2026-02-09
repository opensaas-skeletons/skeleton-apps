import { useState, useCallback } from "react";
import type { Base, Table } from "@shared/types/database";
import { useBases } from "../hooks/useBases";
import { useModal } from "../contexts/ModalContext";
import Header from "./Header";
import BaseList from "./BaseList";
import Sidebar from "./Sidebar";
import TableView from "./TableView";

export default function App() {
  const { bases, loading, fetchBases, addBase, editBase, removeBase } =
    useBases();
  const modal = useModal();
  const [selectedBase, setSelectedBase] = useState<Base | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const handleSelectBase = useCallback(
    (base: Base) => {
      setSelectedBase(base);
      setSelectedTableId(null);
    },
    []
  );

  const handleBackToList = useCallback(() => {
    setSelectedBase(null);
    setSelectedTableId(null);
  }, []);

  const handleSelectTable = useCallback((table: Table) => {
    setSelectedTableId(table.id);
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <Header
        selectedBase={selectedBase}
        onBackToList={handleBackToList}
        onRefresh={fetchBases}
        onCreateBase={async () => {
          const title = await modal.prompt("Base name:");
          if (!title?.trim()) return;
          const base = await addBase({ title: title.trim() });
          handleSelectBase(base);
        }}
      />
      <div className="flex-1 flex overflow-hidden">
        {selectedBase ? (
          <>
            <Sidebar
              baseId={selectedBase.id}
              baseName={selectedBase.title}
              selectedTableId={selectedTableId}
              onSelectTable={handleSelectTable}
              onBackToList={handleBackToList}
              bases={bases}
              onSwitchBase={handleSelectBase}
            />
            <main className="flex-1 overflow-hidden flex flex-col">
              {selectedTableId ? (
                <TableView tableId={selectedTableId} />
              ) : (
                <div className="flex-1 flex items-center justify-center text-surface-400">
                  <div className="text-center">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-surface-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-lg font-medium">No table selected</p>
                    <p className="text-sm mt-1">
                      Choose a table from the sidebar or create a new one
                    </p>
                  </div>
                </div>
              )}
            </main>
          </>
        ) : (
          <BaseList
            bases={bases}
            loading={loading}
            onSelectBase={handleSelectBase}
            onCreateBase={async () => {
              const title = await modal.prompt("Base name:");
              if (!title?.trim()) return;
              await addBase({ title: title.trim() });
            }}
            onDeleteBase={removeBase}
          />
        )}
      </div>
    </div>
  );
}

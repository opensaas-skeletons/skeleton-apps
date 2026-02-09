import { useState } from "react";
import type { PageTreeNode } from "@shared/types/wiki";
import { useModal } from "../../contexts/ModalContext";

interface Props {
  nodes: PageTreeNode[];
  selectedPageId: string | null;
  onSelectPage: (id: string) => void;
  onCreatePage: (parentId?: string | null) => void;
  onDeletePage: (id: string) => void;
  depth: number;
}

export default function PageTree({ nodes, selectedPageId, onSelectPage, onCreatePage, onDeletePage, depth }: Props) {
  return (
    <div>
      {nodes.map((node) => (
        <PageTreeItem
          key={node.id}
          node={node}
          selectedPageId={selectedPageId}
          onSelectPage={onSelectPage}
          onCreatePage={onCreatePage}
          onDeletePage={onDeletePage}
          depth={depth}
        />
      ))}
    </div>
  );
}

function PageTreeItem({
  node,
  selectedPageId,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  depth,
}: {
  node: PageTreeNode;
  selectedPageId: string | null;
  onSelectPage: (id: string) => void;
  onCreatePage: (parentId?: string | null) => void;
  onDeletePage: (id: string) => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const modal = useModal();
  const isSelected = node.id === selectedPageId;
  const hasChildren = node.children.length > 0;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await modal.confirm({
      message: `Delete "${node.title}"${hasChildren ? " and all sub-pages" : ""}?`,
      variant: "destructive",
      confirmLabel: "Delete",
    });
    if (confirmed) {
      onDeletePage(node.id);
    }
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreatePage(node.id);
    setExpanded(true);
  };

  return (
    <div>
      <div
        className={`group flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer transition-colors ${
          isSelected
            ? "bg-brand-50 text-brand-700"
            : "text-surface-600 hover:bg-surface-50"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelectPage(node.id)}
      >
        {/* Expand/collapse toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className={`w-4 h-4 flex items-center justify-center shrink-0 ${
            hasChildren ? "text-surface-400" : "invisible"
          }`}
        >
          <svg
            className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Icon */}
        <span className="text-sm shrink-0">{node.icon}</span>

        {/* Title */}
        <span className="text-sm truncate flex-1">{node.title}</span>

        {/* Pin indicator */}
        {node.is_pinned && (
          <span className="text-xs text-surface-400 shrink-0">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
            </svg>
          </span>
        )}

        {/* Actions */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0">
          <button
            onClick={handleAddChild}
            className="p-0.5 text-surface-400 hover:text-surface-600 transition-colors"
            title="Add sub-page"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="p-0.5 text-surface-400 hover:text-red-500 transition-colors"
            title="Delete page"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <PageTree
          nodes={node.children}
          selectedPageId={selectedPageId}
          onSelectPage={onSelectPage}
          onCreatePage={onCreatePage}
          onDeletePage={onDeletePage}
          depth={depth + 1}
        />
      )}
    </div>
  );
}

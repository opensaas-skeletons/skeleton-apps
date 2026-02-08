/**
 * Header Component
 * ================
 * Top navigation bar for the app.
 *
 * LLM BUILDERS: Add navigation items, user menu, board switcher, etc.
 */

import React from "react";
import { LayoutDashboard, Download, Upload, Plus, RefreshCw } from "lucide-react";

interface HeaderProps {
  boardTitle: string;
  onExport: () => void;
  onImport: () => void;
  onRefresh: () => void;
  onNewBoard: () => void;
}

export function Header({ boardTitle, onExport, onImport, onRefresh, onNewBoard }: HeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-surface-200 flex items-center justify-between px-5 flex-shrink-0">
      {/* Left — Logo & Board Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-brand-600">
          <LayoutDashboard size={20} strokeWidth={2.2} />
          <span className="font-semibold text-sm tracking-tight">Skeleton Tasks</span>
        </div>
        <div className="w-px h-5 bg-surface-200" />
        <h1 className="text-sm font-medium text-surface-700">{boardTitle}</h1>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onRefresh}
          className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
        <button
          onClick={onExport}
          className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
          title="Export data"
        >
          <Download size={16} />
        </button>
        <button
          onClick={onImport}
          className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
          title="Import data"
        >
          <Upload size={16} />
        </button>
        <div className="w-px h-5 bg-surface-200 mx-1" />
        <button
          onClick={onNewBoard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus size={14} />
          New Board
        </button>
      </div>
    </header>
  );
}

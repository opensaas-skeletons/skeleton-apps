import { useState } from "react";
import type {
  Field,
  View,
  FilterCondition,
  SortCondition,
  CreateViewInput,
} from "@shared/types/database";
import ViewTabs from "./ViewTabs";
import SearchInput from "./SearchInput";
import FilterBuilder from "./FilterBuilder";
import SortBuilder from "./SortBuilder";
import CsvMenu from "./CsvMenu";

interface ToolbarProps {
  fields: Field[];
  views: View[];
  activeViewId: string | null;
  filters: FilterCondition[];
  sorts: SortCondition[];
  search: string;
  tableId: string;
  onSetFilters: (f: FilterCondition[]) => void;
  onSetSorts: (s: SortCondition[]) => void;
  onSetSearch: (s: string) => void;
  onSetActiveView: (viewId: string | null) => void;
  onAddView: (input: CreateViewInput) => void;
  onRemoveView: (id: string) => void;
  onAddRow: () => void;
  viewMode: "grid" | "form";
  onSetViewMode: (mode: "grid" | "form") => void;
}

export default function Toolbar({
  fields,
  views,
  activeViewId,
  filters,
  sorts,
  search,
  tableId,
  onSetFilters,
  onSetSorts,
  onSetSearch,
  onSetActiveView,
  onAddView,
  onRemoveView,
  onAddRow,
  viewMode,
  onSetViewMode,
}: ToolbarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showSorts, setShowSorts] = useState(false);

  return (
    <div className="bg-white border-b border-surface-200">
      <ViewTabs
        views={views}
        activeViewId={activeViewId}
        tableId={tableId}
        onSetActiveView={onSetActiveView}
        onAddView={onAddView}
        onRemoveView={onRemoveView}
      />

      <div className="px-4 py-2 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 border border-surface-200 rounded-md overflow-hidden">
          <button
            onClick={() => onSetViewMode("grid")}
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === "grid"
                ? "bg-brand-50 text-brand-700"
                : "text-surface-600 hover:bg-surface-50"
            }`}
          >
            <svg
              className="w-4 h-4 inline mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Grid
          </button>
          <button
            onClick={() => onSetViewMode("form")}
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === "form"
                ? "bg-brand-50 text-brand-700"
                : "text-surface-600 hover:bg-surface-50"
            }`}
          >
            <svg
              className="w-4 h-4 inline mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Form
          </button>
        </div>

        <div className="h-5 w-px bg-surface-200" />

        <SearchInput value={search} onChange={onSetSearch} />

        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              filters.length > 0
                ? "bg-brand-50 text-brand-700 border border-brand-200"
                : "text-surface-600 hover:bg-surface-100 border border-surface-200"
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filter
            {filters.length > 0 && (
              <span className="bg-brand-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {filters.length}
              </span>
            )}
          </button>
          {showFilters && (
            <FilterBuilder
              fields={fields}
              filters={filters}
              onChange={onSetFilters}
              onClose={() => setShowFilters(false)}
            />
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowSorts(!showSorts)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              sorts.length > 0
                ? "bg-brand-50 text-brand-700 border border-brand-200"
                : "text-surface-600 hover:bg-surface-100 border border-surface-200"
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
              />
            </svg>
            Sort
            {sorts.length > 0 && (
              <span className="bg-brand-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {sorts.length}
              </span>
            )}
          </button>
          {showSorts && (
            <SortBuilder
              fields={fields}
              sorts={sorts}
              onChange={onSetSorts}
              onClose={() => setShowSorts(false)}
            />
          )}
        </div>

        <CsvMenu tableId={tableId} />

        <div className="ml-auto">
          <button
            onClick={onAddRow}
            className="px-3 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors flex items-center gap-1.5"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Row
          </button>
        </div>
      </div>
    </div>
  );
}

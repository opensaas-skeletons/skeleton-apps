/**
 * FilterBar Component
 * ===================
 * Filter controls rendered above the board columns.
 *
 * LLM BUILDERS: Add more filter types here!
 * Examples: date range filter, label filter, sort options.
 */

import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { PRIORITIES } from "@shared/constants";

export interface FilterState {
  search: string;
  priority: string;
  assignee: string;
}

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput });
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const hasFilters = filters.search || filters.priority || filters.assignee;

  const clearFilters = () => {
    setSearchInput("");
    onFiltersChange({ search: "", priority: "", assignee: "" });
  };

  return (
    <div className="flex items-center gap-3 px-5 pt-3 pb-1">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-surface-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 w-48 transition-colors"
        />
      </div>

      {/* Priority filter */}
      <select
        value={filters.priority}
        onChange={(e) => onFiltersChange({ ...filters, priority: e.target.value })}
        className="px-2.5 py-1.5 text-xs rounded-lg border border-surface-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 text-surface-600 transition-colors"
      >
        <option value="">All Priorities</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </option>
        ))}
      </select>

      {/* Assignee filter */}
      <input
        type="text"
        placeholder="Filter by assignee..."
        value={filters.assignee}
        onChange={(e) => onFiltersChange({ ...filters, assignee: e.target.value })}
        className="px-2.5 py-1.5 text-xs rounded-lg border border-surface-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 w-40 transition-colors"
      />

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded-lg transition-colors"
        >
          <X size={12} />
          Clear
        </button>
      )}
    </div>
  );
}

/**
 * TaskCard Component
 * ==================
 * Renders a single task card within a column.
 *
 * LLM BUILDERS: Customize how tasks look!
 * - Add avatars for assignees
 * - Show custom metadata fields
 * - Add progress bars, checklists, etc.
 */

import React from "react";
import { Calendar, Tag, User, GripVertical, Trash2, AlertCircle } from "lucide-react";
import type { Task } from "@shared/types/task";
import { PRIORITY_COLORS } from "@shared/constants";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onDelete: () => void;
  isDragging?: boolean;
  dragHandleProps?: Record<string, any>;
}

export function TaskCard({ task, onClick, onDelete, isDragging, dragHandleProps }: TaskCardProps) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date();
  const priorityColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays <= 7) return `${diffDays}d left`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div
      className={`
        group relative bg-white rounded-lg border border-surface-200 p-3 
        cursor-pointer transition-all duration-150
        hover:shadow-card-hover hover:border-surface-300
        ${isDragging ? "shadow-card-hover rotate-2 opacity-90" : "shadow-card"}
      `}
      onClick={onClick}
    >
      {/* Priority indicator bar */}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-lg"
        style={{ backgroundColor: priorityColor }}
      />

      {/* Drag handle */}
      <div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        {...dragHandleProps}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={14} className="text-surface-400" />
      </div>

      {/* Delete button */}
      <button
        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-surface-400 hover:text-red-500"
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm("Delete this task?")) {
            onDelete();
          }
        }}
        title="Delete task"
      >
        <Trash2 size={12} />
      </button>

      {/* Content */}
      <div className="pl-2">
        {/* Title */}
        <h3 className="text-sm font-medium text-surface-800 leading-snug pr-5 mb-1.5">
          {task.title}
        </h3>

        {/* Description preview */}
        {task.description && (
          <p className="text-xs text-surface-400 line-clamp-2 mb-2 leading-relaxed">
            {task.description.replace(/[#*`\[\]]/g, "").slice(0, 120)}
          </p>
        )}

        {/* Labels */}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.labels.slice(0, 3).map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-100 text-surface-500"
              >
                {label}
              </span>
            ))}
            {task.labels.length > 3 && (
              <span className="text-[10px] text-surface-400">+{task.labels.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer — Meta info */}
        <div className="flex items-center gap-3 mt-1">
          {/* Due date */}
          {task.due_date && (
            <span
              className={`flex items-center gap-1 text-[11px] ${
                isOverdue ? "text-red-500 font-medium" : "text-surface-400"
              }`}
            >
              {isOverdue ? <AlertCircle size={11} /> : <Calendar size={11} />}
              {formatDate(task.due_date)}
            </span>
          )}

          {/* Assignee */}
          {task.assignee && (
            <span className="flex items-center gap-1 text-[11px] text-surface-400">
              <User size={11} />
              {task.assignee}
            </span>
          )}

          {/* Priority badge (only show for high/urgent) */}
          {(task.priority === "high" || task.priority === "urgent") && (
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: priorityColor }}
            >
              {task.priority}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

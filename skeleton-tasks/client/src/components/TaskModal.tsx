/**
 * TaskModal Component
 * ===================
 * Modal dialog for creating and editing tasks.
 *
 * LLM BUILDERS: Add more fields here!
 * - File attachments
 * - Subtask checklist
 * - Custom metadata fields
 * - Rich text editor for description
 */

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Task, CreateTaskInput, UpdateTaskInput, Column } from "@shared/types/task";
import { PRIORITIES, PRIORITY_COLORS } from "@shared/constants";

interface TaskModalProps {
  task?: Task | null; // null = creating new, Task = editing existing
  columns: Column[];
  defaultColumnId?: string;
  onSave: (input: CreateTaskInput | UpdateTaskInput) => void;
  onClose: () => void;
}

export function TaskModal({ task, columns, defaultColumnId, onSave, onClose }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [columnId, setColumnId] = useState(task?.column_id || defaultColumnId || columns[0]?.id || "");
  const [assignee, setAssignee] = useState(task?.assignee || "");
  const [dueDate, setDueDate] = useState(task?.due_date ? task.due_date.slice(0, 10) : "");
  const [labelsStr, setLabelsStr] = useState(task?.labels?.join(", ") || "");

  const isEditing = !!task;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const labels = labelsStr
      .split(",")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (isEditing) {
      const input: UpdateTaskInput = {
        title: title.trim(),
        description,
        priority: priority as any,
        assignee: assignee || null,
        labels,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      };
      onSave(input);
    } else {
      const input: CreateTaskInput = {
        title: title.trim(),
        column_id: columnId,
        description,
        priority: priority as any,
        assignee: assignee || null,
        labels,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      };
      onSave(input);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-100">
          <h2 className="text-base font-semibold text-surface-800">
            {isEditing ? "Edit Task" : "New Task"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">
              Description <span className="text-surface-300">(Markdown supported)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, notes, or context..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all resize-y"
            />
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-2 gap-4">
            {/* Column (only for new tasks) */}
            {!isEditing && (
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1.5">Column</label>
                <select
                  value={columnId}
                  onChange={(e) => setColumnId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-white"
                >
                  {columns.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Priority</label>
              <div className="flex gap-1">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`
                      flex-1 py-1.5 rounded-md text-[11px] font-medium capitalize transition-all
                      ${priority === p
                        ? "text-white shadow-sm"
                        : "text-surface-500 bg-surface-50 hover:bg-surface-100"
                      }
                    `}
                    style={priority === p ? { backgroundColor: PRIORITY_COLORS[p] } : {}}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Assignee</label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Name or email"
                className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">
              Labels <span className="text-surface-300">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={labelsStr}
              onChange={(e) => setLabelsStr(e.target.value)}
              placeholder="frontend, bug, urgent"
              className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-surface-600 hover:bg-surface-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isEditing ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

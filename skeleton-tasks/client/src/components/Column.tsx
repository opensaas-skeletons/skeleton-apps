/**
 * Column Component
 * ================
 * A single column in the Kanban board, containing task cards.
 *
 * LLM BUILDERS: Customize column behavior here.
 * - Add column-level actions (collapse, filter, sort)
 * - Add WIP limit warnings
 * - Add column settings dropdown
 */

import React from "react";
import { Plus, MoreHorizontal } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ColumnWithTasks, Task } from "@shared/types/task";
import { TaskCard } from "./TaskCard";

interface ColumnProps {
  column: ColumnWithTasks;
  onAddTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

function SortableTaskCard({
  task,
  onEdit,
  onDelete,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", task, columnId: task.column_id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "dragging-source" : ""}
      {...attributes}
      {...listeners}
    >
      <TaskCard
        task={task}
        onClick={onEdit}
        onDelete={onDelete}
        isDragging={isDragging}
      />
    </div>
  );
}

export function Column({ column, onAddTask, onEditTask, onDeleteTask }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: "column", columnId: column.id },
  });

  const taskCount = column.tasks.length;
  const isOverLimit = column.wip_limit !== null && taskCount > column.wip_limit;

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2">
          {/* Color dot */}
          {column.color && (
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: column.color }}
            />
          )}
          <h2 className="text-xs font-semibold text-surface-600 uppercase tracking-wider">
            {column.title}
          </h2>
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
              isOverLimit
                ? "bg-red-100 text-red-600"
                : "bg-surface-100 text-surface-400"
            }`}
          >
            {taskCount}
            {column.wip_limit !== null && `/${column.wip_limit}`}
          </span>
        </div>

        <button
          onClick={() => onAddTask(column.id)}
          className="p-1 rounded-md text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
          title={`Add task to ${column.title}`}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Task List — Drop zone */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 flex flex-col gap-2 p-1.5 rounded-xl transition-colors min-h-[120px]
          ${isOver ? "bg-brand-50/60 ring-2 ring-brand-200 ring-inset" : "bg-surface-100/50"}
        `}
      >
        <SortableContext
          items={column.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </SortableContext>

        {/* Empty state */}
        {column.tasks.length === 0 && !isOver && (
          <div className="flex-1 flex items-center justify-center min-h-[80px]">
            <p className="text-xs text-surface-300">No tasks yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

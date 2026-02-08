/**
 * Board Component
 * ===============
 * The main Kanban board with drag-and-drop support.
 *
 * LLM BUILDERS: This is the central UI component.
 * - Add board-level features (search, filters, view toggles)
 * - Add a list/table view alternative
 * - Add keyboard shortcuts
 */

import React, { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import type { BoardWithDetails, Task, ColumnWithTasks, CreateTaskInput, UpdateTaskInput } from "@shared/types/task";
import { Column } from "./Column";
import { TaskCard } from "./TaskCard";
import { TaskModal } from "./TaskModal";
import { FilterBar, FilterState } from "./FilterBar";

// TODO: Keyboard Shortcuts
// ========================
// Planned shortcuts for future implementation:
// - N: Open new task modal (in first column)
// - /: Focus the search input in FilterBar
// - Escape: Close open modal / clear filters
// - ?: Show keyboard shortcuts help dialog

interface BoardProps {
  board: BoardWithDetails;
  onAddTask: (input: CreateTaskInput) => void;
  onEditTask: (taskId: string, input: UpdateTaskInput) => void;
  onMoveTask: (taskId: string, input: { column_id: string; position: number }) => void;
  onDeleteTask: (taskId: string) => void;
}

export function Board({ board, onAddTask, onEditTask, onMoveTask, onDeleteTask }: BoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [modalState, setModalState] = useState<{
    open: boolean;
    task?: Task;
    columnId?: string;
  }>({ open: false });
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    priority: "",
    assignee: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement before drag starts (prevents accidental drags)
      },
    })
  );

  // Apply client-side filters to the board columns
  const filteredBoard = useMemo(() => {
    const hasFilters = filters.search || filters.priority || filters.assignee;
    if (!hasFilters) return board;

    const searchLower = filters.search.toLowerCase();
    const assigneeLower = filters.assignee.toLowerCase();

    const filteredColumns: ColumnWithTasks[] = board.columns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((task) => {
        if (filters.search) {
          const matchesSearch =
            task.title.toLowerCase().includes(searchLower) ||
            (task.description && task.description.toLowerCase().includes(searchLower));
          if (!matchesSearch) return false;
        }
        if (filters.priority && task.priority !== filters.priority) {
          return false;
        }
        if (filters.assignee) {
          if (!task.assignee || !task.assignee.toLowerCase().includes(assigneeLower)) {
            return false;
          }
        }
        return true;
      }),
    }));

    return { ...board, columns: filteredColumns };
  }, [board, filters]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = active.data.current?.task as Task;
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData) return;

    let targetColumnId: string;
    let targetPosition: number;

    if (overData?.type === "column") {
      // Dropped on a column (empty area)
      targetColumnId = overData.columnId;
      const col = board.columns.find((c) => c.id === targetColumnId);
      targetPosition = col?.tasks.length || 0;
    } else if (overData?.type === "task") {
      // Dropped on another task
      targetColumnId = overData.task.column_id;
      const col = board.columns.find((c) => c.id === targetColumnId);
      const overIndex = col?.tasks.findIndex((t) => t.id === over.id) ?? 0;
      targetPosition = overIndex;
    } else {
      return;
    }

    // Don't move if nothing changed
    if (activeData.task.column_id === targetColumnId && activeData.task.position === targetPosition) {
      return;
    }

    onMoveTask(taskId, {
      column_id: targetColumnId,
      position: targetPosition,
    });
  };

  const handleOpenCreate = (columnId: string) => {
    setModalState({ open: true, columnId });
  };

  const handleOpenEdit = (task: Task) => {
    setModalState({ open: true, task });
  };

  const handleModalSave = (input: CreateTaskInput | UpdateTaskInput) => {
    if (modalState.task) {
      onEditTask(modalState.task.id, input as UpdateTaskInput);
    } else {
      onAddTask(input as CreateTaskInput);
    }
    setModalState({ open: false });
  };

  return (
    <>
      <FilterBar filters={filters} onFiltersChange={setFilters} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-4 p-5 overflow-x-auto board-scroll">
          {filteredBoard.columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              onAddTask={handleOpenCreate}
              onEditTask={handleOpenEdit}
              onDeleteTask={onDeleteTask}
            />
          ))}
        </div>

        {/* Drag overlay — shows the card being dragged */}
        <DragOverlay>
          {activeTask ? (
            <div className="drag-overlay">
              <TaskCard
                task={activeTask}
                onClick={() => {}}
                onDelete={() => {}}
                isDragging
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task Create/Edit Modal */}
      {modalState.open && (
        <TaskModal
          task={modalState.task || null}
          columns={board.columns}
          defaultColumnId={modalState.columnId}
          onSave={handleModalSave}
          onClose={() => setModalState({ open: false })}
        />
      )}
    </>
  );
}

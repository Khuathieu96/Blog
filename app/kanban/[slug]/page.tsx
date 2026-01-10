'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanTask } from './KanbanTask';
import { TaskDetailPanel } from './TaskDetailPanel';
import DueDateModal from './DueDateModal';

export interface Task {
  _id: string;
  title: string;
  content?: string;
  column: string;
  order: number;
  parent?: string | null;
  labels?: string[];
  status?: string | null;
  startDate?: string;
  dueDate?: string;
  endDate?: string;
  isCompleted: boolean;
  subtasks?: Task[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Column {
  _id: string;
  title: string;
  order: number;
  color: string;
  tasks: Task[];
}

interface Board {
  _id: string;
  name: string;
  slug: string;
}

export default function KanbanBoardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, getAuthHeaders, handleUnauthorized } =
    useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [dragSourceColumnId, setDragSourceColumnId] = useState<string | null>(
    null,
  );
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [slug, setSlug] = useState<string>('');
  const [showDueDateModal, setShowDueDateModal] = useState(false);
  const [pendingMove, setPendingMove] = useState<{
    taskId: string;
    columnId: string;
    order: number;
    task: Task;
  } | null>(null);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin');
      return;
    }
    if (isAuthenticated && slug) {
      fetchBoard();
    }
  }, [isAuthenticated, isLoading, slug]);

  const fetchBoard = async () => {
    try {
      const res = await fetch(`/api/kanban/board/${slug}`, {
        headers: getAuthHeaders(),
      });
      if (res.status === 401) {
        handleUnauthorized();
        router.push('/signin');
        return;
      }
      if (res.status === 404) {
        router.push('/kanban');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setBoard(data.board);
        setColumns(data.columns);

        // Update selectedTask if it exists, to reflect new data (e.g., new subtasks)
        if (selectedTask) {
          const updatedTask = data.columns
            .flatMap((col: Column) => col.tasks)
            .find((t: Task) => t._id === selectedTask._id);
          if (updatedTask) {
            setSelectedTask(updatedTask);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch board:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    // Check if dragging a column
    if (activeData?.type === 'column') {
      setActiveColumn(activeData.column);
      return;
    }

    // Otherwise it's a task - find and store the source column
    const sourceColumn = columns.find((col) =>
      col.tasks.some((t) => t._id === active.id),
    );
    if (sourceColumn) {
      setDragSourceColumnId(sourceColumn._id);
    }

    const task = columns
      .flatMap((col) => col.tasks)
      .find((c) => c._id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;

    // Don't handle dragOver for columns - only dragEnd
    if (activeData?.type === 'column') return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which columns the tasks belong to
    const activeColumn = columns.find((col) =>
      col.tasks.some((c) => c._id === activeId),
    );
    const overColumn = columns.find(
      (col) => col._id === overId || col.tasks.some((c) => c._id === overId),
    );

    if (!activeColumn || !overColumn || activeColumn._id === overColumn._id)
      return;

    setColumns((prev) => {
      const activeTasks = [...activeColumn.tasks];
      const overTasks = [...overColumn.tasks];

      const activeIndex = activeTasks.findIndex((c) => c._id === activeId);
      const [movedTask] = activeTasks.splice(activeIndex, 1);
      movedTask.column = overColumn._id;

      // Find position to insert
      const overIndex = overTasks.findIndex((c) => c._id === overId);
      if (overIndex >= 0) {
        overTasks.splice(overIndex, 0, movedTask);
      } else {
        overTasks.push(movedTask);
      }

      return prev.map((col) => {
        if (col._id === activeColumn._id) {
          return { ...col, tasks: activeTasks };
        }
        if (col._id === overColumn._id) {
          return { ...col, tasks: overTasks };
        }
        return col;
      });
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeData = active.data.current;

    // Store source column before clearing state
    const sourceColumnId = dragSourceColumnId;

    setActiveTask(null);
    setActiveColumn(null);
    setDragSourceColumnId(null);

    if (!over) {
      // Drag cancelled - reset board to original state
      fetchBoard();
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Handle column reordering
    if (activeData?.type === 'column') {
      if (activeId === overId) return;

      const oldIndex = columns.findIndex((col) => col._id === activeId);
      const newIndex = columns.findIndex((col) => col._id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newColumns = arrayMove(columns, oldIndex, newIndex);
        setColumns(newColumns);

        // Save to backend
        try {
          await fetch('/api/kanban/column', {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              id: activeId,
              order: newIndex,
            }),
          });
        } catch (error) {
          console.error('Failed to update column position:', error);
          fetchBoard();
        }
      }
      return;
    }

    // Handle task operations - use sourceColumnId to get original column
    const sourceColumn = columns.find((col) => col._id === sourceColumnId);
    if (!sourceColumn) return;

    // Find the task (might be in target column now due to dragOver)
    const task =
      activeTask ||
      columns.flatMap((col) => col.tasks).find((t) => t._id === activeId);

    if (!task) return;

    // Check if task moved to a different column
    const targetColumn = columns.find(
      (col) => col._id === overId || col.tasks.some((c) => c._id === overId),
    );

    // Use sourceColumnId for accurate column change detection
    const isColumnChange = targetColumn && targetColumn._id !== sourceColumnId;

    // Always show DueDate modal when moving to "In Progress" column
    if (isColumnChange) {
      const targetColTitle = targetColumn.title.toLowerCase().trim();
      const isInProgress =
        targetColTitle === 'in progress' ||
        targetColTitle === 'inprogress' ||
        targetColTitle === 'progress';

      if (isInProgress) {
        // Store pending move and show modal to set/confirm dueDate
        const overIndex = targetColumn.tasks.findIndex((c) => c._id === overId);
        setPendingMove({
          taskId: activeId,
          columnId: targetColumn._id,
          order: overIndex >= 0 ? overIndex : targetColumn.tasks.length,
          task: task,
        });
        setShowDueDateModal(true);
        // Reset UI - the move will be completed after DueDate is set
        fetchBoard();
        return;
      }
    }

    // Handle ordering and persist move
    const destinationColumn = isColumnChange ? targetColumn! : sourceColumn;

    // Find task's current index in destination (due to dragOver visual updates)
    const currentColumn = columns.find((col) =>
      col.tasks.some((t) => t._id === activeId),
    );
    const activeIndex =
      currentColumn?.tasks.findIndex((t) => t._id === activeId) ?? -1;

    const overIndex = destinationColumn.tasks.findIndex(
      (c) => c._id === overId,
    );

    if (
      !isColumnChange &&
      activeIndex !== overIndex &&
      overIndex >= 0 &&
      currentColumn
    ) {
      setColumns((prev) =>
        prev.map((col) => {
          if (col._id === currentColumn._id) {
            return {
              ...col,
              tasks: arrayMove(col.tasks, activeIndex, overIndex),
            };
          }
          return col;
        }),
      );
    }

    try {
      const res = await fetch('/api/kanban/task', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: activeId,
          columnId: destinationColumn._id,
          order:
            overIndex >= 0
              ? overIndex
              : Math.max(0, destinationColumn.tasks.length - 1),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        // Update selectedTask if this is the selected one
        if (selectedTask?._id === updated._id) {
          setSelectedTask(updated);
        }
        // Update columns state directly with the updated task data
        setColumns((prev) =>
          prev.map((col) => ({
            ...col,
            tasks: col.tasks.map((t) =>
              t._id === updated._id ? { ...t, ...updated } : t,
            ),
          })),
        );
      }
    } catch (error) {
      console.error('Failed to update task position:', error);
      fetchBoard();
    }
  };

  const addTask = async (
    columnId: string,
    title: string,
    parentId?: string,
  ) => {
    try {
      const res = await fetch('/api/kanban/task', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ columnId, title, parentId }),
      });
      if (res.ok) {
        fetchBoard();
      }
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const res = await fetch('/api/kanban/task', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: taskId, ...updates }),
      });
      if (res.ok) {
        fetchBoard();
        if (selectedTask?._id === taskId) {
          setSelectedTask((prev) => (prev ? { ...prev, ...updates } : null));
        }
      } else {
        const errorData = await res.json();
        if (errorData.requireDueDate) {
          alert(errorData.message);
        }
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDueDateConfirm = async (dueDate: Date) => {
    if (!pendingMove) return;

    try {
      // Update task with dueDate and move to new column
      const res = await fetch('/api/kanban/task', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: pendingMove.taskId,
          columnId: pendingMove.columnId,
          order: pendingMove.order,
          dueDate: dueDate.toISOString(),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        if (selectedTask?._id === updated._id) {
          setSelectedTask(updated);
        }
        setShowDueDateModal(false);
        setPendingMove(null);
        fetchBoard();
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Failed to move task');
      }
    } catch (error) {
      console.error('Failed to complete task move:', error);
      alert('Failed to move task. Please try again.');
    }
  };

  const handleDueDateCancel = () => {
    setShowDueDateModal(false);
    setPendingMove(null);
  };

  const deleteTask = async (taskId: string) => {
    try {
      const res = await fetch('/api/kanban/task', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: taskId }),
      });
      if (res.ok) {
        setSelectedTask(null);
        fetchBoard();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const deleteSubtask = async (taskId: string) => {
    try {
      const res = await fetch('/api/kanban/task', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: taskId }),
      });
      if (res.ok) {
        setSelectedTask((prev) =>
          prev
            ? { ...prev, subtasks: prev.subtasks?.filter((s) => s._id !== taskId) }
            : prev,
        );
        fetchBoard();
      }
    } catch (error) {
      console.error('Failed to delete subtask:', error);
    }
  };

  const addColumn = async () => {
    const title = prompt('Column name:');
    if (!title?.trim() || !board) return;

    try {
      const res = await fetch('/api/kanban/column', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ boardId: board._id, title: title.trim() }),
      });
      if (res.ok) {
        fetchBoard();
      }
    } catch (error) {
      console.error('Failed to add column:', error);
    }
  };

  const updateColumn = async (columnId: string, title: string) => {
    try {
      await fetch('/api/kanban/column', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: columnId, title }),
      });
      fetchBoard();
    } catch (error) {
      console.error('Failed to update column:', error);
    }
  };

  const deleteColumn = async (columnId: string) => {
    const column = columns.find((c) => c._id === columnId);
    const defaultTitles = ['backlog', 'to do', 'todo', 'in progress', 'done'];
    if (column && defaultTitles.includes(column.title.toLowerCase())) {
      alert('Default columns cannot be deleted.');
      return;
    }

    if (!confirm('Delete this column and all its tasks?')) return;

    try {
      await fetch('/api/kanban/column', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: columnId }),
      });
      fetchBoard();
    } catch (error) {
      console.error('Failed to delete column:', error);
    }
  };

  if (isLoading || loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  }

  if (!board) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>Board not found</div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <button
          onClick={() => router.push('/kanban')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 20,
          }}
        >
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: 20, flex: 1 }}>{board.name}</h1>
        <button
          onClick={addColumn}
          style={{
            padding: '0.5rem 1rem',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          + New Column
        </button>
      </div>

      {/* Main Content - Split Layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Board - Left Panel */}
        <div
          style={{
            flex: 1,
            overflowX: 'auto',
            padding: '1.5rem',
            background: '#f1f5f9',
          }}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                height: '100%',
                overflowY: 'auto',
              }}
            >
              <SortableContext
                items={columns.map((c) => c._id)}
                strategy={horizontalListSortingStrategy}
              >
                {columns.map((column) => (
                  <KanbanColumn
                    key={column._id}
                    column={column}
                    onAddTask={(title: string, parentId?: string) =>
                      addTask(column._id, title, parentId)
                    }
                    onTaskClick={setSelectedTask}
                    onUpdateColumn={updateColumn}
                    onDeleteColumn={deleteColumn}
                  />
                ))}
              </SortableContext>
            </div>

            <DragOverlay>
              {activeTask ? <KanbanTask task={activeTask} isDragging /> : null}
              {activeColumn ? (
                <KanbanColumn
                  column={activeColumn}
                  isDragging
                  onAddTask={() => {}}
                  onTaskClick={() => {}}
                  onUpdateColumn={() => {}}
                  onDeleteColumn={() => {}}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Detail Panel - Right */}
        {selectedTask && (
          <TaskDetailPanel
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onAddSubtask={(title: string) => {
              const column = columns.find((c) =>
                c.tasks.some((task) => task._id === selectedTask._id),
              );
              if (column) {
                addTask(column._id, title, selectedTask._id);
              }
            }}
            onDeleteSubtask={deleteSubtask}
          />
        )}
      </div>

      {/* DueDate Modal */}
      <DueDateModal
        isOpen={showDueDateModal}
        onClose={handleDueDateCancel}
        onConfirm={handleDueDateConfirm}
        taskTitle={pendingMove?.task?.title || ''}
        currentDueDate={pendingMove?.task?.dueDate}
      />
    </div>
  );
}

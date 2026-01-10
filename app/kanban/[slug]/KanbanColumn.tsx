'use client';
import React, { useState } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KanbanTask } from './KanbanTask';
import { Column, Task } from './page';

interface KanbanColumnProps {
  column: Column;
  onAddTask: (title: string, parentId?: string) => void;
  onTaskClick: (task: Task) => void;
  onUpdateColumn: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
  isDragging?: boolean;
}

export function KanbanColumn({
  column,
  onAddTask,
  onTaskClick,
  onUpdateColumn,
  onDeleteColumn,
  isDragging,
}: KanbanColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: column._id,
    data: { type: 'column', column },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle.trim());
    setNewTaskTitle('');
    setIsAdding(false);
  };

  const handleTitleSave = () => {
    if (editTitle.trim() && editTitle !== column.title) {
      onUpdateColumn(column._id, editTitle.trim());
    }
    setIsEditingTitle(false);
  };

  // Only show top-level tasks (no parent)
  const topLevelTasks = column.tasks.filter((task) => !task.parent);

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        width: '20vw',
        minWidth: '280px',
        maxWidth: '360px',
        background: isDragging ? '#f0f9ff' : '#ffffff',
        borderRadius: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 8rem)',
        boxShadow: isDragging ? '0 0.5rem 1.5rem rgba(0,0,0,0.15)' : 'none',
      }}
    >
      {/* Column Header - Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: column.color,
          borderRadius: '0.5rem 0.5rem 0 0',
          cursor: 'grab',
        }}
      >
        {isEditingTitle ? (
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
            autoFocus
            style={{
              flex: 1,
              padding: '0.25rem 0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: '1px solid #ddd',
              borderRadius: '0.25rem',
            }}
          />
        ) : (
          <h3
            onClick={() => setIsEditingTitle(true)}
            style={{
              margin: 0,
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {column.title}
            <span
              style={{
                marginLeft: '0.5rem',
                fontWeight: 400,
                color: '#64748b',
              }}
            >
              ({topLevelTasks.length})
            </span>
          </h3>
        )}
        {column.title.toLowerCase() !== 'backlog' && (
          <button
            onClick={() => onDeleteColumn(column._id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              fontSize: '1rem',
            }}
            title='Delete column'
          >
            ×
          </button>
        )}
      </div>

      {/* Tasks */}
      <div
        style={{
          padding: '0.5rem',
          flex: 1,
          overflowY: 'auto',
          minHeight: '6rem',
        }}
      >
        <SortableContext
          items={topLevelTasks.map((c) => c._id)}
          strategy={verticalListSortingStrategy}
        >
          {topLevelTasks.map((task) => (
            <KanbanTask
              key={task._id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {/* Add task form - only for Backlog column */}
        {column.title.toLowerCase() === 'backlog' && (
          <>
            {isAdding ? (
              <div style={{ marginTop: '0.5rem' }}>
                <textarea
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder='Enter task title...'
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddTask();
                    }
                    if (e.key === 'Escape') {
                      setIsAdding(false);
                      setNewTaskTitle('');
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    fontSize: '0.875rem',
                    border: '1px solid #ddd',
                    borderRadius: '0.25rem',
                    resize: 'none',
                    minHeight: '3.75rem',
                    boxSizing: 'border-box',
                  }}
                />
                <div
                  style={{
                    marginTop: '0.5rem',
                    display: 'flex',
                    gap: '0.5rem',
                  }}
                >
                  <button
                    onClick={handleAddTask}
                    style={{
                      padding: '0.375rem 0.75rem',
                      background: '#0070f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                    }}
                  >
                    Add Task
                  </button>
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setNewTaskTitle('');
                    }}
                    style={{
                      padding: '0.375rem 0.75rem',
                      background: '#f1f5f9',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  marginTop: '0.5rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  fontSize: '0.8125rem',
                  textAlign: 'left',
                }}
              >
                + Add a task
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

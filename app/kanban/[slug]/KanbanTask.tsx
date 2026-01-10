'use client';
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from './page';

interface KanbanTaskProps {
  task: Task;
  onClick?: () => void;
  isDragging?: boolean;
}

export function KanbanTask({ task, onClick, isDragging }: KanbanTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks =
    task.subtasks?.filter((s) => s.isCompleted).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        padding: '0.75rem',
        marginBottom: '0.5rem',
        background: isDragging ? '#f0f9ff' : 'white',
        borderRadius: '0.375rem',
        border: '1px solid #e2e8f0',
        cursor: 'pointer',
        boxShadow: isDragging
          ? '0 0.25rem 0.75rem rgba(0,0,0,0.15)'
          : '0 0.0625rem 0.125rem rgba(0,0,0,0.05)',
      }}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '0.25rem',
            marginBottom: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          {task.labels.map((label, i) => (
            <span
              key={i}
              style={{
                padding: '0.125rem 0.5rem',
                fontSize: '0.6875rem',
                borderRadius: '0.1875rem',
                background: '#dbeafe',
                color: '#1e40af',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <div
        style={{
          fontSize: '0.875rem',
          textDecoration: task.isCompleted ? 'line-through' : 'none',
          color: task.isCompleted ? '#94a3b8' : '#1e293b',
        }}
      >
        {task.title}
      </div>

      {/* Footer info */}
      <div
        style={{
          marginTop: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.75rem',
          color: '#64748b',
        }}
      >
        {/* Due date */}
        {task.dueDate && (
          <span
            style={{
              color:
                new Date(task.dueDate) < new Date() ? '#ef4444' : '#64748b',
            }}
          >
            📅 {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}

        {/* Subtasks count */}
        {hasSubtasks && (
          <span>
            ☑ {completedSubtasks}/{totalSubtasks}
          </span>
        )}

        {/* Has content indicator */}
        {task.content && task.content.trim() && (
          <span title='Has description'>📝</span>
        )}
      </div>
    </div>
  );
}

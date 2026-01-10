'use client';
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Task } from './page';

interface TaskDetailPanelProps {
  task: Task;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onAddSubtask: (title: string) => void;
}

export function TaskDetailPanel({
  task,
  onClose,
  onUpdate,
  onDelete,
  onAddSubtask,
}: TaskDetailPanelProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [content, setContent] = useState(task.content || '');
  const [newSubtask, setNewSubtask] = useState('');
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [panelWidth, setPanelWidth] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Reset state when task changes
  useEffect(() => {
    setTitle(task.title);
    setContent(task.content || '');
    setIsEditingTitle(false);
    setIsEditingContent(false);
    setShowAddSubtask(false);
    setNewSubtask('');
  }, [task._id]);

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;
      const panelRect = panelRef.current.getBoundingClientRect();
      const newWidth = panelRect.right - e.clientX;
      // Constrain width between 300px and 800px
      setPanelWidth(Math.max(300, Math.min(800, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleTitleSave = () => {
    if (title.trim() && title !== task.title) {
      onUpdate(task._id, { title: title.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleContentSave = () => {
    if (content !== task.content) {
      onUpdate(task._id, { content });
    }
    setIsEditingContent(false);
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    onAddSubtask(newSubtask.trim());
    setNewSubtask('');
    setShowAddSubtask(false);
  };

  const toggleComplete = () => {
    onUpdate(task._id, { isCompleted: !task.isCompleted });
  };

  return (
    <div
      ref={panelRef}
      style={{
        width: panelWidth,
        height: '100%',
        background: 'white',
        borderLeft: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Resize Handle */}
      <div
        onMouseDown={() => setIsResizing(true)}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
          cursor: 'ew-resize',
          background: isResizing ? '#3b82f6' : 'transparent',
          transition: 'background 0.2s',
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          if (!isResizing) {
            e.currentTarget.style.background = '#e2e8f0';
          }
        }}
        onMouseLeave={(e) => {
          if (!isResizing) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      />
      {/* Header */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        {isEditingTitle ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
            autoFocus
            style={{
              flex: 1,
              fontSize: 16,
              fontWeight: 600,
              border: '1px solid #ddd',
              borderRadius: 4,
              padding: '4px 8px',
            }}
          />
        ) : (
          <h2
            onClick={() => setIsEditingTitle(true)}
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              flex: 1,
              textDecoration: task.isCompleted ? 'line-through' : 'none',
              color: task.isCompleted ? '#94a3b8' : '#1e293b',
            }}
          >
            {task.title}
          </h2>
        )}

        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 20,
            color: '#64748b',
            padding: 0,
            lineHeight: 1,
          }}
          title='Close panel'
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1.25rem' }}>
        {/* Description */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b' }}>
            Description
          </h4>
          {isEditingContent ? (
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder='Add a description... (supports Markdown)'
                style={{
                  width: '100%',
                  minHeight: 150,
                  padding: 12,
                  fontSize: 13,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  resize: 'vertical',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box',
                }}
                autoFocus
              />
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button
                  onClick={handleContentSave}
                  style={{
                    padding: '6px 12px',
                    background: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setContent(task.content || '');
                    setIsEditingContent(false);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingContent(true)}
              style={{
                padding: 12,
                background: '#f8fafc',
                borderRadius: 4,
                minHeight: 60,
                cursor: 'pointer',
              }}
            >
              {content ? (
                <div className='markdown-content' style={{ fontSize: 13 }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                  </ReactMarkdown>
                </div>
              ) : (
                <span style={{ color: '#94a3b8', fontSize: 13 }}>
                  Click to add description...
                </span>
              )}
            </div>
          )}
        </div>

        {/* Workflow Status */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b' }}>
            Workflow
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Status */}
            {task.status && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', minWidth: 80 }}>
                  Status:
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    padding: '4px 8px',
                    borderRadius: 4,
                    background:
                      task.status === 'Done'
                        ? '#10b981'
                        : task.status === 'In Progress'
                        ? '#f59e0b'
                        : '#6366f1',
                    color: 'white',
                  }}
                >
                  {task.status}
                </span>
              </div>
            )}

            {/* Start Date */}
            {task.startDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', minWidth: 80 }}>
                  Started:
                </span>
                <span style={{ fontSize: 13 }}>
                  {new Date(task.startDate).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', minWidth: 80 }}>
                  Due:
                </span>
                <span style={{ fontSize: 13 }}>
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* End Date */}
            {task.endDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', minWidth: 80 }}>
                  Completed:
                </span>
                <span style={{ fontSize: 13 }}>
                  {new Date(task.endDate).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Created/Updated */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#64748b', minWidth: 80 }}>
                Created:
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                {task.createdAt
                  ? new Date(task.createdAt).toLocaleString()
                  : 'N/A'}
              </span>
            </div>
            {task.updatedAt && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', minWidth: 80 }}>
                  Updated:
                </span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  {new Date(task.updatedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Subtasks */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b' }}>
            Subtasks
          </h4>

          {task.subtasks && task.subtasks.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {task.subtasks.map((subtask) => (
                <div
                  key={subtask._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 0',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <button
                    onClick={() =>
                      onUpdate(subtask._id, {
                        isCompleted: !subtask.isCompleted,
                      })
                    }
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 3,
                      border: '1px solid #cbd5e1',
                      background: subtask.isCompleted ? '#22c55e' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 11,
                    }}
                  >
                    {subtask.isCompleted && '✓'}
                  </button>
                  <span
                    style={{
                      fontSize: 13,
                      textDecoration: subtask.isCompleted
                        ? 'line-through'
                        : 'none',
                      color: subtask.isCompleted ? '#94a3b8' : '#1e293b',
                    }}
                  >
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
          )}

          {showAddSubtask ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder='Subtask title...'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSubtask();
                  if (e.key === 'Escape') {
                    setShowAddSubtask(false);
                    setNewSubtask('');
                  }
                }}
                autoFocus
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  fontSize: 13,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                }}
              />
              <button
                onClick={handleAddSubtask}
                style={{
                  padding: '6px 12px',
                  background: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Add
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddSubtask(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#0070f3',
                fontSize: 13,
                padding: 0,
              }}
            >
              + Add subtask
            </button>
          )}
        </div>

        {/* Due Date */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b' }}>
            Due Date
          </h4>
          <input
            type='date'
            value={task.dueDate ? task.dueDate.split('T')[0] : ''}
            onChange={(e) =>
              onUpdate(task._id, {
                dueDate: e.target.value || undefined,
              })
            }
            style={{
              padding: '6px 10px',
              fontSize: 13,
              border: '1px solid #ddd',
              borderRadius: 4,
            }}
          />
        </div>

        {/* Delete button */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          <button
            onClick={() => {
              if (confirm('Delete this task?')) {
                onDelete(task._id);
              }
            }}
            style={{
              padding: '8px 16px',
              background: '#fef2f2',
              color: '#dc2626',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Delete Task
          </button>
        </div>
      </div>
    </div>
  );
}

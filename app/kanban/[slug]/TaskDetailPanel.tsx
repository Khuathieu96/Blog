'use client';
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from './page';
import { useAuth } from '@/contexts/AuthContext';

interface TaskHistory {
  _id: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  fromColumnTitle?: string;
  toColumnTitle?: string;
  fromStatus?: string;
  toStatus?: string;
  userEmail?: string;
  description?: string[];
  createdAt: string;
}

interface TaskDetailPanelProps {
  task: Task;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onAddSubtask: (title: string) => void;
  onDeleteSubtask: (taskId: string) => void;
}

export function TaskDetailPanel({
  task,
  onClose,
  onUpdate,
  onDelete,
  onAddSubtask,
  onDeleteSubtask,
}: TaskDetailPanelProps) {
  const { getAuthHeaders } = useAuth();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [content, setContent] = useState(task.content || '');
  const [newSubtask, setNewSubtask] = useState('');
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [panelWidth, setPanelWidth] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const [history, setHistory] = useState<TaskHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [subtaskItems, setSubtaskItems] = useState<Task[]>(task.subtasks || []);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editSubtaskTitle, setEditSubtaskTitle] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  const subtaskSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  // Reset state when task changes
  useEffect(() => {
    setTitle(task.title);
    setContent(task.content || '');
    setIsEditingTitle(false);
    setIsEditingContent(false);
    setShowAddSubtask(false);
    setNewSubtask('');
    setShowHistory(false);
    setHistory([]);
    setSubtaskItems(task.subtasks || []);
    setEditingSubtaskId(null);
    setEditSubtaskTitle('');
  }, [task._id]);

  // Fetch history when expanded or when task changes (column/status/dates/order)
  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [
    showHistory,
    task._id,
    task.column,
    task.status,
    task.dueDate,
    task.startDate,
    task.endDate,
    task.isCompleted,
    task.order,
  ]);

  useEffect(() => {
    setSubtaskItems(task.subtasks || []);
  }, [task.subtasks]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/kanban/task-history?taskId=${task._id}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

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

  const handleSubtaskToggle = (subtaskId: string, isCompleted: boolean) => {
    setSubtaskItems((prev) =>
      prev.map((s) => (s._id === subtaskId ? { ...s, isCompleted } : s)),
    );
    onUpdate(subtaskId, { isCompleted });
  };

  const startEditSubtask = (subtaskId: string, titleValue: string) => {
    setEditingSubtaskId(subtaskId);
    setEditSubtaskTitle(titleValue);
  };

  const saveSubtaskTitle = (subtaskId: string) => {
    const nextTitle = editSubtaskTitle.trim();
    if (!nextTitle) return;
    setSubtaskItems((prev) =>
      prev.map((s) => (s._id === subtaskId ? { ...s, title: nextTitle } : s)),
    );
    setEditingSubtaskId(null);
    setEditSubtaskTitle('');
    onUpdate(subtaskId, { title: nextTitle });
  };

  const cancelSubtaskEdit = () => {
    setEditingSubtaskId(null);
    setEditSubtaskTitle('');
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    if (!confirm('Delete this subtask?')) return;
    setSubtaskItems((prev) => prev.filter((s) => s._id !== subtaskId));
    onDeleteSubtask(subtaskId);
  };

  const handleSubtaskDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const oldIndex = subtaskItems.findIndex((s) => s._id === activeId);
    const newIndex = subtaskItems.findIndex((s) => s._id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    setSubtaskItems((prev) => arrayMove(prev, oldIndex, newIndex));
    onUpdate(activeId, { order: newIndex });
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
            {/* Status Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#64748b', minWidth: 80 }}>
                Status:
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '4px 10px',
                  borderRadius: 4,
                  background:
                    task.status === 'Done'
                      ? '#10b981'
                      : task.status === 'In Progress'
                      ? '#f59e0b'
                      : task.status === 'Reopened'
                      ? '#ef4444'
                      : task.status === 'Todo'
                      ? '#6366f1'
                      : '#94a3b8',
                  color: 'white',
                }}
              >
                {task.status === 'Reopened'
                  ? '↩ Reopened'
                  : task.status || 'Backlog'}
              </span>
              {task.status === 'Reopened' && (
                <span
                  style={{
                    fontSize: 11,
                    color: '#ef4444',
                    fontStyle: 'italic',
                  }}
                >
                  (moved back from Done)
                </span>
              )}
            </div>

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

            {/* End Date */}
            {task.endDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', minWidth: 80 }}>
                  Completed:
                </span>
                <span
                  style={{ fontSize: 13, color: '#10b981', fontWeight: 500 }}
                >
                  {new Date(task.endDate).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Cycle Time - shown when task is completed */}
            {task.endDate && task.startDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', minWidth: 80 }}>
                  Cycle Time:
                </span>
                <span
                  style={{ fontSize: 13, fontWeight: 500, color: '#0ea5e9' }}
                >
                  {(() => {
                    const start = new Date(task.startDate);
                    const end = new Date(task.endDate);
                    const diffMs = end.getTime() - start.getTime();
                    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                    return diffDays === 1 ? '1 day' : `${diffDays} days`;
                  })()}
                </span>
              </div>
            )}

            {/* Lead Time - shown when task is completed */}
            {task.endDate && task.createdAt && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', minWidth: 80 }}>
                  Lead Time:
                </span>
                <span
                  style={{ fontSize: 13, fontWeight: 500, color: '#8b5cf6' }}
                >
                  {(() => {
                    const created = new Date(task.createdAt);
                    const end = new Date(task.endDate);
                    const diffMs = end.getTime() - created.getTime();
                    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                    return diffDays === 1 ? '1 day' : `${diffDays} days`;
                  })()}
                </span>
              </div>
            )}

            {/* Estimation Accuracy - compare dueDate vs endDate */}
            {task.endDate && task.dueDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', minWidth: 80 }}>
                  On Time:
                </span>
                {(() => {
                  const due = new Date(task.dueDate);
                  const end = new Date(task.endDate);
                  const diffMs = due.getTime() - end.getTime();
                  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
                  if (diffDays >= 0) {
                    return (
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: '#10b981',
                        }}
                      >
                        ✓{' '}
                        {diffDays === 0 ? 'On time' : `${diffDays} days early`}
                      </span>
                    );
                  } else {
                    return (
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: '#ef4444',
                        }}
                      >
                        ✗ {Math.abs(diffDays)} days late
                      </span>
                    );
                  }
                })()}
              </div>
            )}

            {/* Divider */}
            <div style={{ borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />

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

          {subtaskItems && subtaskItems.length > 0 && (
            <DndContext sensors={subtaskSensors} onDragEnd={handleSubtaskDragEnd}>
              <SortableContext
                items={subtaskItems.map((s) => s._id)}
                strategy={verticalListSortingStrategy}
              >
                <div style={{ marginBottom: 12 }}>
                  {subtaskItems.map((subtask) => (
                    <SortableSubtask
                      key={subtask._id}
                      subtask={subtask}
                      isEditing={editingSubtaskId === subtask._id}
                      editTitle={editSubtaskTitle}
                      onEditChange={setEditSubtaskTitle}
                      onEditStart={() => startEditSubtask(subtask._id, subtask.title)}
                      onEditSave={() => saveSubtaskTitle(subtask._id)}
                      onEditCancel={cancelSubtaskEdit}
                      onToggle={() =>
                        handleSubtaskToggle(subtask._id, !subtask.isCompleted)
                      }
                      onDelete={() => handleDeleteSubtask(subtask._id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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

        {/* Due Date - Editable */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b' }}>
            Due Date
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
            {task.dueDate && !task.isCompleted && (
              <span
                style={{
                  fontSize: 12,
                  color:
                    new Date(task.dueDate) < new Date() ? '#ef4444' : '#64748b',
                  fontWeight: new Date(task.dueDate) < new Date() ? 600 : 400,
                }}
              >
                {(() => {
                  const due = new Date(task.dueDate);
                  const now = new Date();
                  const diffMs = due.getTime() - now.getTime();
                  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
                  if (diffDays === 0) return 'Due today';
                  if (diffDays === 1) return 'Due tomorrow';
                  return `${diffDays} days left`;
                })()}
              </span>
            )}
          </div>
        </div>

        {/* Activity History */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontSize: 13,
              color: '#64748b',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                transform: showHistory ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            >
              ▶
            </span>
            Activity History
          </button>

          {showHistory && (
            <div style={{ marginTop: 12 }}>
              {loadingHistory ? (
                <div style={{ fontSize: 13, color: '#94a3b8' }}>Loading...</div>
              ) : history.length === 0 ? (
                <div style={{ fontSize: 13, color: '#94a3b8' }}>
                  No history yet
                </div>
              ) : (
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {history.map((item) => (
                    <div
                      key={item._id}
                      style={{
                        padding: '8px 12px',
                        background: '#f8fafc',
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 500,
                            color: getActionColor(item.action, item),
                          }}
                        >
                          {formatAction(item)}
                        </span>
                        <span style={{ color: '#94a3b8' }}>
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {item.userEmail && (
                        <div style={{ color: '#94a3b8', fontSize: 11 }}>
                          by {item.userEmail}
                        </div>
                      )}
                      {item.description && item.description.length > 0 && (
                        <ul
                          style={{
                            margin: '6px 0 0',
                            paddingLeft: 16,
                            color: '#475569',
                            lineHeight: 1.5,
                          }}
                        >
                          {item.description.map((line, idx) => (
                            <li key={idx}>{line}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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

interface SortableSubtaskProps {
  subtask: Task;
  isEditing: boolean;
  editTitle: string;
  onEditChange: (value: string) => void;
  onEditStart: () => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

function SortableSubtask({
  subtask,
  isEditing,
  editTitle,
  onEditChange,
  onEditStart,
  onEditSave,
  onEditCancel,
  onToggle,
  onDelete,
}: SortableSubtaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    background: isDragging ? '#f8fafc' : 'transparent',
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 0',
        borderBottom: '1px solid #f1f5f9',
        ...style,
      }}
    >
      <span
        {...attributes}
        {...listeners}
        style={{ cursor: 'grab', color: '#cbd5e1', userSelect: 'none' }}
        title='Drag to reorder'
      >
        ☰
      </span>
      <button
        onClick={onToggle}
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
        aria-label='Toggle complete'
      >
        {subtask.isCompleted && '✓'}
      </button>
      {isEditing ? (
        <>
          <input
            value={editTitle}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onEditSave();
              if (e.key === 'Escape') onEditCancel();
            }}
            autoFocus
            style={{
              flex: 1,
              padding: '4px 6px',
              fontSize: 13,
              border: '1px solid #cbd5e1',
              borderRadius: 4,
            }}
          />
          <button
            onClick={onEditSave}
            style={{
              padding: '4px 8px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Save
          </button>
          <button
            onClick={onEditCancel}
            style={{
              padding: '4px 8px',
              background: '#e2e8f0',
              color: '#475569',
              border: 'none',
              borderRadius: 4,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <span
            style={{
              flex: 1,
              fontSize: 13,
              textDecoration: subtask.isCompleted ? 'line-through' : 'none',
              color: subtask.isCompleted ? '#94a3b8' : '#1e293b',
            }}
          >
            {subtask.title}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onEditStart}
              style={{
                border: 'none',
                background: 'none',
                color: '#2563eb',
                cursor: 'pointer',
                fontSize: 14,
              }}
              aria-label='Edit subtask'
            >
              ✏
            </button>
            <button
              onClick={onDelete}
              style={{
                border: 'none',
                background: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: 14,
              }}
              aria-label='Delete subtask'
            >
              🗑
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Helper functions for history display
function getActionColor(action: string, item?: TaskHistory): string {
  switch (action) {
    case 'created':
      return '#10b981';
    case 'completed':
      return '#10b981';
    case 'started':
      return '#f59e0b';
    case 'moved':
      if (item?.fromStatus === 'In Progress' && item?.toStatus === 'Done') {
        return '#10b981';
      }
      if (
        (!item?.fromStatus ||
          item?.fromStatus === 'Backlog' ||
          item?.fromStatus === 'Todo') &&
        item?.toStatus === 'In Progress'
      ) {
        return '#f59e0b';
      }
      return '#3b82f6';
    case 'status_changed':
      return '#6366f1';
    case 'reopened':
      return '#ef4444';
    case 'deleted':
      return '#dc2626';
    case 'subtask_added':
      return '#0ea5e9';
    default:
      return '#64748b';
  }
}

function formatAction(item: TaskHistory): string {
  switch (item.action) {
    case 'created':
      return '✨ Task created';
    case 'subtask_added':
      return '➕ Subtask added';
    case 'moved':
      if (item.fromStatus === 'In Progress' && item.toStatus === 'Done') {
        return '✅ Marked as Done';
      }
      if (
        (!item.fromStatus ||
          item.fromStatus === 'Backlog' ||
          item.fromStatus === 'Todo') &&
        item.toStatus === 'In Progress'
      ) {
        return '⏱ Start In Progress';
      }
      return `📦 Moved from ${item.fromColumnTitle || 'unknown'} → ${
        item.toColumnTitle || 'unknown'
      }`;
    case 'status_changed':
      return `🔄 Status: ${item.fromStatus || 'unknown'} → ${
        item.toStatus || 'unknown'
      }`;
    case 'started':
      return '▶️ Work started';
    case 'completed':
      return '✅ Marked as Done';
    case 'reopened':
      return '🔁 Reopened';
    case 'deleted':
      return '🗑️ Deleted';
    case 'updated':
      if (item.field === 'title') return `📝 Title updated`;
      if (item.field === 'content') return `📝 Description updated`;
      if (item.field === 'labels') return `🏷️ Labels updated`;
      return `📝 ${item.field} updated`;
    default:
      return item.action;
  }
}

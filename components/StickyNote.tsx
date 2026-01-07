'use client';
import { useState, useRef, useEffect } from 'react';

type StickyColor = 'green' | 'red' | 'yellow' | 'blue' | 'black';

interface StickyNoteProps {
  id: string;
  header: string;
  content: string;
  color: StickyColor;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  scale: number;
  onUpdate: (
    id: string,
    updates: {
      positionX?: number;
      positionY?: number;
      header?: string;
      content?: string;
    },
  ) => void;
  onDelete: (id: string) => void;
  onUploadMd: (id: string, content: string) => void;
}

const colorStyles: Record<
  StickyColor,
  { bg: string; border: string; shadow: string }
> = {
  yellow: {
    bg: '#fef68a',
    border: '#fdd835',
    shadow: 'rgba(253, 216, 53, 0.3)',
  },
  green: {
    bg: '#a7f3d0',
    border: '#10b981',
    shadow: 'rgba(16, 185, 129, 0.3)',
  },
  red: { bg: '#fca5a5', border: '#ef4444', shadow: 'rgba(239, 68, 68, 0.3)' },
  blue: { bg: '#93c5fd', border: '#3b82f6', shadow: 'rgba(59, 130, 246, 0.3)' },
  black: { bg: '#d1d5db', border: '#374151', shadow: 'rgba(55, 65, 81, 0.3)' },
};

export default function StickyNote({
  id,
  header,
  content,
  color,
  positionX,
  positionY,
  width,
  height,
  scale,
  onUpdate,
  onDelete,
  onUploadMd,
}: StickyNoteProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localPosition, setLocalPosition] = useState({
    x: positionX,
    y: positionY,
  });
  const [hasMoved, setHasMoved] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const [editHeader, setEditHeader] = useState(header);
  const [editContent, setEditContent] = useState(content);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const styles = colorStyles[color];

  // Sync local position with props when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalPosition({ x: positionX, y: positionY });
    }
  }, [positionX, positionY, isDragging]);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    setIsDragging(true);
    setHasMoved(false);
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragOffset.current = { x: localPosition.x, y: localPosition.y };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const deltaX = (e.clientX - dragStart.current.x) / scale;
    const deltaY = (e.clientY - dragStart.current.y) / scale;
    
    // Check if actually moved (more than 2 pixels)
    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      setHasMoved(true);
    }
    
    // Update local position only (no API call)
    setLocalPosition({
      x: dragOffset.current.x + deltaX,
      y: dragOffset.current.y + deltaY,
    });
  };

  const handleMouseUp = () => {
    if (isDragging && hasMoved) {
      // Save to API only when drag ends AND sticky actually moved
      onUpdate(id, {
        positionX: localPosition.x,
        positionY: localPosition.y,
      });
    }
    setIsDragging(false);
    setHasMoved(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const password = prompt('Enter password to delete:');
    if (password) {
      onDelete(id);
    }
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        onUploadMd(id, text);
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a .md file');
    }
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdate(id, { header: editHeader, content: editContent });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditHeader(header);
    setEditContent(content);
    setIsEditing(false);
  };

  // Attach/detach mouse listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <>
      <div
        className='sticky-note'
        style={{
          left: localPosition.x,
          top: localPosition.y,
          width,
          minHeight: height,
          backgroundColor: styles.bg,
          borderColor: styles.border,
          boxShadow: `0 4px 12px ${styles.shadow}`,
          cursor: isDragging ? 'grabbing' : 'default',
        }}
        onDoubleClick={handleDoubleClick}
      >
        {/* Header */}
        <div
          className='sticky-header'
          onMouseDown={handleHeaderMouseDown}
          style={{
            backgroundColor: styles.border,
            cursor: isEditing ? 'default' : 'grab',
          }}
        >
          <span className='sticky-title'>{header}</span>
          <div className='sticky-actions'>
            <button
              className='action-btn'
              onClick={handleUploadClick}
              title='Upload .md file'
            >
              +
            </button>
            <button
              className='action-btn'
              onClick={handleDelete}
              title='Delete sticky'
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className='edit-mode'>
            <input
              type='text'
              value={editHeader}
              onChange={(e) => setEditHeader(e.target.value)}
              placeholder='Header'
              className='edit-header'
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder='Content (markdown)'
              className='edit-content'
            />
            <div className='edit-actions'>
              <button onClick={handleSave} className='save-btn'>
                Save
              </button>
              <button onClick={handleCancel} className='cancel-btn'>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className='sticky-content'>
            {content || 'Double-click to edit'}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type='file'
          accept='.md'
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
      </div>

      <style jsx>{`
        .sticky-note {
          position: absolute;
          border: 2px solid;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: box-shadow 0.2s;
          user-select: none;
        }

        .sticky-note:hover {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        .sticky-header {
          padding: 8px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
          font-weight: 600;
          font-size: 14px;
        }

        .sticky-title {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sticky-actions {
          display: flex;
          gap: 4px;
        }

        .action-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 20px;
          height: 20px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.4);
        }

        .sticky-content {
          padding: 12px;
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-wrap;
          color: #333;
          max-height: 300px;
          overflow-y: auto;
        }

        .edit-mode {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .edit-header {
          width: 100%;
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 3px;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
        }

        .edit-content {
          width: 100%;
          min-height: 120px;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 3px;
          font-size: 13px;
          font-family: inherit;
          resize: vertical;
        }

        .edit-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .save-btn,
        .cancel-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 3px;
          font-size: 12px;
          cursor: pointer;
          font-weight: 500;
        }

        .save-btn {
          background: #10b981;
          color: white;
        }

        .save-btn:hover {
          background: #059669;
        }

        .cancel-btn {
          background: #e5e7eb;
          color: #374151;
        }

        .cancel-btn:hover {
          background: #d1d5db;
        }
      `}</style>
    </>
  );
}

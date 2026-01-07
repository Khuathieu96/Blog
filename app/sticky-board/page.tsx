'use client';
import { useState, useEffect, useRef } from 'react';
import StickyNote from '@/components/StickyNote';
import FloatingActionBar from '@/components/FloatingActionBar';

interface StickyNoteData {
  _id: string;
  header: string;
  content: string;
  color: 'green' | 'red' | 'yellow' | 'blue' | 'black';
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}

type StickyColor = 'green' | 'red' | 'yellow' | 'blue' | 'black';

export default function StickyBoardPage() {
  const [stickies, setStickies] = useState<StickyNoteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Pan state
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [scale, setScale] = useState(1); // Zoom level
  const panStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Fetch stickies
  const fetchStickies = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/sticky-board');
      const data = await res.json();
      setStickies(data);
    } catch (error) {
      console.error('Error fetching stickies:', error);
      showNotification('Failed to fetch stickies', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStickies();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2000);
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    panStart.current = {
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - panStart.current.x,
      y: e.clientY - panStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
  };

  // Zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(0.5, scale + delta), 3); // Limit zoom: 0.5x to 3x
    setScale(newScale);
  };

  // Sticky handlers
  const updateTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const handleUpdateSticky = async (
    id: string,
    updates: { positionX?: number; positionY?: number; header?: string; content?: string }
  ) => {
    // Clear any pending update for this sticky
    const existingTimeout = updateTimeouts.current.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Optimistic update (immediate UI feedback)
    setStickies((prev) =>
      prev.map((s) => (s._id === id ? { ...s, ...updates } : s))
    );

    // For position updates, debounce the API call
    const isPositionUpdate = updates.positionX !== undefined || updates.positionY !== undefined;
    const needsPassword = updates.header !== undefined || updates.content !== undefined;

    if (isPositionUpdate && !needsPassword) {
      // Debounce position updates by 300ms
      const timeout = setTimeout(async () => {
        try {
          await fetch('/api/sticky-board/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...updates }),
          });
          updateTimeouts.current.delete(id);
        } catch (error) {
          console.error('Failed to update sticky:', error);
          showNotification('Failed to update sticky', 'error');
          fetchStickies(); // Revert on error
        }
      }, 300);
      updateTimeouts.current.set(id, timeout);
    } else {
      // Immediate API call for content/header changes
      try {
        const password = needsPassword ? '090696' : undefined;
        await fetch('/api/sticky-board/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...updates, password }),
        });
      } catch (error) {
        console.error('Failed to update sticky:', error);
        showNotification('Failed to update sticky', 'error');
        fetchStickies(); // Revert on error
      }
    }
  };

  const handleDeleteSticky = async (id: string) => {
    const password = prompt('Enter password to delete:');
    if (!password) return;

    try {
      const res = await fetch('/api/sticky-board/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password }),
      });

      const data = await res.json();

      if (res.ok) {
        showNotification('Sticky deleted', 'success');
        setStickies((prev) => prev.filter((s) => s._id !== id));
      } else {
        showNotification(data.error || 'Failed to delete', 'error');
      }
    } catch (error) {
      console.error('Failed to delete sticky:', error);
      showNotification('Failed to delete sticky', 'error');
    }
  };

  const handleUploadMd = async (id: string, content: string) => {
    await handleUpdateSticky(id, { content });
    showNotification('Markdown uploaded', 'success');
  };

  const handleCreateSticky = async (color: StickyColor) => {
    try {
      const res = await fetch('/api/sticky-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          header: 'New Sticky',
          content: '',
          color,
          positionX: 100 + Math.random() * 300,
          positionY: 100 + Math.random() * 300,
        }),
      });

      if (res.ok) {
        const newSticky = await res.json();
        setStickies((prev) => [...prev, newSticky]);
        showNotification('Sticky created', 'success');
      } else {
        showNotification('Failed to create sticky', 'error');
      }
    } catch (error) {
      console.error('Failed to create sticky:', error);
      showNotification('Failed to create sticky', 'error');
    }
  };

  return (
    <div className='container'>
      <div className='header'>
        <h1>Sticky Board</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className='zoom-level'>{Math.round(scale * 100)}%</span>
          <span className='sticky-count'>{stickies.length} stickies</span>
        </div>
      </div>

      {/* Canvas Board - placeholder for Phase 3 */}
      <div 
        className='canvas-wrapper'
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      >
        <div 
          className='canvas'
          ref={canvasRef}
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
            cursor: isPanning ? 'grabbing' : 'grab',
          }}
        >
          {isLoading ? (
            <div className='loading'>Loading...</div>
          ) : (
            <>
              {stickies.map((sticky) => (
                <StickyNote
                  key={sticky._id}
                  id={sticky._id}
                  header={sticky.header}
                  content={sticky.content}
                  color={sticky.color}
                  positionX={sticky.positionX}
                  positionY={sticky.positionY}
                  width={sticky.width}
                  height={sticky.height}
                  scale={scale}
                  onUpdate={handleUpdateSticky}
                  onDelete={handleDeleteSticky}
                  onUploadMd={handleUploadMd}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Floating Action Bar */}
      <FloatingActionBar onCreateSticky={handleCreateSticky} />

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <style jsx>{`
        .container {
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-shrink: 0;
        }

        .header h1 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .sticky-count {
          font-size: 12px;
          color: #999;
        }

        .zoom-level {
          font-size: 12px;
          color: #666;
          font-weight: 500;
        }

        .canvas-wrapper {
          flex: 1;
          overflow: hidden;
          position: relative;
          background: white;
          width: 100%;
          height: 100%;
        }

        .canvas {
          width: 300%;
          height: 300%;
          position: relative;
          background-color: white;
          background-image: 
            linear-gradient(rgba(200, 200, 200, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(200, 200, 200, 0.3) 1px, transparent 1px);
          background-size: 20px 20px;
        }

        .loading,
        .empty,
        .placeholder {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #999;
          font-size: 14px;
          text-align: center;
        }

        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 24px;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          font-weight: 500;
          z-index: 1001;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          animation: slideIn 0.3s ease-out;
        }

        .notification.success {
          background: #4caf50;
        }

        .notification.error {
          background: #f44336;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

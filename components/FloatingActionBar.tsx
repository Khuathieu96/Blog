'use client';
import { useState, useRef, useEffect } from 'react';

type StickyColor = 'green' | 'red' | 'yellow' | 'blue' | 'black';

interface FloatingActionBarProps {
  onCreateSticky: (color: StickyColor) => void;
}

const colorOptions: { color: StickyColor; bg: string; label: string }[] = [
  { color: 'yellow', bg: '#fef68a', label: 'Yellow' },
  { color: 'green', bg: '#a7f3d0', label: 'Green' },
  { color: 'red', bg: '#fca5a5', label: 'Red' },
  { color: 'blue', bg: '#93c5fd', label: 'Blue' },
  { color: 'black', bg: '#d1d5db', label: 'Black' },
];

export default function FloatingActionBar({
  onCreateSticky,
}: FloatingActionBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const fabRef = useRef<HTMLDivElement>(null);

  // Initialize position at bottom center
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({
        x: window.innerWidth / 2 - 25, // 25px = half of button width
        y: window.innerHeight - 80, // 80px from bottom
      });
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.fab-button, .color-picker')) {
      return; // Don't drag when clicking buttons
    }
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragOffset.current = { ...position };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;
    setPosition({
      x: dragOffset.current.x + deltaX,
      y: dragOffset.current.y + deltaY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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

  const handleCreateClick = () => {
    if (!showColorPicker) {
      onCreateSticky('yellow'); // Default color
    }
  };

  const handleColorSelect = (color: StickyColor) => {
    onCreateSticky(color);
    setShowColorPicker(false);
    setIsExpanded(false);
  };

  return (
    <>
      <div
        ref={fabRef}
        className={`fab-container ${isExpanded ? 'expanded' : ''}`}
        style={{
          left: position.x,
          top: position.y,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => {
          setIsExpanded(false);
          setShowColorPicker(false);
        }}
      >
        {/* Collapsed state - Circle button */}
        {!isExpanded && <div className='fab-circle'>+</div>}

        {/* Expanded state - Action buttons */}
        {isExpanded && (
          <div className='fab-expanded'>
            <button
              className='fab-button'
              onClick={handleCreateClick}
              onMouseEnter={() => setShowColorPicker(true)}
              title='Create Sticky'
            >
              + New Sticky
            </button>

            {/* Color picker dropdown */}
            {showColorPicker && (
              <div className='color-picker'>
                {colorOptions.map(({ color, bg, label }) => (
                  <button
                    key={color}
                    className='color-option'
                    style={{ backgroundColor: bg }}
                    onClick={() => handleColorSelect(color)}
                    title={label}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .fab-container {
          position: fixed;
          z-index: 1000;
          user-select: none;
        }

        .fab-circle {
          width: 50px;
          height: 50px;
          border-radius: 25px;
          background: #171717;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 300;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
          cursor: grab;
        }

        .fab-circle:hover {
          background: #333;
          transform: scale(1.05);
        }

        .fab-expanded {
          background: #171717;
          border-radius: 25px;
          padding: 8px 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
        }

        .fab-button {
          background: transparent;
          border: none;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 4px;
          transition: background 0.2s;
          white-space: nowrap;
        }

        .fab-button:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .color-picker {
          position: absolute;
          left: 100%;
          top: 0;
          margin-left: 8px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 120px;
        }

        .color-option {
          padding: 8px 12px;
          border: 2px solid #ddd;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          color: #333;
        }

        .color-option:hover {
          border-color: #333;
          transform: translateX(4px);
        }
      `}</style>
    </>
  );
}

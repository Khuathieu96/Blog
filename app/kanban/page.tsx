'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Board {
  _id: string;
  name: string;
  slug: string;
  updatedAt: string;
}

export default function KanbanPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, getAuthHeaders, handleUnauthorized } =
    useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBoardName, setNewBoardName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin');
      return;
    }
    if (isAuthenticated) {
      fetchBoards();
    }
  }, [isAuthenticated, isLoading]);

  const fetchBoards = async () => {
    try {
      const res = await fetch('/api/kanban/board', {
        headers: getAuthHeaders(),
      });
      if (res.status === 401) {
        handleUnauthorized();
        router.push('/signin');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setBoards(data);
      }
    } catch (error) {
      console.error('Failed to fetch boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/kanban/board', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newBoardName.trim() }),
      });
      if (res.ok) {
        const board = await res.json();
        setNewBoardName('');
        router.push(`/kanban/${board.slug}`);
      }
    } catch (error) {
      console.error('Failed to create board:', error);
    } finally {
      setCreating(false);
    }
  };

  const deleteBoard = async (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this board and all its tasks?')) return;

    try {
      const res = await fetch(`/api/kanban/board/${boardId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setBoards(boards.filter((b) => b._id !== boardId));
      }
    } catch (error) {
      console.error('Failed to delete board:', error);
    }
  };

  if (isLoading || loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '1.25rem' }}>
      <h1 style={{ marginBottom: 24 }}>Kanban Boards</h1>

      {/* Create new board */}
      <form
        onSubmit={createBoard}
        style={{ marginBottom: 32, display: 'flex', gap: 12 }}
      >
        <input
          type='text'
          value={newBoardName}
          onChange={(e) => setNewBoardName(e.target.value)}
          placeholder='New board name...'
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: 14,
            border: '1px solid #ddd',
            borderRadius: 6,
          }}
        />
        <button
          type='submit'
          disabled={creating || !newBoardName.trim()}
          style={{
            padding: '10px 20px',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            opacity: creating || !newBoardName.trim() ? 0.6 : 1,
          }}
        >
          {creating ? 'Creating...' : 'Create Board'}
        </button>
      </form>

      {/* Board list */}
      {boards.length === 0 ? (
        <p style={{ color: '#666' }}>
          No boards yet. Create your first board above!
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {boards.map((board) => (
            <div
              key={board._id}
              onClick={() => router.push(`/kanban/${board.slug}`)}
              style={{
                padding: 20,
                background: '#f8f9fa',
                borderRadius: 8,
                cursor: 'pointer',
                border: '1px solid #e2e8f0',
                transition: 'box-shadow 0.2s',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <h3 style={{ margin: 0, marginBottom: 8 }}>{board.name}</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
                Updated: {new Date(board.updatedAt).toLocaleDateString()}
              </p>
              <button
                onClick={(e) => deleteBoard(board._id, e)}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#999',
                  fontSize: 18,
                }}
                title='Delete board'
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

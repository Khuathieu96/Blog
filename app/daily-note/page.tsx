'use client';
import { useState, useEffect, useRef } from 'react';

interface DailyNote {
  _id: string;
  header: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function DailyNotePage() {
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editNote, setEditNote] = useState<DailyNote | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notes
  const fetchNotes = async (searchQuery = '') => {
    try {
      setIsLoading(true);
      const url = searchQuery
        ? `/api/daily-note?search=${encodeURIComponent(searchQuery)}`
        : '/api/daily-note';
      const res = await fetch(url);
      const data = await res.json();
      setNotes(data);
    } catch (error) {
      console.error('Error fetching notes:', error);
      showNotification('Failed to fetch notes', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchNotes(search);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2000);
  };

  const handleDelete = async (note: DailyNote) => {
    const password = prompt('Enter password to delete:');
    if (!password) return;

    try {
      const res = await fetch('/api/daily-note/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: note._id, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        showNotification(data.error || 'Failed to delete', 'error');
        return;
      }

      showNotification('Note deleted', 'success');
      fetchNotes(search);
    } catch (error) {
      console.error('Error deleting note:', error);
      showNotification('Failed to delete note', 'error');
    }
  };

  const handleEdit = (note: DailyNote) => {
    setEditNote(note);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditNote(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditNote(null);
  };

  const handleSaveSuccess = () => {
    handleDialogClose();
    fetchNotes(search);
    showNotification(editNote ? 'Note updated' : 'Note created', 'success');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getPreview = (content: string) => {
    const lines = content.split('\n').filter((l) => l.trim());
    const preview = lines.slice(0, 2).join(' ');
    return preview.length > 80 ? preview.substring(0, 80) + '...' : preview;
  };

  return (
    <div className='container'>
      {/* Header */}
      <div className='header'>
        <h1>Daily Notes</h1>
        <button className='create-btn' onClick={handleCreate} title='New Note'>
          +
        </button>
      </div>

      {/* Search */}
      <div className='search-wrapper'>
        <input
          type='text'
          placeholder='Search notes...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='search-input'
        />
        {search && (
          <button className='clear-btn' onClick={() => setSearch('')}>
            ✕
          </button>
        )}
      </div>

      {/* Notes List */}
      <div className='notes-list'>
        {isLoading ? (
          <div className='loading'>Loading...</div>
        ) : notes.length === 0 ? (
          <div className='empty'>
            {search
              ? 'No notes found'
              : 'No notes yet. Create your first note!'}
          </div>
        ) : (
          notes.map((note) => (
            <div key={note._id} className='note-card'>
              <div className='note-content' onClick={() => handleEdit(note)}>
                <div className='note-header'>{note.header}</div>
                <div className='note-preview'>{getPreview(note.content)}</div>
                <div className='note-date'>{formatDate(note.createdAt)}</div>
              </div>
              <button
                className='delete-btn'
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(note);
                }}
                title='Delete'
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Create/Edit Dialog */}
      {isDialogOpen && (
        <NoteDialog
          note={editNote}
          onClose={handleDialogClose}
          onSuccess={handleSaveSuccess}
          onError={(msg) => showNotification(msg, 'error')}
        />
      )}

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .header h1 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          color: inherit;
        }

        .create-btn {
          color: #666;
          text-decoration: none;
          font-size: 18px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
          padding: 4px;
          background-color: transparent;
          border: none;
          cursor: pointer;
          line-height: 1;
        }

        .create-btn:hover {
          color: #333;
        }

        .search-wrapper {
          position: relative;
          margin-bottom: 16px;
        }

        .search-input {
          width: 100%;
          padding: 10px 40px 10px 16px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          font-family: inherit;
        }

        .search-input:focus {
          border-color: #333;
        }

        .clear-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #999;
          font-size: 14px;
          cursor: pointer;
          padding: 4px;
        }

        .notes-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          overflow-y: auto;
        }

        .loading,
        .empty {
          text-align: center;
          color: #999;
          padding: 20px;
          font-size: 14px;
        }

        .note-card {
          display: flex;
          align-items: flex-start;
          border: 1px solid #eee;
          border-radius: 6px;
          padding: 12px;
          transition: background-color 0.2s;
        }

        .note-card:hover {
          background: #fafafa;
        }

        .note-content {
          flex: 1;
          cursor: pointer;
          min-width: 0;
        }

        .note-header {
          font-weight: 600;
          font-size: 16px;
          color: inherit;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .note-preview {
          font-size: 13px;
          color: #666;
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .note-date {
          font-size: 11px;
          color: #999;
          font-style: italic;
        }

        .delete-btn {
          background: none;
          border: none;
          color: #ccc;
          font-size: 16px;
          cursor: pointer;
          padding: 4px;
          margin-left: 8px;
          transition: color 0.2s;
        }

        .delete-btn:hover {
          color: #333;
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
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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

        @media (max-width: 480px) {
          .container {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}

// Note Dialog Component
interface NoteDialogProps {
  note: DailyNote | null;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

function NoteDialog({ note, onClose, onSuccess, onError }: NoteDialogProps) {
  const [header, setHeader] = useState(note?.header || '');
  const [content, setContent] = useState(note?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [mouseDownOnOverlay, setMouseDownOnOverlay] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEditMode = !!note;

  useEffect(() => {
    // Focus on header input when dialog opens
    const timer = setTimeout(() => {
      const headerInput = document.querySelector(
        '.dialog-header-input',
      ) as HTMLInputElement;
      if (headerInput) {
        headerInput.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-resize textarea
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + 'px';
    }
  };

  const handleSave = async () => {
    if (!header.trim()) {
      onError('Header is required');
      return;
    }

    let password = '';
    if (isEditMode) {
      const pw = prompt('Enter password to save:');
      if (!pw) return;
      password = pw;
    }

    setIsSaving(true);

    try {
      const url = isEditMode ? '/api/daily-note/update' : '/api/daily-note';
      const method = isEditMode ? 'PUT' : 'POST';
      const body = isEditMode
        ? { id: note._id, header, content, password }
        : { header, content };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        onError(data.error || 'Failed to save');
        setIsSaving(false);
        return;
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving note:', error);
      onError('Failed to save note');
      setIsSaving(false);
    }
  };

  return (
    <div
      className='overlay'
      onMouseDown={() => setMouseDownOnOverlay(true)}
      onMouseUp={() => {
        if (mouseDownOnOverlay) {
          onClose();
        }
        setMouseDownOnOverlay(false);
      }}
    >
      <div
        className='dialog'
        onMouseDown={(e) => {
          e.stopPropagation();
          setMouseDownOnOverlay(false);
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dialog Header */}
        <div className='dialog-header'>
          <button className='back-btn' onClick={onClose}>
            ←
          </button>
          <span className='dialog-title'>
            {isEditMode ? 'Edit Note' : 'New Note'}
          </span>
          <button
            className='save-btn'
            onClick={handleSave}
            disabled={isSaving || !header.trim()}
          >
            {isSaving ? '...' : 'Save'}
          </button>
        </div>

        {/* Form */}
        <div className='dialog-body'>
          <input
            type='text'
            className='dialog-header-input'
            placeholder='Title'
            value={header}
            onChange={(e) => setHeader(e.target.value)}
          />
          <textarea
            ref={textareaRef}
            className='dialog-content-input'
            placeholder='Write your note... (supports Markdown)'
            value={content}
            onChange={handleContentChange}
          />
        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .dialog {
          background: white;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          border-radius: 8px;
          overflow: hidden;
          animation: slideIn 0.2s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dialog-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid #eee;
          flex-shrink: 0;
        }

        .back-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #666;
          padding: 4px;
          line-height: 1;
        }

        .back-btn:hover {
          color: #333;
        }

        .dialog-title {
          font-size: 16px;
          font-weight: 600;
          color: inherit;
        }

        .save-btn {
          background: #333;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 5px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
          font-family: inherit;
        }

        .save-btn:hover {
          background: #000;
        }

        .save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dialog-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .dialog-header-input {
          width: 100%;
          padding: 10px 0;
          border: none;
          border-bottom: 1px solid #eee;
          font-size: 16px;
          font-weight: 600;
          outline: none;
          box-sizing: border-box;
          font-family: inherit;
        }

        .dialog-header-input::placeholder {
          color: #999;
          font-weight: normal;
        }

        .dialog-content-input {
          width: 100%;
          min-height: 200px;
          padding: 10px 0;
          border: none;
          font-size: 14px;
          line-height: 1.6;
          resize: none;
          outline: none;
          font-family: inherit;
          box-sizing: border-box;
          color: inherit;
        }

        .dialog-content-input::placeholder {
          color: #999;
        }

        @media (max-width: 480px) {
          .overlay {
            padding: 0;
          }

          .dialog {
            height: 100%;
            max-height: 100vh;
            border-radius: 0;
          }

          .dialog-body {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}

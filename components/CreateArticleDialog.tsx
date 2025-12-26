'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CreateArticleDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateArticleDialog({ isOpen, onClose }: CreateArticleDialogProps) {
  const [header, setHeader] = useState('');
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.md')) {
      alert('Please upload a .md file');
      return;
    }

    setFileName(file.name);
    const text = await file.text();
    setContent(text);
    
    // Extract title from filename or first heading
    if (!header) {
      const match = text.match(/^#\s+(.+)$/m);
      if (match) {
        setHeader(match[1]);
      } else {
        setHeader(file.name.replace('.md', ''));
      }
    }
  }

  async function createArticle() {
    if (!header || !content) {
      alert('Please provide header and content');
      return;
    }

    setIsCreating(true);
    
    try {
      const res = await fetch('/api/article/create', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ header, content, tags: [] })
      });
      
      if (res.ok) {
        // Reset form
        setHeader('');
        setContent('');
        setFileName('');
        onClose();
        // Refresh the page to show new article
        router.refresh();
      } else {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Error creating article: ${error.error || 'Please try again'}`);
      }
    } catch (error) {
      console.error('Failed to create article:', error);
      alert('Failed to create article. Please check your connection and try again.');
    } finally {
      setIsCreating(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}
        onClick={onClose}
      >
        {/* Dialog */}
        <div 
          style={{
            backgroundColor: 'white',
            borderRadius: 8,
            maxWidth: 800,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: 24,
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#666',
              padding: 4,
              lineHeight: 1
            }}
          >
            ×
          </button>

          <h2 style={{ marginTop: 0, marginBottom: 20 }}>Create New Article</h2>
          
          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              Upload Markdown File:
            </label>
            <input 
              type="file" 
              accept=".md" 
              onChange={handleFileUpload}
              style={{ marginBottom: 8 }}
            />
            {fileName && <div style={{ fontSize: 14, color: '#666' }}>Loaded: {fileName}</div>}
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              Title:
            </label>
            <input 
              placeholder="Article Title" 
              value={header} 
              onChange={e=>setHeader(e.target.value)} 
              style={{ 
                width: '100%', 
                padding: 8, 
                fontSize: 16,
                border: '1px solid #ddd',
                borderRadius: 4
              }} 
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              Content (Markdown):
            </label>
            <textarea 
              placeholder="Write or paste markdown content here..." 
              value={content} 
              onChange={e=>setContent(e.target.value)} 
              style={{ 
                width: '100%', 
                height: 300, 
                padding: 8, 
                fontSize: 14,
                fontFamily: 'monospace',
                border: '1px solid #ddd',
                borderRadius: 4,
                resize: 'vertical'
              }} 
            />
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button 
              onClick={onClose}
              disabled={isCreating}
              style={{
                padding: '10px 20px',
                fontSize: 16,
                backgroundColor: '#f0f0f0',
                color: '#333',
                border: 'none',
                borderRadius: 5,
                cursor: isCreating ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              onClick={createArticle} 
              disabled={isCreating || !header || !content}
              style={{
                padding: '10px 20px',
                fontSize: 16,
                backgroundColor: isCreating || !header || !content ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: 5,
                cursor: isCreating || !header || !content ? 'not-allowed' : 'pointer',
                opacity: isCreating ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              {isCreating && (
                <span style={{ 
                  display: 'inline-block',
                  width: 16,
                  height: 16,
                  border: '2px solid #fff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
              )}
              {isCreating ? 'Creating...' : 'Create Article'}
            </button>
          </div>

          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    </>
  );
}

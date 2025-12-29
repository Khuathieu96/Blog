'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Article {
  _id: string;
  slug: string;
  header: string;
  content?: string;
  tags?: string[];
}

interface CreateArticleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  article?: Article | null;
}

interface Tag {
  _id: string;
  name: string;
  slug: string;
}

export default function CreateArticleDialog({
  isOpen,
  onClose,
  article,
}: CreateArticleDialogProps) {
  const [header, setHeader] = useState('');
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [mouseDownOnOverlay, setMouseDownOnOverlay] = useState(false);
  const router = useRouter();

  const isEditMode = !!article;

  // Fetch available tags and populate form when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchTags();

      // Populate form if editing
      if (article) {
        setHeader(article.header || '');
        setContent(article.content || '');
        setSelectedTags(article.tags || []);
        setFileName('');
      } else {
        // Reset form for create mode
        setHeader('');
        setContent('');
        setSelectedTags([]);
        setFileName('');
      }
    }
  }, [isOpen, article]);

  async function fetchTags() {
    try {
      const res = await fetch('/api/tags');
      const tags = await res.json();
      setAllTags(tags);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  }

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
      if (isEditMode && article) {
        // Update existing article
        const password = prompt('Enter password to update article:');
        if (!password) {
          setIsCreating(false);
          return;
        }

        const res = await fetch('/api/article/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: article._id,
            password,
            header,
            content,
            tags: selectedTags,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          // Reset form
          setHeader('');
          setContent('');
          setFileName('');
          setSelectedTags([]);
          setTagInput('');
          onClose();
          // Refresh the page
          router.refresh();
        } else {
          setNotification(`Error updating article: ${data.error || 'Please try again'}`);
          setTimeout(() => {
            setNotification(null);
            onClose();
          }, 2000);
        }
      } else {
        // Create new article
        const res = await fetch('/api/article/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ header, content, tags: selectedTags }),
        });

        if (res.ok) {
          // Reset form
          setHeader('');
          setContent('');
          setFileName('');
          setSelectedTags([]);
          setTagInput('');
          onClose();
          // Refresh the page to show new article
          router.refresh();
        } else {
          const error = await res
            .json()
            .catch(() => ({ error: 'Unknown error' }));
          alert(`Error creating article: ${error.error || 'Please try again'}`);
        }
      }
    } catch (error) {
      console.error('Failed to save article:', error);
      alert(
        'Failed to save article. Please check your connection and try again.',
      );
    } finally {
      setIsCreating(false);
    }
  }

  function addTag(tagName: string) {
    const trimmed = tagName.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
      setTagInput('');
      setShowSuggestions(false);
    }
  }

  function removeTag(tagName: string) {
    setSelectedTags(selectedTags.filter((t) => t !== tagName));
  }

  const filteredSuggestions = tagInput.trim()
    ? allTags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
          !selectedTags.includes(tag.name),
      )
    : [];

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tagInput.trim()) {
        addTag(tagInput);
      }
    }
  };

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
          padding: 20,
        }}
        onMouseDown={() => setMouseDownOnOverlay(true)}
        onMouseUp={() => {
          if (mouseDownOnOverlay) {
            onClose();
          }
          setMouseDownOnOverlay(false);
        }}
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
            position: 'relative',
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setMouseDownOnOverlay(false);
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
              lineHeight: 1,
            }}
          >
            ×
          </button>

          <h2 style={{ marginTop: 0, marginBottom: 20 }}>
            {isEditMode ? 'Edit Article' : 'Create New Article'}
          </h2>

          <div style={{ marginTop: 16 }}>
            <label
              style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}
            >
              Upload Markdown File:
            </label>
            <input
              type='file'
              accept='.md'
              onChange={handleFileUpload}
              style={{ marginBottom: 8 }}
            />
            {fileName && (
              <div style={{ fontSize: 14, color: '#666' }}>
                Loaded: {fileName}
              </div>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <label
              style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}
            >
              Title:
            </label>
            <input
              placeholder='Article Title'
              value={header}
              onChange={(e) => setHeader(e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                fontSize: 16,
                border: '1px solid #ddd',
                borderRadius: 4,
              }}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <label
              style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}
            >
              Content (Markdown):
            </label>
            <textarea
              placeholder='Write or paste markdown content here...'
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                width: '100%',
                height: 300,
                padding: 8,
                fontSize: 14,
                fontFamily: 'monospace',
                border: '1px solid #ddd',
                borderRadius: 4,
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <label
              style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}
            >
              Tags:
            </label>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1976d2',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: 16,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Tag Input with Autocomplete */}
            <div style={{ position: 'relative' }}>
              <input
                type='text'
                placeholder='Type to search or add new tag...'
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={handleTagInputKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                style={{
                  width: '100%',
                  padding: 8,
                  fontSize: 14,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                }}
              />

              {/* Autocomplete Dropdown */}
              {showSuggestions &&
                (filteredSuggestions.length > 0 || tagInput.trim()) && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderRadius: 4,
                      marginBottom: 4,
                      maxHeight: 200,
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 -4px 6px rgba(0,0,0,0.1)',
                    }}
                  >
                    {filteredSuggestions.length > 0
                      ? filteredSuggestions.map((tag) => (
                          <div
                            key={tag._id}
                            onClick={() => addTag(tag.name)}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f0f0f0',
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                '#f5f5f5')
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor = 'white')
                            }
                          >
                            {tag.name}
                          </div>
                        ))
                      : tagInput.trim() && (
                          <div
                            onClick={() => addTag(tagInput)}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              color: '#0070f3',
                              fontStyle: 'italic',
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                '#f5f5f5')
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor = 'white')
                            }
                          >
                            + Create new tag "{tagInput}"
                          </div>
                        )}
                  </div>
                )}
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              Press Enter to add a tag
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end',
            }}
          >
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
                cursor: isCreating ? 'not-allowed' : 'pointer',
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
                backgroundColor:
                  isCreating || !header || !content ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: 5,
                cursor:
                  isCreating || !header || !content ? 'not-allowed' : 'pointer',
                opacity: isCreating ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {isCreating && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 16,
                    height: 16,
                    border: '2px solid #fff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
              )}
              {isCreating
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
                : isEditMode
                ? 'Update Article'
                : 'Create Article'}
            </button>
          </div>

          <style jsx>{`
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
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
      </div>
      
      {/* Notification Popup */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            backgroundColor: '#f44336',
            color: 'white',
            padding: '12px 24px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1001,
            fontSize: 14,
            fontWeight: 500,
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          {notification}
        </div>
      )}
    </>
  );
}

'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreateArticleDialog from '@/components/CreateArticleDialog';

interface Article {
  _id: string;
  slug: string;
  header: string;
  content?: string;
  tags?: string[];
}

interface Tag {
  _id: string;
  name: string;
  slug: string;
}

function highlightText(text: string, query: string): React.ReactElement {
  if (!query.trim()) return <>{text}</>;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <strong
            key={i}
            style={{ backgroundColor: '#fff59d', fontWeight: 700 }}
          >
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function getContentPreview(
  article: Article,
  query: string,
): { preview: string; inContent: boolean } {
  const content = article.content || '';
  const header = article.header || '';

  // Check if search text is in header
  const inHeader = header.toLowerCase().includes(query.toLowerCase());

  if (inHeader || !query.trim()) {
    // Show first 3 lines of content
    const lines = content.split('\n').filter((line) => line.trim());
    const preview = lines.slice(0, 3).join('\n');
    return { preview, inContent: false };
  }

  // Search text is in content - find it and show 3 rows of context
  const lines = content.split('\n');
  const lowerQuery = query.toLowerCase();

  // Find the line containing the search text
  let matchLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(lowerQuery)) {
      matchLineIndex = i;
      break;
    }
  }

  if (matchLineIndex === -1) {
    // Fallback to first 3 lines
    const filteredLines = lines.filter((line) => line.trim());
    const preview = filteredLines.slice(0, 3).join('\n');
    return { preview, inContent: false };
  }

  // Get 3 rows: the line with match + context before/after
  const startLine = Math.max(0, matchLineIndex - 1);
  const endLine = Math.min(lines.length, matchLineIndex + 3);

  let contextLines = lines
    .slice(startLine, endLine)
    .filter((line) => line.trim());

  // Limit to 3 lines
  if (contextLines.length > 3) {
    contextLines = contextLines.slice(0, 3);
  }

  let preview = contextLines.join('\n');

  // Add ellipsis
  if (startLine > 0) preview = '...\n' + preview;
  if (endLine < lines.length) preview = preview + '\n...';

  // Clean up excessive markdown but keep structure
  preview = preview
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`]/g, '')
    .trim();

  return { preview, inContent: true };
}

export default function HomePageClient({ articles }: { articles: Article[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const router = useRouter();

  // Fetch all tags on mount
  useEffect(() => {
    fetchTags();
  }, []);

  async function fetchTags() {
    try {
      const res = await fetch('/api/tags');
      const tags = await res.json();
      setAllTags(tags);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  }
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/article/search?q=${encodeURIComponent(searchQuery)}&limit=20`,
        );
        const json = await res.json();
        setSearchResults(json || []);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const displayArticles = searchQuery.trim()
    ? searchResults
    : selectedTags.length > 0
    ? articles.filter((a) => a.tags?.some((tag) => selectedTags.includes(tag)))
    : articles;
  const hasQuery = searchQuery.trim().length > 0;

  function toggleTag(tagName: string) {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
    setSearchQuery('');
  }

  async function handleDeleteArticle(article: Article, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const password = prompt('Enter password to delete this article:');
    if (!password) return;

    try {
      const res = await fetch(
        `/api/article/delete?id=${article._id}&password=${encodeURIComponent(
          password,
        )}`,
        {
          method: 'DELETE',
        },
      );

      const data = await res.json();

      if (res.ok) {
        setNotification('Article deleted successfully');
        setTimeout(() => setNotification(null), 2000);
        router.refresh();
      } else {
        setNotification(`Error: ${data.error || 'Failed to delete article'}`);
        setTimeout(() => setNotification(null), 2000);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      setNotification('Failed to delete article. Please try again.');
      setTimeout(() => setNotification(null), 2000);
    }
  }

  function handleEditArticle(article: Article, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    setEditingArticle(article);
    setIsDialogOpen(true);
  }

  function handleCloseDialog() {
    setIsDialogOpen(false);
    setEditingArticle(null);
  }

  return (
    <>
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {/* Search Bar and Create Button */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            gap: 16,
            flexShrink: 0,
          }}
        >
          <input
            type='text'
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedTags([]); // Clear tag filter when searching
            }}
            placeholder='Search articles by title, tags, or content...'
            style={{
              flex: 1,
              padding: '10px 16px',
              fontSize: 14,
              border: '1px solid #ddd',
              borderRadius: 5,
              outline: 'none',
            }}
          />
        </div>

        {/* Tags List */}
        {allTags.length > 0 && (
          <div
            style={{
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: '2px solid #e0e0e0',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#666',
                  marginRight: 8,
                }}
              >
                Tags:
              </span>
              {allTags.map((tag) => (
                <button
                  key={tag._id}
                  onClick={() => toggleTag(tag.name)}
                  className={`tag-btn ${
                    selectedTags.includes(tag.name) ? 'selected' : ''
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Info */}
        {(searchQuery.trim() || selectedTags.length > 0) && (
          <div
            style={{
              marginBottom: 12,
              color: '#666',
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {isSearching
              ? 'Searching...'
              : selectedTags.length > 0
              ? `Showing ${displayArticles.length} article${
                  displayArticles.length !== 1 ? 's' : ''
                } with tags: ${selectedTags.join(', ')}`
              : `Found ${displayArticles.length} article${
                  displayArticles.length !== 1 ? 's' : ''
                }`}
          </div>
        )}

        {/* Articles List */}
        <div style={{ flex: 1, overflowY: 'auto', marginTop: 16 }}>
          {displayArticles.length > 0 ? (
            displayArticles.map((a) => {
              const { preview, inContent } = hasQuery
                ? getContentPreview(a, searchQuery)
                : { preview: '', inContent: false };

              return (
                <div
                  key={a._id}
                  style={{
                    border: '1px solid #eee',
                    padding: hasQuery ? 16 : 12,
                    borderRadius: 6,
                    marginBottom: hasQuery ? 12 : 8,
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    const buttons = e.currentTarget.querySelector(
                      '.article-actions',
                    ) as HTMLElement;
                    if (buttons) buttons.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    const buttons = e.currentTarget.querySelector(
                      '.article-actions',
                    ) as HTMLElement;
                    if (buttons) buttons.style.opacity = '0';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <a
                      href={`/article/${a.slug}`}
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: hasQuery ? '#0070f3' : 'inherit',
                        textDecoration: 'none',
                        display: 'block',
                        marginBottom: hasQuery && preview ? 8 : 0,
                        flex: 1,
                      }}
                    >
                      {hasQuery
                        ? highlightText(a.header, searchQuery)
                        : a.header}
                    </a>

                    {/* Edit and Delete Buttons */}
                    <div
                      className='article-actions'
                      style={{
                        display: 'flex',
                        gap: 4,
                        flexShrink: 0,
                        opacity: 0,
                        transition: 'opacity 0.2s',
                      }}
                    >
                      <button
                        onClick={(e) => handleEditArticle(a, e)}
                        title='Edit article'
                        className='article-icon-btn'
                      >
                        ✎
                      </button>
                      <button
                        onClick={(e) => handleDeleteArticle(a, e)}
                        title='Delete article'
                        className='article-icon-btn'
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {hasQuery && preview && (
                    <div
                      style={{
                        fontSize: 13,
                        color: '#666',
                        lineHeight: 1.6,
                        marginBottom: 8,
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'inherit',
                      }}
                    >
                      {highlightText(preview, searchQuery)}
                    </div>
                  )}

                  {a.tags && a.tags.length > 0 && (
                    <div
                      style={{
                        fontSize: 12,
                        color: '#999',
                        marginTop: hasQuery ? 0 : 8,
                        fontStyle: 'italic',
                      }}
                    >
                      # {a.tags.join(', ')}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
              {searchQuery.trim() ? 'No articles found' : 'No articles yet'}
            </div>
          )}
        </div>
      </div>

      <CreateArticleDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        article={editingArticle}
      />

      {/* Notification Popup */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            backgroundColor:
              notification.toLowerCase().includes('error') ||
              notification.toLowerCase().includes('failed') ||
              notification.toLowerCase().includes('invalid')
                ? '#f44336'
                : '#4caf50',
            color: 'white',
            padding: '12px 24px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            fontSize: 14,
            fontWeight: 500,
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          {notification}
        </div>
      )}

      <style jsx>{`
        .tag-btn {
          padding: 4px 8px;
          font-size: 11px;
          border-radius: 12px;
          border: 1px solid transparent;
          outline: 1px solid #ddd;
          outline-offset: -1px;
          background-color: white;
          color: #666;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          box-sizing: border-box;
          font-family: inherit;
        }
        .tag-btn:hover:not(.selected) {
          background-color: #f5f5f5;
        }
        .tag-btn.selected {
          border: 1px solid #0070f3;
          outline: none;
          background-color: #e3f2fd;
          color: #0070f3;
        }
        .article-icon-btn {
          padding: 4px;
          background-color: transparent;
          color: #666;
          border: none;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }
        .article-icon-btn:hover {
          color: #333;
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
    </>
  );
}

'use client'
import { useState, useEffect } from 'react';
import CreateArticleDialog from '@/components/CreateArticleDialog';

interface Article {
  _id: string;
  slug: string;
  header: string;
  content?: string;
  tags?: string[];
}

function highlightText(text: string, query: string): JSX.Element {
  if (!query.trim()) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <strong key={i} style={{ backgroundColor: '#fff59d', fontWeight: 700 }}>{part}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function getContentPreview(article: Article, query: string): { preview: string; inContent: boolean } {
  const content = article.content || '';
  const header = article.header || '';
  
  // Check if search text is in header
  const inHeader = header.toLowerCase().includes(query.toLowerCase());
  
  if (inHeader || !query.trim()) {
    // Show first 3 lines of content
    const lines = content.split('\n').filter(line => line.trim());
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
    const filteredLines = lines.filter(line => line.trim());
    const preview = filteredLines.slice(0, 3).join('\n');
    return { preview, inContent: false };
  }
  
  // Get 3 rows: the line with match + context before/after
  const startLine = Math.max(0, matchLineIndex - 1);
  const endLine = Math.min(lines.length, matchLineIndex + 3);
  
  let contextLines = lines.slice(startLine, endLine).filter(line => line.trim());
  
  // Limit to 3 lines
  if (contextLines.length > 3) {
    contextLines = contextLines.slice(0, 3);
  }
  
  let preview = contextLines.join('\n');
  
  // Add ellipsis
  if (startLine > 0) preview = '...\n' + preview;
  if (endLine < lines.length) preview = preview + '\n...';
  
  // Clean up excessive markdown but keep structure
  preview = preview.replace(/^#{1,6}\s+/gm, '').replace(/[*_`]/g, '').trim();
  
  return { preview, inContent: true };
}

export default function HomePageClient({ articles }: { articles: Article[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/article/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
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

  const displayArticles = searchQuery.trim() ? searchResults : articles;
  const hasQuery = searchQuery.trim().length > 0;

  return (
    <>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16 }}>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles by title, tags, or content..."
            style={{
              flex: 1,
              padding: '10px 16px',
              fontSize: 16,
              border: '1px solid #ddd',
              borderRadius: 5,
              outline: 'none'
            }}
          />
          <button 
            onClick={() => setIsDialogOpen(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Create Article
          </button>
        </div>

        {searchQuery.trim() && (
          <div style={{ marginBottom: 12, color: '#666', fontSize: 14 }}>
            {isSearching ? (
              'Searching...'
            ) : (
              `Found ${displayArticles.length} article${displayArticles.length !== 1 ? 's' : ''}`
            )}
          </div>
        )}

        <div style={{marginTop:16}}>
          {displayArticles.length > 0 ? (
            displayArticles.map((a) => {
              const { preview, inContent } = hasQuery ? getContentPreview(a, searchQuery) : { preview: '', inContent: false };
              
              return (
                <div key={a._id} style={{border:'1px solid #eee', padding: hasQuery ? 16 : 12, borderRadius:6, marginBottom: hasQuery ? 12 : 8}}>
                  <a 
                    href={`/article/${a.slug}`} 
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: hasQuery ? '#0070f3' : 'inherit',
                      textDecoration: 'none',
                      display: 'block',
                      marginBottom: hasQuery && preview ? 8 : 0
                    }}
                  >
                    {hasQuery ? highlightText(a.header, searchQuery) : a.header}
                  </a>
                  
                  {hasQuery && preview && (
                    <div style={{
                      fontSize: 14,
                      color: '#666',
                      lineHeight: 1.6,
                      marginBottom: 8,
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'inherit'
                    }}>
                      {highlightText(preview, searchQuery)}
                    </div>
                  )}
                  
                  {a.tags && a.tags.length > 0 && (
                    <div style={{fontSize: hasQuery ? 13 : 14, color: hasQuery ? '#999' : '#666', marginTop: hasQuery ? 0 : 8}}>
                      {a.tags.join(', ')}
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
        onClose={() => setIsDialogOpen(false)} 
      />
    </>
  );
}

'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePage() {
  const [header, setHeader] = useState('');
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
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

    const res = await fetch('/api/article/create', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ header, content, tags: [] })
    });
    if (res.ok) router.push('/');
    else alert('Error creating');
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1>Create Article</h1>
      
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
          style={{ width: '100%', padding: 8, fontSize: 16 }} 
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
            fontFamily: 'monospace'
          }} 
        />
      </div>

      <button 
        onClick={createArticle} 
        style={{
          marginTop: 16,
          padding: '10px 20px',
          fontSize: 16,
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: 5,
          cursor: 'pointer'
        }}
      >
        Create Article
      </button>
    </div>
  )
}

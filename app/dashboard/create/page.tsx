'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePage() {
  const [header, setHeader] = useState('');
  const [content, setContent] = useState('');
  const router = useRouter();

  async function createArticle() {
    const res = await fetch('/api/article/create', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ header, content, tags: [] })
    });
    if (res.ok) router.push('/');
    else alert('Error creating');
  }

  return (
    <div>
      <h1>Create Article</h1>
      <input placeholder="Header" value={header} onChange={e=>setHeader(e.target.value)} style={{width:'100%',padding:8}} />
      <textarea placeholder="Content (HTML)" value={content} onChange={e=>setContent(e.target.value)} style={{width:'100%',height:200,marginTop:8}} />
      <button onClick={createArticle} style={{marginTop:8}}>Save</button>
    </div>
  )
}

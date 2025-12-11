'use client'
import { useState, useEffect } from 'react';

export default function SearchBar() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  useEffect(() => {
    if (!q) return setResults([]);
    const t = setTimeout(async () => {
      const res = await fetch(`/api/article/search?q=${encodeURIComponent(q)}&limit=3`);
      const json = await res.json();
      setResults(json || []);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search header, tag, content" style={{padding:8,width:'60%'}} />
      <div style={{marginTop:8}}>
        {results.map(r => (
          <div key={r._id} style={{border:'1px solid #eee', padding:8, marginBottom:6}}>
            <a href={`/article/${r.slug}`}>{r.header}</a>
            <div style={{fontSize:12, color:'#666'}}>{r.tags?.join(', ')}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

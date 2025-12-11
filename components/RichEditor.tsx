'use client'
import { useState } from 'react';

export default function RichEditor({ value, onChange }: { value?: string, onChange?: (v:string)=>void }) {
  const [v, setV] = useState(value || '');
  return (
    <div>
      <textarea value={v} onChange={e=>{ setV(e.target.value); onChange?.(e.target.value) }} style={{width:'100%',height:200}} />
      <div style={{marginTop:8}}>Tip: paste HTML here or integrate TipTap later.</div>
    </div>
  )
}

'use client'
import Link from 'next/link';
export default function Navbar(){
  return (
    <nav style={{padding:12, borderBottom:'1px solid #eee'}}>
      <Link href="/">Home</Link> | <Link href="/me">About</Link> | <Link href="/dashboard">Dashboard</Link>
    </nav>
  )
}

import Link from 'next/link';

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard (Admin)</h1>
      <div style={{marginTop:12}}>
        <Link href="/dashboard/create">Create New Article</Link>
      </div>
      <div style={{marginTop:12}}>
        <p>List & manage your articles here (implementation: fetch /api/article/search with no q)</p>
      </div>
    </div>
  )
}

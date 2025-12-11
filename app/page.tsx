import { connectDB } from "@/lib/mongoose";
import { Article } from "@/models/Article";

export default async function Home() {
  await connectDB();
  const articles = await Article.find().sort({ createdAt: -1 }).limit(20).lean();

  return (
    <div>
      <h1>Latest Articles</h1>
      <div style={{marginTop:16}}>
        {articles.map((a: any) => (
          <div key={a._id} style={{border:'1px solid #eee', padding:12, borderRadius:6, marginBottom:8}}>
            <a href={`/article/${a.slug}`} style={{fontSize:18,fontWeight:600}}>{a.header}</a>
            <div style={{marginTop:8}}>{a.tags?.join(', ')}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

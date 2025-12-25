import { connectDB } from '@/lib/mongoose';
import { Article, IArticle } from '@/models/Article';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './markdown.css';

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  await connectDB();
  const art = await Article.findOne({ slug: params.slug }).lean<IArticle>();
  if (!art) return <div>Not found</div>;

  return (
    <article style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontSize: '2.5em', marginBottom: 16 }}>{art.header}</h1>
      
      <div style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
        {art.createdAt && new Date(art.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </div>

      <div className="markdown-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {art.content}
        </ReactMarkdown>
      </div>

      {art.tags && art.tags.length > 0 && (
        <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #eee' }}>
          <strong>Tags:</strong> {art.tags.map(tag => (
            <span 
              key={tag}
              style={{
                display: 'inline-block',
                backgroundColor: '#f0f0f0',
                padding: '4px 12px',
                margin: '4px',
                borderRadius: 4,
                fontSize: 14
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

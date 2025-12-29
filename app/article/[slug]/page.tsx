import { connectDB } from '@/lib/mongoose';
import { Article, IArticle } from '@/models/Article';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './markdown.css';
import ArticleHeader from './ArticleHeader';

// Force dynamic rendering for new articles to appear immediately
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connectDB();
  const { slug } = await params;
  const art = await Article.findOne({ slug }).lean<IArticle>();
  if (!art) return <div>Not found</div>;

  return (
    <article
      style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: 20,
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <ArticleHeader article={JSON.parse(JSON.stringify(art))} />

      <div style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>
        {art.createdAt &&
          new Date(art.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
      </div>

      <div className='markdown-content'>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{art.content}</ReactMarkdown>
      </div>

      {art.tags && art.tags.length > 0 && (
        <div
          style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #eee' }}
        >
          <strong>Tags:</strong>{' '}
          {art.tags.map((tag) => (
            <span
              key={tag}
              style={{
                display: 'inline-block',
                backgroundColor: '#f0f0f0',
                padding: '4px 12px',
                margin: '4px',
                borderRadius: 4,
                fontSize: 13,
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

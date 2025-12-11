import { connectDB } from '@/lib/mongoose';
import { Article, IArticle } from '@/models/Article';

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  await connectDB();
  const art = await Article.findOne({ slug: params.slug }).lean<IArticle>();
  if (!art) return <div>Not found</div>;

  return (
    <div>
      <h1>{art.header}</h1>
      <div
        style={{ marginTop: 12 }}
        dangerouslySetInnerHTML={{ __html: art.content }}
      />
      <div style={{ marginTop: 12 }}>Tags: {art.tags?.join(', ')}</div>
    </div>
  );
}

'use client';
import ArticleActions from './ArticleActions';

interface Article {
  _id: string;
  slug: string;
  header: string;
  content?: string;
  tags?: string[];
}

export default function ArticleHeader({ article }: { article: Article }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
      }}
      onMouseEnter={(e) => {
        const buttons = e.currentTarget.querySelector(
          '.article-actions',
        ) as HTMLElement;
        if (buttons) buttons.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        const buttons = e.currentTarget.querySelector(
          '.article-actions',
        ) as HTMLElement;
        if (buttons) buttons.style.opacity = '0';
      }}
    >
      <h1 style={{ fontSize: '1.8em', margin: 0, flex: 1 }}>
        {article.header}
      </h1>
      <ArticleActions article={article} />
    </div>
  );
}

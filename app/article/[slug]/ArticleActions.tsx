'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import CreateArticleDialog from '@/components/CreateArticleDialog';

interface Article {
  _id: string;
  slug: string;
  header: string;
  content?: string;
  tags?: string[];
}

export default function ArticleActions({ article }: { article: Article }) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  async function handleDelete() {
    const password = prompt('Enter password to delete this article:');
    if (!password) return;

    try {
      const res = await fetch(
        `/api/article/delete?id=${article._id}&password=${encodeURIComponent(
          password,
        )}`,
        {
          method: 'DELETE',
        },
      );

      const data = await res.json();

      if (res.ok) {
        setNotification('Article deleted successfully');
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 2000);
      } else {
        setNotification(`Error: ${data.error || 'Failed to delete article'}`);
        setTimeout(() => setNotification(null), 2000);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      setNotification('Failed to delete article. Please try again.');
      setTimeout(() => setNotification(null), 2000);
    }
  }

  function handleEdit() {
    setIsEditDialogOpen(true);
  }

  return (
    <>
      <div
        className='article-actions'
        style={{
          display: 'flex',
          gap: 4,
          flexShrink: 0,
          marginLeft: 16,
          opacity: 0,
          transition: 'opacity 0.2s',
        }}
      >
        <button onClick={handleEdit} title='Edit article' className='icon-btn'>
          ✎
        </button>
        <button
          onClick={handleDelete}
          title='Delete article'
          className='icon-btn'
        >
          ✕
        </button>
      </div>

      <CreateArticleDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        article={article}
      />

      {/* Notification Popup */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            backgroundColor:
              notification.toLowerCase().includes('error') ||
              notification.toLowerCase().includes('failed') ||
              notification.toLowerCase().includes('invalid')
                ? '#f44336'
                : '#4caf50',
            color: 'white',
            padding: '12px 24px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            fontSize: 14,
            fontWeight: 500,
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          {notification}
        </div>
      )}

      <style jsx>{`
        .icon-btn {
          padding: 4px;
          background-color: transparent;
          color: #666;
          border: none;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }
        .icon-btn:hover {
          color: #333;
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

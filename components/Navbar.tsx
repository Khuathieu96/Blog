'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import CreateArticleDialog from './CreateArticleDialog';

export default function Navbar() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <>
      <nav
        style={{
          padding: 12,
          borderBottom: '1px solid #eee',
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href='/' className='nav-icon' title='My Blog'>
            Home
          </Link>
          {isAuthenticated && (
            <>
              <Link href='/daily-note' className='nav-icon' title='Daily Notes'>
                Note
              </Link>
              <Link
                href='/registers'
                className='nav-icon'
                title='Registration Requests'
              >
                Registers
              </Link>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {isAuthenticated && (
            <button
              onClick={() => setIsDialogOpen(true)}
              className='nav-icon'
              title='Create Article'
            >
              +
            </button>
          )}
          <Link href='/me' className='nav-icon' title='About Me'>
            Me
          </Link>
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className='nav-icon'
              title='Sign Out'
            >
              🚪
            </button>
          ) : (
            <Link href='/signin' className='nav-icon' title='Sign In'>
              Sign in
            </Link>
          )}
        </div>
      </nav>

      <CreateArticleDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        article={null}
      />

      <style jsx>{`
        .nav-icon {
          color: #666;
          text-decoration: none;
          font-size: 18px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
          padding: 4px;
          background-color: transparent;
          border: none;
          cursor: pointer;
          line-height: 1;
        }
        .nav-icon:hover {
          color: #333;
        }
      `}</style>
    </>
  );
}

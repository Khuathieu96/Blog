'use client';
import Link from 'next/link';
import { useState } from 'react';
import CreateArticleDialog from './CreateArticleDialog';

export default function Navbar() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
          <Link href='/daily-note' className='nav-icon' title='Daily Notes'>
            Note
          </Link>
          <Link href='/sticky-board' className='nav-icon' title='Sticky Board'>
            Stickies
          </Link>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <button
            onClick={() => setIsDialogOpen(true)}
            className='nav-icon'
            title='Create Article'
          >
            +
          </button>
          <Link href='/me' className='nav-icon' title='About Me'>
            Me
          </Link>
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

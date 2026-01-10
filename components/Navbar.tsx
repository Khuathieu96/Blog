'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import CreateArticleDialog from './CreateArticleDialog';

export default function Navbar() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

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
            <Link href='/daily-note' className='nav-icon' title='Daily Notes'>
              Note
            </Link>
          )}
          {isAuthenticated && (
            <Link href='/kanban' className='nav-icon' title='Kanban Boards'>
              Kanban
            </Link>
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
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className='nav-icon'
                title='Menu'
              >
                👤
              </button>
              {isDropdownOpen && (
                <div className='dropdown-menu'>
                  <button
                    onClick={() => {
                      router.push('/registers');
                      setIsDropdownOpen(false);
                    }}
                    className='dropdown-item'
                  >
                    Registers
                  </button>
                  <button onClick={handleLogout} className='dropdown-item'>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
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
        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: white;
          border: 1px solid #eee;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          min-width: 150px;
          overflow: hidden;
          z-index: 1000;
        }
        .dropdown-item {
          display: block;
          width: 100%;
          padding: 12px 16px;
          text-align: left;
          background: none;
          border: none;
          color: #333;
          font-size: 14px;
          font-family: inherit;
          cursor: pointer;
          transition: background-color 0.2s;
          text-decoration: none;
          border-bottom: 1px solid #f0f0f0;
          box-sizing: border-box;
          line-height: 1.5;
        }
        .dropdown-item:last-child {
          border-bottom: none;
        }
        .dropdown-item:hover {
          background-color: #f5f5f5;
        }
      `}</style>
    </>
  );
}

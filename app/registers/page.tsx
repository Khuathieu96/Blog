'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Registration {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function RegistersPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, getAuthHeaders } = useAuth();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch registration requests - only if authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchRegistrations();
    }
  }, [isAuthenticated, authLoading]);

  async function fetchRegistrations() {
    if (!isAuthenticated) return; // Don't fetch if not authenticated
    
    try {
      const res = await fetch('/api/register', {
        headers: getAuthHeaders()
      });
      
      // Check for auth errors
      if (res.status === 401) {
        router.push('/signin');
        return;
      }
      
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data);
      }
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Show loading while checking authentication
  if (authLoading) {
    return null;
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className='container'>
      <div className='header'>
        <h1>Registration Requests</h1>
        <p className='count'>{registrations.length} pending requests</p>
      </div>

      {isLoading ? (
        <div className='loading'>Loading...</div>
      ) : registrations.length === 0 ? (
        <div className='empty'>No registration requests yet.</div>
      ) : (
        <div className='registrations-list'>
          {registrations.map((reg) => (
            <div key={reg._id} className='registration-card'>
              <div className='reg-info'>
                <div className='reg-name'>{reg.name}</div>
                <div className='reg-email'>{reg.email}</div>
                <div className='reg-date'>
                  {new Date(reg.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .header {
          margin-bottom: 32px;
        }

        h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 600;
          color: #171717;
        }

        .count {
          margin: 0;
          font-size: 14px;
          color: #666;
        }

        .loading,
        .empty {
          text-align: center;
          padding: 40px;
          color: #666;
          font-size: 14px;
        }

        .registrations-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .registration-card {
          padding: 20px;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          background: white;
          transition: all 0.2s;
        }

        .registration-card:hover {
          border-color: #d4d4d4;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .reg-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .reg-name {
          font-size: 16px;
          font-weight: 600;
          color: #171717;
        }

        .reg-email {
          font-size: 14px;
          color: #666;
        }

        .reg-date {
          font-size: 13px;
          color: #999;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}

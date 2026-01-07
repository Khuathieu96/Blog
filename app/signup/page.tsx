'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration request failed');
        return;
      }

      // Show success message
      setSuccess(
        'Registration request submitted successfully! You will be notified once approved.',
      );
      setName('');
      setEmail('');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return null; // Don't render while redirecting
  }

  return (
    <div className='container'>
      <div className='form-wrapper'>
        <h1>Request Registration</h1>
        <p className='description'>
          This is a private application. Submit your information to request
          access.
        </p>

        <form onSubmit={handleSubmit}>
          <div className='input-group'>
            <label htmlFor='name'>Name</label>
            <input
              id='name'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Enter your name'
              required
            />
          </div>

          <div className='input-group'>
            <label htmlFor='email'>Email</label>
            <input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='Enter your email'
              required
            />
          </div>

          {error && <div className='error'>{error}</div>}
          {success && <div className='success'>{success}</div>}

          <button type='submit' className='submit-btn' disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Request Registration'}
          </button>
        </form>

        <p className='switch-text'>
          Already have an account?{' '}
          <Link href='/signin' className='link'>
            Sign In
          </Link>
        </p>
      </div>

      <style jsx>{`
        .container {
          min-height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .form-wrapper {
          width: 100%;
          max-width: 400px;
          padding: 32px;
          border: 1px solid #eee;
          border-radius: 8px;
          background: white;
        }

        h1 {
          margin: 0 0 12px 0;
          font-size: 24px;
          font-weight: 600;
          text-align: center;
        }

        .description {
          margin: 0 0 24px 0;
          font-size: 14px;
          color: #666;
          text-align: center;
          line-height: 1.5;
        }

        .input-group {
          margin-bottom: 16px;
        }

        label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }

        input:focus {
          outline: none;
          border-color: #333;
        }

        .error {
          margin-bottom: 16px;
          padding: 10px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #dc2626;
          font-size: 13px;
        }

        .success {
          margin-bottom: 16px;
          padding: 10px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          color: #15803d;
          font-size: 13px;
        }

        .submit-btn {
          width: 100%;
          padding: 12px;
          background: #171717;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .submit-btn:hover:not(:disabled) {
          background: #333;
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .switch-text {
          margin-top: 20px;
          text-align: center;
          font-size: 14px;
          color: #666;
        }

        .link {
          color: #0070f3;
          text-decoration: none;
        }

        .link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

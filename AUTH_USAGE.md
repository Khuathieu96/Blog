# API Authentication Usage Guide

## Overview
All protected API endpoints now require authentication via Bearer token.

## Client-Side Usage

### 1. Get auth headers from context
```typescript
import { useAuth } from '@/contexts/AuthContext';

const { getAuthHeaders } = useAuth();
```

### 2. Use in fetch calls
```typescript
// GET request
const res = await fetch('/api/daily-note', {
  headers: getAuthHeaders()
});

// POST request
const res = await fetch('/api/daily-note', {
  method: 'POST',
  headers: getAuthHeaders(),
  body: JSON.stringify({ header, content })
});

// DELETE request
const res = await fetch('/api/daily-note/delete', {
  method: 'DELETE',
  headers: getAuthHeaders(),
  body: JSON.stringify({ id })
});
```

### 3. Handle 401 errors
```typescript
const res = await fetch('/api/daily-note', {
  headers: getAuthHeaders()
});

if (res.status === 401) {
  // Redirect to login
  router.push('/signin');
  return;
}
```

## Protected API Routes

All the following routes require authentication:

### Daily Notes
- GET `/api/daily-note` - List notes
- POST `/api/daily-note` - Create note
- PUT `/api/daily-note/update` - Update note
- DELETE `/api/daily-note/delete` - Delete note

### Articles
- POST `/api/article/create` - Create article
- PUT `/api/article/update` - Update article
- DELETE `/api/article/delete` - Delete article

### Registration Requests
- GET `/api/register` - List registration requests (admin only)

## Security
- Tokens are stored in localStorage as 'authToken'
- Tokens expire after 24 hours
- Tokens are validated on every protected API call
- Invalid/expired tokens return 401 Unauthorized

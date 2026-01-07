# Your Blog - Skeleton

This is a minimal skeleton for a personal blog using Next.js (App Router), TypeScript, MongoDB (Mongoose), NextAuth, and Cloudinary.

## Quick start

1. Copy `.env.example` to `.env` and fill values (MONGODB_URI, GOOGLE_CLIENT_ID, etc.)
2. `npm install`
3. `npm run dev`

Notes:

- Set `ADMIN_EMAIL` in environment to restrict admin access.
- Cloudinary upload expects base64 in `/api/upload`.

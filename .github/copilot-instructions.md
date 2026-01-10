# Copilot Instructions for Blog Skeleton

## Architecture Overview

This is a Next.js 15 (App Router) blog with TypeScript, MongoDB (Mongoose), and dual authentication systems:

- **NextAuth (Google OAuth)**: Used only for admin-gated routes via middleware (e.g., `/dashboard/*`). Admin is determined by `ADMIN_EMAIL` env variable.
- **Custom JWT-like Auth**: Used for all protected API endpoints. Client stores token in localStorage, sends via `Authorization: Bearer <token>` header. Token format: `base64(email:timestamp)`, validated in `lib/auth-utils.ts`.

### Key Data Models

- **Article**: Blog posts with `slug` (generated using nanoid), `tags[]`, markdown `content`, and Cloudinary `images[]`
- **DailyNote**: Personal notes organized into folders (references `NoteFolder`)
- **Tag**: Auto-created on article creation if not exists (case-insensitive matching)
- **User**: For custom auth system (email/password with bcrypt)
- **NoteFolder**: Collapsible folders for organizing daily notes
- **KanbanBoard**: Boards with `owner` and `members[]` for sharing. Uses same slug pattern as articles.
- **KanbanColumn**: Columns belong to a board, ordered by `order` field, with optional `color`
- **KanbanTask**: Tasks with markdown `content`, `parent` for subtasks, `labels[]`, `dueDate`, `isCompleted`

### Important Patterns

**Slug Generation**: Articles use `header-{6-char-nanoid}` pattern. See `app/api/article/create/route.ts` lines 54-56.

**Tag Management**: Tags are automatically created when referenced in articles. Case-insensitive matching prevents duplicates. Check `app/api/article/create/route.ts` lines 21-51.

**Auth Headers**: Client-side code must use `getAuthHeaders()` from `AuthContext`. Example:

```typescript
const { getAuthHeaders } = useAuth();
const res = await fetch('/api/daily-note', { headers: getAuthHeaders() });
```

**API Auth Validation**: All protected routes use `validateAuth(req)` from `lib/auth-utils.ts`. Returns `{ isValid: boolean, userId?: string, email?: string }`. Tokens expire after 24 hours.

**Mongoose Connection**: Always call `connectDB()` from `lib/mongoose.ts` at the start of API routes. Uses `models.ModelName || model()` pattern to prevent overwriting in dev hot-reload.

## Development Workflows

**Start Development**:

```bash
docker-compose up -d  # Start MongoDB
npm run dev           # Start Next.js on localhost:3000
```

**Seed Initial Data**:

```bash
node scripts/seed-tags.js  # Populate initial tags
```

**Environment Variables** (see `.env.example`):

- `MONGODB_URI`: MongoDB connection string (default: `mongodb://localhost:27017/blog`)
- `ADMIN_EMAIL`: Email for Google OAuth admin access
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: For NextAuth
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`: NextAuth config
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: For image uploads

## Key Files

- **Authentication**: `contexts/AuthContext.tsx` (client), `lib/auth-utils.ts` (server), `AUTH_USAGE.md` (guide)
- **DB Connection**: `lib/mongoose.ts` - single connection reused across requests
- **Models**: All in `models/` directory with TypeScript interfaces
- **API Routes**: Follow pattern in `app/api/**/route.ts` - use `validateAuth()` for protected endpoints
- **Article Display**: `app/article/[slug]/page.tsx` uses `react-markdown` with `remark-gfm` for rendering
- **Kanban Board**: `app/kanban/[slug]/page.tsx` with drag-drop via `@dnd-kit/core`. Components in same directory.

## Conventions

**Client Components**: Use `'use client'` directive for components using hooks, localStorage, or browser APIs. Most page components are server components by default.

**Force Dynamic Rendering**: Article pages use `export const dynamic = 'force-dynamic'` to show new content immediately without cache.

**Type Safety**: Models export both Mongoose Document interface (e.g., `IArticle`) and model. Use `.lean<IArticle>()` for plain objects in server components.

**Error Handling**: Protected APIs return `401 Unauthorized` for invalid auth. Client should redirect to `/signin` on 401.

**Markdown Content**: Articles support GitHub Flavored Markdown (tables, strikethrough, etc.) via `remark-gfm`.

## Common Tasks

**Adding a Protected API Route**:

1. Import `validateAuth` from `@/lib/auth-utils`
2. Call `const auth = await validateAuth(req)` at route start
3. Return `401` if `!auth.isValid`
4. Use `auth.userId` or `auth.email` for user-specific operations

**Creating New Models**:

1. Define TypeScript interface extending `Document`
2. Create Mongoose Schema with `{ type: ..., required: ..., default: ... }`
3. Export: `models.ModelName || model<IModelName>("ModelName", schema)`
4. Add `updatedAt` pre-save hook if needed (see `models/DailyNote.ts`)

**Image Uploads**: POST to `/api/upload` with `{ image: base64String }`. Returns `{ url: cloudinaryUrl }`. Images stored in `images[]` array on Article model.

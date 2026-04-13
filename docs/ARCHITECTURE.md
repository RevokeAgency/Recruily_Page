# RECRUILY Backend Architecture

## Data Flow

### Candidates

```
Client Component (use-candidates hook)
  ↓ fetch("/api/candidates", { credentials: "include" })
  ↓   — browser sends Supabase session cookies automatically
Server Route (/api/candidates/route.ts)
  ↓ createServerSupabaseClient() → reads cookies → identifies user
  ↓ createAdminClient() → service role → gets org_id from organisations table
  ↓ queries candidates WHERE organisation_id = org.id
Supabase Database
  ↓ returns only rows belonging to this org
```

### Jobs

```
Client Component (use-jobs hook)
  ↓ fetch("/api/jobs", { credentials: "include" })
Server Route (/api/jobs/route.ts)
  ↓ createServerSupabaseClient() → identifies user
  ↓ createAdminClient() → gets org, queries jobs
Supabase Database
```

## Authentication

| Step | Mechanism |
|------|-----------|
| Sign up | `supabase.auth.signUp()` — Supabase sends confirmation email |
| Sign in | `supabase.auth.signInWithPassword()` — sets session cookies |
| Session persistence | Supabase SSR cookies (httpOnly, SameSite) |
| API auth | `createServerSupabaseClient()` reads cookies server-side |
| Admin queries | `createAdminClient()` with service role key (server-only) |

## Supabase Clients (`lib/supabase.ts`)

| Export | Where used | Why |
|--------|-----------|-----|
| `supabase` | Client Components, hooks | Browser singleton with `persistSession: true` |
| `createServerSupabaseClient()` | API routes, Server Actions | Reads request cookies, identifies session user |
| `createAdminClient()` | API routes only | Service role — bypasses RLS for org-scoped queries |

**Rules:**
- `createAdminClient()` is **never** imported in client-side code
- `createServerSupabaseClient()` must be **awaited** (uses `await cookies()` internally)
- `supabase` singleton is safe for browser auth methods (`signIn`, `signOut`, `onAuthStateChange`)

## API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/candidates` | GET | session cookies | List org candidates |
| `/api/candidates` | POST | session cookies | Save parsed CV candidates |
| `/api/candidates` | PUT | session cookies | Update candidate |
| `/api/candidates` | DELETE | session cookies | Delete candidate |
| `/api/jobs` | GET | session cookies | List org jobs |
| `/api/jobs` | POST | session cookies | Create job posting |
| `/api/jobs` | PUT | session cookies | Update job (by body id) |
| `/api/jobs` | DELETE | session cookies | Delete job (by ?id=) |
| `/api/jobs/[id]` | GET | none (public) | Get single job |
| `/api/jobs/[id]` | PUT | session cookies | Update single job |
| `/api/jobs/[id]` | DELETE | session cookies | Delete single job |
| `/api/matches` | GET | — | List matches |
| `/api/matches` | PATCH | — | Update match status |
| `/api/organisations` | GET | session cookies | Get user's org |
| `/api/organisations` | POST | session cookies | Create org on signup |
| `/api/invite-candidate` | POST | — | Create candidate+match |

## Why Cookies Beat Bearer Tokens

The old approach passed `Authorization: Bearer <token>` from the browser hook. This had two failure modes:

1. **Token expiry** — the session token rotates; if the hook captured a stale token before rotation, the API rejected it with 401
2. **Race condition** — on page load, `getSession()` was async, so the token was sometimes `undefined` when the fetch fired

Cookies are set and refreshed automatically by the Supabase SSR client. The server reads them via `createServerSupabaseClient()` which calls `cookies()` from Next.js — always fresh, never stale.

## Organisation Scoping

Every user belongs to an `organisations` row via `owner_id = auth.uid()`. All data (candidates, jobs, matches) has an `organisation_id` column.

API routes resolve the org like this:

```typescript
const adminClient = createAdminClient()
const { data: org } = await adminClient
  .from("organisations")
  .select("id")
  .eq("owner_id", user.id)
  .single()
```

The service role key bypasses RLS so this lookup always works. Data queries are then filtered by `org.id`, enforcing per-org isolation.

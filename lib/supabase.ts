import { createClient } from "@supabase/supabase-js"
import { isSupabaseConfigured } from "./env"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ─── Browser singleton (anon key, persists session) ───────────────────────────
// Used in client components and hooks for auth.getSession(), auth.onAuthStateChange(), etc.

function createBrowserClient() {
  if (!isSupabaseConfigured()) {
    return createMockClient()
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
}

export const supabase = createBrowserClient() as ReturnType<typeof createClient>

// ─── Server client (anon key, no session persistence) ─────────────────────────
// Used in server actions / API routes that only need user context via cookie/token.

export function createServerSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return createMockClient()
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// ─── Admin client (service role, bypasses RLS) ────────────────────────────────
// NEVER expose to the browser. Use only in API routes / server actions.

export function createAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase service role credentials")
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// ─── Mock client (build-time / missing env vars) ──────────────────────────────

function createMockClient() {
  const ok = { data: null, error: null }
  const listOk = { data: [] as any[], error: null }

  const chain = (result: any = ok): any => ({
    select: () => chain(listOk),
    insert: () => chain(ok),
    update: () => chain(ok),
    delete: () => chain(ok),
    upsert: () => chain(ok),
    eq: () => chain(result),
    neq: () => chain(result),
    order: () => chain(result),
    limit: () => chain(result),
    single: () => Promise.resolve(ok),
    then: (fn: any) => Promise.resolve(result).then(fn),
  })

  return {
    from: (_table: string) => chain(),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      updateUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    storage: {
      from: (_bucket: string) => ({
        upload: () => Promise.resolve({ data: { path: "mock" }, error: null }),
        download: () => Promise.resolve({ data: new Blob(), error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
        remove: () => Promise.resolve({ data: [], error: null }),
      }),
    },
    rpc: () => Promise.resolve(listOk),
  } as unknown as ReturnType<typeof createClient>
}

export default supabase

// lib/supabase.client.ts
// Client-side only: for use in Client Components and hooks
// Safe to import from any "use client" component

import { createClient } from "@supabase/supabase-js"

function validateSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    const msg = `Missing Supabase: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY`
    if (process.env.NODE_ENV === "production") {
      throw new Error(`❌ FATAL: ${msg}`)
    }
    console.warn(`⚠️ DEV: ${msg}`)
    return false
  }
  return true
}

export function createBrowserClient() {
  if (!validateSupabaseEnv()) {
    console.warn("⚠️ Using MOCK client — data will NOT persist")
    return createMockClient()
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  )
}

// Singleton browser client
export const supabase = createBrowserClient()

// Mock client for development without Supabase
function createMockClient() {
  const mockError = new Error(
    "❌ MOCK CLIENT: Supabase not configured. Data will NOT persist! " +
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
  )

  const mockQueryBuilder: any = {
    select: () => mockQueryBuilder,
    insert: () => mockQueryBuilder,
    update: () => mockQueryBuilder,
    delete: () => mockQueryBuilder,
    upsert: () => mockQueryBuilder,
    eq: (_col: string, _val: any) => mockQueryBuilder,
    order: (_col: string, _opts?: any) => mockQueryBuilder,
    limit: (_n: number) => mockQueryBuilder,
    single: () => Promise.resolve({ data: null, error: mockError }),
    then: (onFulfilled: any) =>
      Promise.resolve({ data: [], error: mockError }).then(onFulfilled),
  }

  return {
    from: (table: string) => {
      console.error(
        `❌ MOCK: Attempted to query table "${table}" — data NOT persisted!`
      )
      return mockQueryBuilder
    },
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: mockError }),
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: mockError }),
      signUp: (_opts: any) => {
        console.error("❌ MOCK signUp — NOT working")
        return Promise.resolve({ data: null, error: mockError })
      },
      signInWithPassword: (_opts: any) => {
        console.error("❌ MOCK signInWithPassword — NOT working")
        return Promise.resolve({ data: null, error: mockError })
      },
      signOut: () => Promise.resolve({ error: null }),
      updateUser: (_opts: any) => Promise.resolve({ data: null, error: mockError }),
      onAuthStateChange: (_callback: any) => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      exchangeCodeForSession: (_code: string) =>
        Promise.resolve({ data: null, error: mockError }),
    },
    storage: {
      from: (_bucket: string) => ({
        upload: (_path: string, _file: any) =>
          Promise.resolve({ data: null, error: mockError }),
        download: (_path: string) =>
          Promise.resolve({ data: new Blob(), error: null }),
        getPublicUrl: (_path: string) => ({
          data: { publicUrl: "" },
        }),
        remove: (_paths: string[]) =>
          Promise.resolve({ data: [], error: null }),
      }),
    },
    functions: {
      invoke: (_fn: string, _args?: any) =>
        Promise.resolve({ data: null, error: mockError }),
    },
    rpc: (_fn: string, _args?: any) =>
      Promise.resolve({ data: null, error: mockError }),
  } as any
}

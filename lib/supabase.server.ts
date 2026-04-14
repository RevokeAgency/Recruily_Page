// lib/supabase.server.ts
// Server-side ONLY: for use in Server Components, API Routes, Server Actions
// DO NOT import from client components ("use client")

import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// ============================================================================
// 1. SERVER CLIENT (for Server Components, API Routes, Middleware)
// ============================================================================

export async function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    console.warn("⚠️ Supabase not configured, using mock")
    return createMockClient()
  }

  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch (error) {
          console.warn("❌ Could not set cookie:", error)
        }
      },
    },
  })
}

// ============================================================================
// 2. ADMIN CLIENT (SERVICE ROLE — Server-Only, NEVER in browser!)
// ============================================================================

export function createAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("❌ FATAL: NEXT_PUBLIC_SUPABASE_URL not set")
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "❌ FATAL: SUPABASE_SERVICE_ROLE_KEY not set in .env (server-side only!)"
    )
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// Mock client for development
function createMockClient() {
  const mockError = new Error(
    "❌ MOCK CLIENT: Supabase not configured. Data will NOT persist!"
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
      console.error(`❌ MOCK: Attempted to query table "${table}"`)
      return mockQueryBuilder
    },
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: mockError }),
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: mockError }),
    },
  } as any
}

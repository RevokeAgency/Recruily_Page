import { createClient } from "@supabase/supabase-js"
import { ENV, isSupabaseConfigured, isBuildTime } from "./env"

// Server-side Supabase client with proper error handling
export function createServerSupabaseClient() {
  // During build time, use a minimal mock to prevent errors
  if (isBuildTime() && !isSupabaseConfigured()) {
    console.log("🏗️ Build time: Using mock server Supabase client")
    return createMockServerClient()
  }

  if (!isSupabaseConfigured()) {
    console.warn("⚠️ Supabase environment variables missing. Using mock server client.")
    return createMockServerClient()
  }
  
  try {
    return createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
      },
    })
  } catch (error) {
    console.error("❌ Failed to create server Supabase client:", error)
    return createMockServerClient()
  }
}

// For API routes that need service role access (backend only)
export function createServiceSupabaseClient() {
  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("⚠️ Service role credentials missing. Using mock client.")
    return createMockServerClient()
  }
  
  try {
    return createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
      },
    })
  } catch (error) {
    console.error("❌ Failed to create service Supabase client:", error)
    return createMockServerClient()
  }
}

// Mock server client for when credentials are not available
function createMockServerClient() {
  const mockResponse = { data: [], error: null }
  const mockSingleResponse = { data: null, error: null }

  return {
    from: (table: string) => ({
      select: (columns?: string) => Promise.resolve(mockResponse),
      insert: (data: any) => Promise.resolve({ data, error: null }),
      update: (data: any) => Promise.resolve({ data, error: null }),
      delete: () => Promise.resolve(mockSingleResponse),
      upsert: (data: any) => Promise.resolve({ data, error: null }),
      eq: (column: string, value: any) => ({
        select: (columns?: string) => Promise.resolve(mockResponse),
        update: (data: any) => Promise.resolve({ data, error: null }),
        delete: () => Promise.resolve(mockSingleResponse),
        single: () => Promise.resolve(mockSingleResponse),
      }),
      order: (column: string, options?: any) => ({
        select: (columns?: string) => Promise.resolve(mockResponse),
      }),
      limit: (count: number) => ({
        select: (columns?: string) => Promise.resolve(mockResponse),
      }),
      single: () => Promise.resolve(mockSingleResponse),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      exchangeCodeForSession: (code: string) => Promise.resolve({ error: null }),
    },
    storage: {
      from: (bucket: string) => ({
        upload: (path: string, file: any) => Promise.resolve({ data: { path: `mock-${path}` }, error: null }),
        download: (path: string) => Promise.resolve({ data: new Blob(), error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://via.placeholder.com/150?text=${path}` } }),
        remove: (paths: string[]) => Promise.resolve({ data: [], error: null }),
      }),
    },
    rpc: (fn: string, args?: any) => Promise.resolve(mockResponse),
  } as any
}

// Default server client export
export const supabaseServer = createServerSupabaseClient()
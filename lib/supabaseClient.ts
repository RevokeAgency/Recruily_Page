import { createClient } from "@supabase/supabase-js"
import { ENV, isSupabaseConfigured, isBuildTime } from "./env"

// Create Supabase client with proper error handling and fallbacks
function createSupabaseInstance() {
  // During build time, use a minimal mock to prevent errors
  if (isBuildTime() && !isSupabaseConfigured()) {
    console.log("🏗️ Build time: Using mock Supabase client")
    return createMockClient()
  }

  // Check if Supabase is properly configured
  if (!isSupabaseConfigured()) {
    console.warn("⚠️ Supabase environment variables missing. Using mock client.")
    console.warn("Missing:", {
      url: !ENV.SUPABASE_URL,
      anonKey: !ENV.SUPABASE_ANON_KEY,
    })
    return createMockClient()
  }

  try {
    const client = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY)
    console.log("✅ Supabase client initialized successfully")
    return client
  } catch (error) {
    console.error("❌ Failed to create Supabase client:", error)
    return createMockClient()
  }
}

// Mock client for when Supabase credentials are not available
function createMockClient() {
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
      signUp: (credentials: any) => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signInWithPassword: (credentials: any) => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signInWithOAuth: (options: any) => Promise.resolve({ data: { url: "#", provider: options.provider }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      exchangeCodeForSession: (code: string) => Promise.resolve({ error: null }),
      resetPasswordForEmail: (email: string) => Promise.resolve({ data: {}, error: null }),
      onAuthStateChange: (callback: any) => ({
        data: { subscription: { unsubscribe: () => {} } }
      }),
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
  }
}

export const supabase = createSupabaseInstance()

// Export a factory function for consistency with existing code
export const createSupabaseClient = () => supabase

// Default export for convenience
export default supabase
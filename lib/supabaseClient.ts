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
    const missingVars = []
    if (!ENV.SUPABASE_URL) missingVars.push("NEXT_PUBLIC_SUPABASE_URL")
    if (!ENV.SUPABASE_ANON_KEY) missingVars.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    // In build environments, throw error for better debugging
    if (typeof window === "undefined" && (process.env.CI || process.env.NETLIFY)) {
      throw new Error(`supabaseUrl is required. Missing environment variables: ${missingVars.join(", ")}`)
    }
    
    console.warn("⚠️ Supabase environment variables missing. Using mock client.")
    console.warn("Missing:", missingVars)
    return createMockClient()
  }

  try {
    const client = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
    console.log("✅ Supabase client initialized successfully")
    return client
  } catch (error) {
    console.error("❌ Failed to create Supabase client:", error)
    
    // In CI/build environments, throw the error to fail the build
    if (typeof window === "undefined" && (process.env.CI || process.env.NETLIFY)) {
      throw new Error(`supabaseUrl is required. Failed to initialize Supabase client: ${error}`)
    }
    
    return createMockClient()
  }
}

// Mock client for when Supabase credentials are not available
function createMockClient() {
  const mockResponse = { data: [], error: null }
  const mockSingleResponse = { data: null, error: null }

  // Create a chainable query builder that supports the full Supabase query pattern
  const createChainableBuilder = () => {
    const builder = {
      select: (columns?: string) => createChainableBuilder(), // Return chainable builder, not Promise
      insert: (data: any) => {
        const insertResult = { data, error: null }
        // Return a thenable that also has chainable methods
        const thenable = Promise.resolve(insertResult)
        Object.assign(thenable, {
          select: (columns?: string) => Promise.resolve({ data, error: null }),
          single: () => Promise.resolve({ data: Array.isArray(data) ? data[0] : data, error: null })
        })
        return thenable
      },
      update: (data: any) => Promise.resolve({ data, error: null }),
      delete: () => Promise.resolve(mockSingleResponse),
      upsert: (data: any) => Promise.resolve({ data, error: null }),
      eq: (column: string, value: any) => createChainableBuilder(), // Return another chainable builder
      order: (column: string, options?: any) => createChainableBuilder(),
      limit: (count: number) => createChainableBuilder(),
      single: () => Promise.resolve(mockSingleResponse), // This ends the chain and returns a Promise
    }
    return builder
  }

  return {
    from: (table: string) => createChainableBuilder(),
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
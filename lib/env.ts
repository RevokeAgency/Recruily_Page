// Environment variables with fallbacks for development and preview
export const supabaseEnv = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
}

// Check if we're in a preview environment
export const isPreviewEnv =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("v0.dev") || window.location.hostname.includes("vercel-v0-preview"))

// Check if we have valid Supabase credentials
export const hasValidSupabaseCredentials =
  !!supabaseEnv.url && supabaseEnv.url.length > 0 && !!supabaseEnv.anonKey && supabaseEnv.anonKey.length > 0

// Use mock data when in development or preview environments
export const useMockData = isPreviewEnv || !hasValidSupabaseCredentials

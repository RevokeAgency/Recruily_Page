// Environment configuration with validation and fallbacks

export const ENV = {
  // Supabase Configuration
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  
  // App Configuration
  NODE_ENV: process.env.NODE_ENV || "development",
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  
  // Feature Flags
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
  ENABLE_ONBOARDING: process.env.NEXT_PUBLIC_ENABLE_ONBOARDING !== "false",
  ENABLE_BULK_ACTIONS: process.env.NEXT_PUBLIC_ENABLE_BULK_ACTIONS !== "false",
}

// Validation functions
export const isSupabaseConfigured = (): boolean => {
  return Boolean(ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY)
}

export const isProductionBuild = (): boolean => {
  return ENV.NODE_ENV === "production"
}

export const isBuildTime = (): boolean => {
  return typeof window === "undefined" && isProductionBuild()
}

// Log configuration status (only in development)
if (ENV.NODE_ENV === "development") {
  console.log("🔧 Environment Configuration:", {
    supabaseConfigured: isSupabaseConfigured(),
    nodeEnv: ENV.NODE_ENV,
    appUrl: ENV.APP_URL,
  })
}
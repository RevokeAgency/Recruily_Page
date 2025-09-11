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

// Validate required environment variables for production builds
function validateProductionEnv() {
  if (ENV.NODE_ENV === "production" || process.env.NODE_ENV === "production") {
    const missingVars: string[] = []
    
    if (!ENV.SUPABASE_URL) {
      missingVars.push("NEXT_PUBLIC_SUPABASE_URL")
    }
    
    if (!ENV.SUPABASE_ANON_KEY) {
      missingVars.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    }
    
    // For Netlify builds, throw an error if required vars are missing
    if (missingVars.length > 0 && typeof window === "undefined") {
      const isNetlifyBuild = process.env.NETLIFY === "true" || process.env.BUILD_ID || process.env.CI
      
      if (isNetlifyBuild) {
        console.error("❌ Missing required environment variables for production build:")
        missingVars.forEach(varName => console.error(`   - ${varName}`))
        console.error("\n💡 Add these to your Netlify environment variables:")
        console.error("   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url")
        console.error("   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here")
        
        throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`)
      } else {
        console.warn("⚠️ Missing Supabase environment variables, using mock client")
      }
    }
  }
}

// Run validation
try {
  validateProductionEnv()
} catch (error) {
  // Re-throw in build environments to fail the build
  if (typeof window === "undefined") {
    throw error
  }
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
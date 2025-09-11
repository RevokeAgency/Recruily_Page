import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

export const createSupabaseClient = (authToken?: string) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

  // Validate environment variables
  if (!supabaseUrl) {
    console.warn("⚠️ SUPABASE_URL environment variable is missing")
    throw new Error("SUPABASE_URL is required for edge functions")
  }

  if (!supabaseKey) {
    console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY environment variable is missing")
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for edge functions")
  }

  try {
    return createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authToken ? `Bearer ${authToken}` : "",
        },
      },
    })
  } catch (error) {
    console.error("❌ Failed to create Supabase client in edge function:", error)
    throw error
  }
}
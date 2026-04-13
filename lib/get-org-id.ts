import { createClient } from "@supabase/supabase-js"

export async function getOrgId(token?: string): Promise<string | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null
    if (!token) return null

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (!user) return null

    const { data: org } = await supabaseAdmin
      .from("organisations")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    return (org as any)?.id ?? null
  } catch {
    return null
  }
}

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function getOrgId(): Promise<string | null> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) return null

    const { data: org } = await supabase
      .from("organisations")
      .select("id")
      .eq("owner_id", session.user.id)
      .single()

    return (org as any)?.id ?? null
  } catch {
    return null
  }
}

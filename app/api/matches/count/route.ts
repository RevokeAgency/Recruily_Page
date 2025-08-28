import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/server-supabase"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    const { count, error } = await supabase.from("job_candidate_matches").select("*", { count: "exact", head: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabaseServer"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    const { count, error } = await supabase.from("jobs").select("*", { count: "exact", head: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// App Router configuration exports
export const dynamic = "force-dynamic" 
export const runtime = "nodejs"

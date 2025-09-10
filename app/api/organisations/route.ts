import { NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase-client"

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient()
    const { name, plan = "starter" } = await request.json()

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke("create-organisation", {
      body: { name, plan },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// App Router configuration exports
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

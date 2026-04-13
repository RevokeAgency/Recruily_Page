import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  console.log("=== GET /api/organisations called ===")
  const authHeader = request.headers.get("Authorization")
  console.log("Auth header present:", !!authHeader)
  console.log("Token length:", authHeader?.length)
  console.log("SUPABASE_URL set:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log("SERVICE_ROLE_KEY set:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("ORGANISATIONS ERROR: missing env vars")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const token = authHeader?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    console.log("getUser result — user:", user?.id ?? "null", "error:", userError?.message ?? "none")
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: orgs, error } = await supabaseAdmin
      .from("organisations")
      .select("id, name, plan, created_at, domain, website")
      .eq("owner_id", user.id)

    console.log("orgs query — count:", orgs?.length ?? 0, "error:", error?.message ?? "none")
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const organisations = (orgs ?? []).map((org) => ({ ...org, role: "owner" }))
    return NextResponse.json({ organisations })
  } catch (error: any) {
    console.error("ORGANISATIONS ERROR:", error.message, error.code, error.stack)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name, plan = "starter" } = await request.json()
    if (!name) return NextResponse.json({ error: "Organisation name is required" }, { status: 400 })

    // Check if org already exists for this user
    const { data: existing } = await supabaseAdmin
      .from("organisations")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (existing?.id) {
      return NextResponse.json({ organisation: existing }, { status: 200 })
    }

    const { data: org, error } = await supabaseAdmin
      .from("organisations")
      .insert({ name, plan, owner_id: user.id })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ organisation: org }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// App Router configuration exports
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

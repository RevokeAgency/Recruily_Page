import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (!user || authError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { data: org, error: orgError } = await supabaseAdmin
      .from("organisations")
      .select("id, name")
      .eq("owner_id", user.id)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: "Organisation not found" }, { status: 404 })
    }

    return NextResponse.json({ organisations: [{ ...org, role: "owner" }] })
  } catch (error: any) {
    console.error("GET /api/organisations error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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

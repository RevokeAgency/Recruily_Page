import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ count: 0 })

    const admin = createAdminClient()
    const { data: { user } } = await admin.auth.getUser(token)
    if (!user) return NextResponse.json({ count: 0 })

    const { data: org } = await admin
      .from("organisations")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!org?.id) return NextResponse.json({ count: 0 })

    const { count, error } = await admin
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("organisation_id", org.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ count: count ?? 0 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

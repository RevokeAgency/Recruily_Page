import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized", candidates: [], total: 0 }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: { user }, error: userError } = await admin.auth.getUser(token)
    if (!user || userError) {
      return NextResponse.json({ success: false, error: "Invalid token", candidates: [], total: 0 }, { status: 401 })
    }

    const { data: org } = await admin
      .from("organisations")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!org?.id) {
      return NextResponse.json({ success: true, candidates: [], total: 0 })
    }

    const { data: candidates, error } = await admin
      .from("candidates")
      .select("*")
      .eq("organisation_id", org.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Candidates fetch error:", error)
      return NextResponse.json({ success: false, error: error.message, candidates: [], total: 0 }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      candidates: candidates ?? [],
      total: candidates?.length ?? 0,
    })
  } catch (error: any) {
    console.error("❌ Candidates API GET Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch candidates", candidates: [], total: 0 },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: { user }, error: userError } = await admin.auth.getUser(token)
    if (!user || userError) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "Candidate ID is required" }, { status: 400 })
    }

    const { data: candidate, error } = await admin
      .from("candidates")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("❌ Candidate update error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, candidate })
  } catch (error: any) {
    console.error("❌ Candidates API PUT Error:", error)
    return NextResponse.json({ success: false, error: "Failed to update candidate" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: { user }, error: userError } = await admin.auth.getUser(token)
    if (!user || userError) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Candidate ID is required" }, { status: 400 })
    }

    const { error } = await admin.from("candidates").delete().eq("id", id)

    if (error) {
      console.error("❌ Candidate delete error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("❌ Candidates API DELETE Error:", error)
    return NextResponse.json({ success: false, error: "Failed to delete candidate" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

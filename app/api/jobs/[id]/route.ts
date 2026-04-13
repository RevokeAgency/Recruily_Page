import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase"

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("📋 [API] GET /api/jobs/[id]:", params.id)

    const adminClient = createAdminClient()
    const { data: job, error } = await adminClient
      .from("jobs")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error || !job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, job })
  } catch (error: any) {
    console.error("❌ [API] GET /jobs/[id] error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch job" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth via session cookies
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updateData = await request.json()
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from("jobs")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("id", params.id)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to update job" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth via session cookies
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient.from("jobs").delete().eq("id", params.id)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to delete job" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

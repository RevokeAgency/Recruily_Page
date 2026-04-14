import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: true, matches: [], count: 0 })
    }

    const admin = createAdminClient()
    const { data: { user } } = await admin.auth.getUser(token)
    if (!user) {
      return NextResponse.json({ success: true, matches: [], count: 0 })
    }

    const { data: org } = await admin
      .from("organisations")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!org?.id) {
      return NextResponse.json({ success: true, matches: [], count: 0 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get("jobId")
    const candidateId = searchParams.get("candidateId")

    let query = admin
      .from("matches")
      .select(`*, candidate:candidates(*), job:jobs(*)`)
      .eq("organisation_id", org.id)
      .order("created_at", { ascending: false })

    if (jobId) query = query.eq("job_id", jobId)
    if (candidateId) query = query.eq("candidate_id", candidateId)

    const { data: matches, error } = await query

    if (error) {
      console.error("❌ Matches fetch error:", error)
      return NextResponse.json({ success: true, matches: [], count: 0 })
    }

    return NextResponse.json({
      success: true,
      matches: matches ?? [],
      count: matches?.length ?? 0,
    })
  } catch (error: any) {
    console.error("❌ Matches API GET Error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch matches", matches: [], count: 0 }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

    const admin = createAdminClient()
    const { data: { user } } = await admin.auth.getUser(token)
    if (!user) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })

    const { matchId, status } = await request.json()
    if (!matchId || !status) {
      return NextResponse.json({ success: false, error: "Match ID and status are required" }, { status: 400 })
    }

    const { data: updatedMatch, error } = await admin
      .from("matches")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", matchId)
      .select(`*, candidate:candidates(*), job:jobs(*)`)
      .single()

    if (error) {
      console.error("❌ Match update error:", error)
      return NextResponse.json({ success: false, error: "Failed to update match status" }, { status: 500 })
    }

    return NextResponse.json({ success: true, match: updatedMatch })
  } catch (error: any) {
    console.error("❌ Matches API PATCH Error:", error)
    return NextResponse.json({ success: false, error: "Failed to update match" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

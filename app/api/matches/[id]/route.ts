import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id
    if (!matchId) {
      return NextResponse.json({ success: false, error: "Match ID is required" }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: match, error } = await admin
      .from("matches")
      .select(`*, candidate:candidates(*), job:jobs(*)`)
      .eq("id", matchId)
      .single()

    if (error) {
      console.error("❌ Failed to fetch match:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch match" }, { status: 500 })
    }

    if (!match) {
      return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, match })
  } catch (error: any) {
    console.error("❌ Error fetching match:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch match" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id
    if (!matchId) {
      return NextResponse.json({ success: false, error: "Match ID is required" }, { status: 400 })
    }

    const { status } = await request.json()
    if (!status) {
      return NextResponse.json({ success: false, error: "Status is required" }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: updatedMatch, error } = await admin
      .from("matches")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", matchId)
      .select(`*, candidate:candidates(*), job:jobs(*)`)
      .single()

    if (error) {
      console.error("❌ Failed to update match:", error)
      return NextResponse.json({ success: false, error: "Failed to update match status" }, { status: 500 })
    }

    if (!updatedMatch) {
      return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, match: updatedMatch })
  } catch (error: any) {
    console.error("❌ Error updating match:", error)
    return NextResponse.json({ success: false, error: "Failed to update match" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

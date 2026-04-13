import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id
    const body = await request.json()
    const { status } = body

    if (!matchId) {
      return NextResponse.json(
        {
          success: false,
          error: "Match ID is required",
        },
        { status: 400 },
      )
    }

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          error: "Status is required",
        },
        { status: 400 },
      )
    }

    console.log(`🔄 Updating match ${matchId} status to ${status}`)

    const { data: updatedMatch, error } = await (supabase as any)
      .from('matches')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', matchId)
      .select(`
        *,
        candidate:candidates(*),
        job:jobs(*)
      `)
      .single()

    if (error) {
      console.error("❌ Failed to update match:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update match status",
        },
        { status: 500 },
      )
    }

    if (!updatedMatch) {
      return NextResponse.json(
        {
          success: false,
          error: "Match not found",
        },
        { status: 404 },
      )
    }

    console.log(`✅ Match status updated: ${updatedMatch.id}`)

    return NextResponse.json({
      success: true,
      match: updatedMatch,
      message: "Match status updated successfully",
    })
  } catch (error) {
    console.error("❌ Error updating match:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update match",
      },
      { status: 500 },
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id

    if (!matchId) {
      return NextResponse.json(
        {
          success: false,
          error: "Match ID is required",
        },
        { status: 400 },
      )
    }

    console.log(`🔍 Fetching match: ${matchId}`)

    const { data: match, error } = await supabase
      .from('matches')
      .select(`
        *,
        candidate:candidates(*),
        job:jobs(*)
      `)
      .eq('id', matchId)
      .single()

    if (error) {
      console.error("❌ Failed to fetch match:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch match",
        },
        { status: 500 },
      )
    }

    if (!match) {
      return NextResponse.json(
        {
          success: false,
          error: "Match not found",
        },
        { status: 404 },
      )
    }

    console.log(`✅ Match fetched: ${(match as any).id}`)

    return NextResponse.json({
      success: true,
      match: match,
    })
  } catch (error) {
    console.error("❌ Error fetching match:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch match",
      },
      { status: 500 },
    )
  }
}

// App Router configuration exports
export const dynamic = "force-dynamic"
export const runtime = "nodejs"
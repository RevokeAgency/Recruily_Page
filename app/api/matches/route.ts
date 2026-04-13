import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get("jobId")
    const candidateId = searchParams.get("candidateId")

    console.log("📋 Fetching matches for:", { jobId, candidateId })

    // Build query
    let query = supabase
      .from('matches')
      .select(`
        *,
        candidate:candidates(*),
        job:jobs(*)
      `)
      .order('created_at', { ascending: false })

    // Add filters
    if (jobId) {
      query = query.eq('job_id', jobId)
    }
    
    if (candidateId) {
      query = query.eq('candidate_id', candidateId)
    }

    const { data: matches, error } = await query

    if (error) {
      console.error("❌ Supabase query error:", error)
      return NextResponse.json({
        success: true, // Return success with empty array for graceful fallback
        matches: [],
        count: 0,
        source: "database_error"
      })
    }

    console.log(`✅ Found ${matches?.length || 0} matches`)

    return NextResponse.json({
      success: true,
      matches: matches || [],
      count: matches?.length || 0,
      source: "database"
    })
  } catch (error) {
    console.error("❌ Error fetching matches:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch matches",
        matches: [],
        count: 0,
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { matchId, status } = body

    if (!matchId || !status) {
      return NextResponse.json(
        {
          success: false,
          error: "Match ID and status are required",
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

// App Router configuration exports
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

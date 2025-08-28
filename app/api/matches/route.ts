import { type NextRequest, NextResponse } from "next/server"
import { mockDataStore } from "@/lib/mock-data-store"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organisationId = searchParams.get("organisationId") || "demo-org-123"
    const jobId = searchParams.get("jobId")
    const candidateId = searchParams.get("candidateId")

    console.log("Fetching matches for:", { organisationId, jobId, candidateId })

    const matches = mockDataStore.getMatches({
      organisationId,
      jobId: jobId || undefined,
      candidateId: candidateId || undefined,
    })

    // Enrich matches with candidate and job data
    const enrichedMatches = matches.map((match) => {
      const candidate = mockDataStore.getCandidate(match.candidate_id)
      const job = mockDataStore.getJob(match.job_id)

      return {
        id: match.id,
        job_id: match.job_id,
        candidate_id: match.candidate_id,
        match_score: match.score / 100, // Convert to decimal
        stage: match.stage,
        strengths: match.strengths,
        fitSummary: match.result.overall_assessment,
        created_at: match.created_at,
        updated_at: match.updated_at,
        candidate: candidate
          ? {
              id: candidate.id,
              name: candidate.name,
              email: candidate.email,
              jobTitle: candidate.summary.split(" ")[0] + " " + candidate.summary.split(" ")[1] || "Professional",
              avatar: null,
              profile: {
                summary: candidate.summary,
                skills: candidate.skills.split(", "),
                experience: candidate.experience,
                education: candidate.education,
                location: candidate.location,
                phone: candidate.phone,
                yearsOfExperience: candidate.years_of_experience,
              },
            }
          : null,
        job: job
          ? {
              id: job.id,
              title: job.title,
              company: job.company,
              location: job.location,
            }
          : null,
      }
    })

    console.log("Found enriched matches:", enrichedMatches.length)

    return NextResponse.json({
      success: true,
      matches: enrichedMatches,
      count: enrichedMatches.length,
    })
  } catch (error) {
    console.error("Error fetching matches:", error)
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

    const updatedMatch = mockDataStore.updateMatch(matchId, { stage: status })

    if (!updatedMatch) {
      return NextResponse.json(
        {
          success: false,
          error: "Match not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      match: updatedMatch,
      message: "Match status updated successfully",
    })
  } catch (error) {
    console.error("Error updating match:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update match",
      },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🎯 Jobs Match API - POST request received")

    const body = await request.json()
    const { jobId } = body

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: "Job ID is required",
        },
        { status: 400 },
      )
    }

    console.log("🔍 Matching candidates for job:", jobId)

    // Get candidates from localStorage or create mock candidates
    let candidates = []
    try {
      if (typeof localStorage !== "undefined") {
        const storedCandidates = localStorage.getItem("recruitify_candidates")
        candidates = storedCandidates ? JSON.parse(storedCandidates) : []
      }
    } catch (error) {
      console.warn("Could not access localStorage, using mock data")
    }

    // Filter candidates for this job
    const jobCandidates = candidates.filter((candidate: any) => candidate.jobId === jobId)

    // Generate matches for each candidate
    const matches = jobCandidates.map((candidate: any) => {
      const matchScore = Math.floor(Math.random() * 40) + 60 // 60-100% match

      return {
        id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        jobId,
        candidateId: candidate.id,
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        score: matchScore,
        strengths: generateStrengths(candidate.skills || []),
        weaknesses: generateWeaknesses(),
        stage: "New",
        status: "active",
        created_at: new Date().toISOString(),
        candidate: {
          ...candidate,
          match: matchScore,
        },
      }
    })

    // Save matches to localStorage
    try {
      if (typeof localStorage !== "undefined") {
        const existingMatches = JSON.parse(localStorage.getItem("recruitify_matches") || "[]")
        const updatedMatches = [...existingMatches, ...matches]
        localStorage.setItem("recruitify_matches", JSON.stringify(updatedMatches))
      }
    } catch (error) {
      console.warn("Could not save matches to localStorage")
    }

    console.log(`✅ Generated ${matches.length} matches for job ${jobId}`)

    return NextResponse.json({
      success: true,
      matches,
      count: matches.length,
      message: `Successfully matched ${matches.length} candidates`,
    })
  } catch (error: any) {
    console.error("❌ Jobs Match API Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to match candidates",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

function generateStrengths(skills: string[]): string[] {
  const allStrengths = [
    "Technical Skills",
    "Problem Solving",
    "Communication",
    "Leadership",
    "Teamwork",
    "Adaptability",
    "Creativity",
    "Time Management",
    "Analytical Thinking",
    "Project Management",
  ]

  // Include skills as strengths if available
  const skillStrengths = skills.slice(0, 2)
  const otherStrengths = allStrengths
    .filter((s) => !skillStrengths.includes(s))
    .sort(() => 0.5 - Math.random())
    .slice(0, 3 - skillStrengths.length)

  return [...skillStrengths, ...otherStrengths]
}

function generateWeaknesses(): string[] {
  const weaknesses = [
    "Limited experience with specific technology",
    "Could improve presentation skills",
    "Needs more leadership experience",
    "Could benefit from additional certifications",
  ]

  return weaknesses.sort(() => 0.5 - Math.random()).slice(0, 2)
}

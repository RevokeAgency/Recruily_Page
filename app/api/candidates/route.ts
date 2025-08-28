import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// In-memory storage for candidates (in production, this would be a database)
const candidatesStorage: any[] = []

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    console.log("👥 Candidates API - GET request received")

    const { searchParams } = new URL(request.url)
    const organisationId = searchParams.get("organisationId")
    const jobId = searchParams.get("jobId")

    // Filter candidates by organisation and/or job if provided
    let filteredCandidates = candidatesStorage
    if (organisationId) {
      filteredCandidates = filteredCandidates.filter((candidate) => candidate.organisation_id === organisationId)
    }
    if (jobId) {
      filteredCandidates = filteredCandidates.filter((candidate) => candidate.jobId === jobId)
    }

    // Try to get from Supabase first (if available)
    if (supabaseUrl && supabaseKey) {
      try {
        const { data: dbCandidates, error } = await supabase
          .from("candidates")
          .select("*")
          .order("uploadedAt", { ascending: false })

        if (!error && dbCandidates && dbCandidates.length > 0) {
          console.log(`✅ Retrieved ${dbCandidates.length} candidates from Supabase`)
          // Filter by organisation and/or job if provided
          let finalCandidates = dbCandidates
          if (organisationId) {
            finalCandidates = finalCandidates.filter((candidate) => candidate.organisation_id === organisationId)
          }
          if (jobId) {
            finalCandidates = finalCandidates.filter((candidate) => candidate.jobId === jobId)
          }
          return NextResponse.json({
            success: true,
            candidates: finalCandidates,
            total: finalCandidates.length,
            source: "database",
          })
        } else {
          console.warn("⚠️ Supabase query failed or returned no results:", error)
        }
      } catch (supabaseError) {
        console.warn("⚠️ Supabase connection failed:", supabaseError)
      }
    }

    console.log(`📊 Returning ${filteredCandidates.length} candidates`)

    return NextResponse.json({
      success: true,
      candidates: filteredCandidates,
      total: filteredCandidates.length,
      source: "mock",
    })
  } catch (error: any) {
    console.error("❌ Candidates API Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch candidates",
        candidates: [],
        total: 0,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("👥 Candidates API - POST request received")

    const body = await request.json()
    console.log("📝 Saving candidates:", body)

    // Handle both single candidate and multiple candidates
    const candidatesData = body.candidates || [body]
    const jobId = body.jobId

    const savedCandidates = []

    for (const candidateData of candidatesData) {
      // Ensure candidate has required fields
      const candidate = {
        id: candidateData.id || `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: candidateData.name || "Unknown Candidate",
        email: candidateData.email || `candidate${Date.now()}@example.com`,
        phone: candidateData.phone || "",
        location: candidateData.location || "",
        position: candidateData.position || candidateData.experience?.[0]?.title || "Professional",
        experience: candidateData.experience || candidateData.yearsOfExperience?.toString() || "0",
        skills: Array.isArray(candidateData.skills) ? candidateData.skills : [],
        summary: candidateData.summary || "Professional summary not available",
        yearsOfExperience: candidateData.yearsOfExperience || 0,
        status: candidateData.status || "Applied",
        jobId: jobId || candidateData.jobId,
        uploadedAt: candidateData.uploadedAt || new Date().toISOString(),
        processingMethod: candidateData.processingMethod || "extracted",
        fullProfile: candidateData.fullProfile || candidateData,
        education: candidateData.education || [],
        languages: candidateData.languages || ["English"],
        certifications: candidateData.certifications || [],
        // Generate match score and avatar
        match: Math.floor(Math.random() * 40) + 60, // 60-100%
        avatar: candidateData.name ? candidateData.name.charAt(0).toUpperCase() : "?",
        applied: new Date().toLocaleDateString(),
        organisation_id: "demo-org-123",
      }

      // Add to storage
      candidatesStorage.push(candidate)
      savedCandidates.push(candidate)
    }

    // Try to save to Supabase first (if available)
    if (supabaseUrl && supabaseKey) {
      try {
        const { data, error } = await supabase.from("candidates").insert(savedCandidates)

        if (!error && data) {
          console.log(
            "✅ Candidates saved to Supabase:",
            data.map((candidate) => candidate.id),
          )
          return NextResponse.json({
            success: true,
            candidates: data,
            count: data.length,
            message: `Successfully saved ${data.length} candidate${data.length > 1 ? "s" : ""}`,
            source: "database",
          })
        } else {
          console.warn("⚠️ Supabase insert failed:", error)
        }
      } catch (supabaseError) {
        console.warn("⚠️ Supabase connection failed:", supabaseError)
      }
    }

    console.log(`✅ Saved ${savedCandidates.length} candidates`)

    return NextResponse.json({
      success: true,
      candidates: savedCandidates,
      count: savedCandidates.length,
      message: `Successfully saved ${savedCandidates.length} candidate${savedCandidates.length > 1 ? "s" : ""}`,
      source: "mock",
    })
  } catch (error: any) {
    console.error("❌ Candidates API POST Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save candidates",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("👥 Candidates API - PUT request received")

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "Candidate ID is required" }, { status: 400 })
    }

    // Find and update candidate in storage
    const candidateIndex = candidatesStorage.findIndex((candidate) => candidate.id === id)
    if (candidateIndex === -1) {
      return NextResponse.json({ success: false, error: "Candidate not found" }, { status: 404 })
    }

    const updatedCandidate = {
      ...candidatesStorage[candidateIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    candidatesStorage[candidateIndex] = updatedCandidate

    // Try to update in Supabase first (if available)
    if (supabaseUrl && supabaseKey) {
      try {
        const { data, error } = await supabase
          .from("candidates")
          .update(updatedCandidate)
          .eq("id", id)
          .select()
          .single()

        if (!error && data) {
          console.log("✅ Candidate updated in Supabase:", data.id)
          return NextResponse.json({
            success: true,
            candidate: data,
            source: "database",
          })
        } else {
          console.warn("⚠️ Supabase update failed:", error)
        }
      } catch (supabaseError) {
        console.warn("⚠️ Supabase connection failed:", supabaseError)
      }
    }

    console.log("✅ Candidate updated:", id)

    return NextResponse.json({
      success: true,
      candidate: updatedCandidate,
      source: "mock",
    })
  } catch (error) {
    console.error("❌ Candidates API PUT Error:", error)
    return NextResponse.json({ success: false, error: "Failed to update candidate" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("=== 🗑️ Candidates API DELETE Called ===")

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Candidate ID is required" }, { status: 400 })
    }

    // Try to delete from Supabase first (if available)
    if (supabaseUrl && supabaseKey) {
      try {
        const { error } = await supabase.from("candidates").delete().eq("id", id)

        if (!error) {
          console.log("✅ Candidate deleted from Supabase:", id)
          return NextResponse.json({
            success: true,
            source: "database",
          })
        } else {
          console.warn("⚠️ Supabase delete failed:", error)
        }
      } catch (supabaseError) {
        console.warn("⚠️ Supabase connection failed:", supabaseError)
      }
    }

    // Fallback to mock delete
    const candidateIndex = candidatesStorage.findIndex((candidate) => candidate.id === id)
    if (candidateIndex !== -1) {
      candidatesStorage.splice(candidateIndex, 1)
      console.log("🔄 Using mock delete fallback")
      console.log("✅ Candidate deleted (mock):", id)
    } else {
      console.warn("⚠️ Candidate not found in mock storage:", id)
    }

    return NextResponse.json({
      success: true,
      source: "mock",
    })
  } catch (error) {
    console.error("❌ Candidates API DELETE Error:", error)
    return NextResponse.json({ success: false, error: "Failed to delete candidate" }, { status: 500 })
  }
}

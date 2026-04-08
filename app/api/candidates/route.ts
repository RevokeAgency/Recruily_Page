import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"
import { getOrgId } from "@/lib/get-org-id"
import { createClient } from "@supabase/supabase-js"

type Candidate = {
  id: string
  organisation_id?: string | null
  job_id?: string | null
  name?: string
  email?: string
  status?: string
  score?: number
  [key: string]: unknown
}

// In-memory storage for candidates (in production, this would be a database)
const candidatesStorage: any[] = []

// Function to get Supabase client
function getSupabaseClient() {
  try {
    return supabase
  } catch (error) {
    console.warn("Could not access Supabase client:", error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("👥 Candidates API - GET request received")

    // Resolve org_id from Bearer token
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ success: false, error: "Unauthorized", candidates: [], total: 0 }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (!user || userError) {
      return NextResponse.json({ success: false, error: "Invalid token", candidates: [], total: 0 }, { status: 401 })
    }

    const { data: org } = await supabaseAdmin
      .from("organisations")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!org?.id) {
      return NextResponse.json({ success: true, candidates: [], total: 0, source: "database" })
    }

    const { data: dbCandidates, error } = await supabaseAdmin
      .from("candidates")
      .select("*")
      .eq("organisation_id", org.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Supabase candidates query error:", error)
      return NextResponse.json({ success: false, error: error.message, candidates: [], total: 0 }, { status: 500 })
    }

    console.log(`✅ Retrieved ${dbCandidates?.length ?? 0} candidates from Supabase`)
    return NextResponse.json({
      success: true,
      candidates: dbCandidates ?? [],
      total: dbCandidates?.length ?? 0,
      source: "database",
    })
  } catch (error: any) {
    console.error("❌ Candidates API Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch candidates", candidates: [], total: 0 },
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
        organisation_id: (await getOrgId()) || "",
      }

      // Add to storage
      candidatesStorage.push(candidate)
      savedCandidates.push(candidate)
    }

    // Try to save to Supabase first (if available)
    const supabase = getSupabaseClient()
    if (supabase) {
      try {
        const { data, error } = await (supabase as any).from("candidates").insert(savedCandidates)

        if (!error && data) {
          console.log(
            "✅ Candidates saved to Supabase:",
            data.map((candidate: any) => candidate.id),
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
    const supabase = getSupabaseClient()
    if (supabase) {
      try {
        const { data, error } = await (supabase as any)
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
    const supabase = getSupabaseClient()
    if (supabase) {
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

// App Router configuration exports
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

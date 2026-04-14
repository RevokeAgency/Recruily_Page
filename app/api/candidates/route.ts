// app/api/candidates/route.ts
// FIXED: Server session auth instead of Bearer token
// FIXED: Service role for org-scoped queries

import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase.server"

export async function GET(request: NextRequest) {
  try {
    console.log("👥 [API] GET /api/candidates")

    // =========================================================================
    // STEP 1: Get user from server session (via cookies)
    // =========================================================================
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      console.warn("⚠️ [API] Unauthorized: No user in session")
      return NextResponse.json(
        { success: false, error: "Unauthorized", candidates: [] },
        { status: 401 }
      )
    }

    console.log(`🔑 [API] User authenticated: ${user.id}`)

    // =========================================================================
    // STEP 2: Get user's organization (using service role)
    // =========================================================================
    const adminClient = createAdminClient()
    const { data: org, error: orgError } = await adminClient
      .from("organisations")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!org?.id) {
      console.log("ℹ️ [API] No organization found for user (first time?)")
      return NextResponse.json({
        success: true,
        candidates: [],
        total: 0,
        source: "database",
      })
    }

    console.log(`🏢 [API] Organization: ${org.id}`)

    // =========================================================================
    // STEP 3: Query candidates for this org (service role)
    // =========================================================================
    const { data: candidates, error: queryError } = await adminClient
      .from("candidates")
      .select("*")
      .eq("organisation_id", org.id)
      .order("created_at", { ascending: false })

    if (queryError) {
      console.error("❌ [API] Query error:", queryError)
      return NextResponse.json(
        { success: false, error: queryError.message, candidates: [] },
        { status: 500 }
      )
    }

    const count = candidates?.length ?? 0
    console.log(`✅ [API] Retrieved ${count} candidates`)

    return NextResponse.json({
      success: true,
      candidates: candidates ?? [],
      total: count,
      source: "database",
    })
  } catch (error: any) {
    console.error("❌ [API] GET /candidates error:", error.message)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error", candidates: [] },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("👥 [API] POST /api/candidates")

    // =========================================================================
    // STEP 1: Validate request
    // =========================================================================
    const body = await request.json()
    const candidatesData = body.candidates || [body]

    if (!Array.isArray(candidatesData) || candidatesData.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid candidates data" },
        { status: 400 }
      )
    }

    console.log(`📝 [API] Processing ${candidatesData.length} candidates`)

    // =========================================================================
    // STEP 2: Get user from session
    // =========================================================================
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // =========================================================================
    // STEP 3: Get user's organization
    // =========================================================================
    const adminClient = createAdminClient()
    const { data: org } = await adminClient
      .from("organisations")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!org?.id) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      )
    }

    // =========================================================================
    // STEP 4: Transform candidates with org context
    // =========================================================================
    const transformedCandidates = candidatesData.map((c: any) => ({
      id: c.id || `cand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organisation_id: org.id,
      name: c.name || "Unknown",
      email: c.email,
      phone: c.phone || null,
      location: c.location || null,
      skills: Array.isArray(c.skills) ? c.skills : [],
      experience_years: c.experience_years || c.yearsOfExperience || 0,
      education: c.education || null,
      summary: c.summary || null,
      languages: Array.isArray(c.languages) ? c.languages : ["English"],
      certifications: Array.isArray(c.certifications) ? c.certifications : [],
      status: c.status || "new",
      created_at: new Date().toISOString(),
      created_by: user.id,
    }))

    // =========================================================================
    // STEP 5: Insert/upsert candidates
    // =========================================================================
    const { data: inserted, error: insertError } = await adminClient
      .from("candidates")
      .upsert(transformedCandidates, { onConflict: "id" })
      .select()

    if (insertError) {
      console.error("❌ [API] Insert error:", insertError)
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      )
    }

    console.log(`✅ [API] Inserted ${inserted?.length ?? 0} candidates`)

    return NextResponse.json({
      success: true,
      candidates: inserted ?? [],
      total: inserted?.length ?? 0,
    })
  } catch (error: any) {
    console.error("❌ [API] POST /candidates error:", error.message)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Candidate ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { data: updated, error: updateError } = await adminClient
      .from("candidates")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, candidate: updated, source: "database" })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Candidate ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { error: deleteError } = await adminClient
      .from("candidates")
      .delete()
      .eq("id", id)

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, source: "database" })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase.server"
import { v4 as uuidv4 } from "uuid"

export async function GET(request: NextRequest) {
  try {
    console.log("📋 [API] GET /api/jobs")

    // =========================================================================
    // STEP 1: Get user from server session (cookies)
    // =========================================================================
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      console.warn("⚠️ [API] Unauthorized: No user in session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // =========================================================================
    // STEP 2: Get org via service role
    // =========================================================================
    const adminClient = createAdminClient()

    // Support optional single-job lookup: GET /api/jobs?id=<jobId>
    const jobId = request.nextUrl.searchParams.get("id")
    if (jobId) {
      const { data: job, error } = await adminClient
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single()

      if (error || !job) {
        return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 })
      }
      return NextResponse.json({ success: true, job })
    }

    const { data: org } = await adminClient
      .from("organisations")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!org?.id) {
      return NextResponse.json({ success: true, jobs: [], total: 0 })
    }

    // =========================================================================
    // STEP 3: Query jobs
    // =========================================================================
    const { data: jobs, error } = await adminClient
      .from("jobs")
      .select("*")
      .eq("organisation_id", org.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ [API] Jobs fetch error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log(`✅ [API] Retrieved ${jobs?.length ?? 0} jobs`)
    return NextResponse.json({ success: true, jobs: jobs ?? [], total: jobs?.length ?? 0 })
  } catch (error: any) {
    console.error("❌ [API] GET /jobs error:", error.message)
    return NextResponse.json(
      { success: false, error: "Failed to fetch jobs", jobs: [], total: 0 },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📋 [API] POST /api/jobs")

    // =========================================================================
    // STEP 1: Get user from server session (cookies)
    // =========================================================================
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // =========================================================================
    // STEP 2: Get org via service role
    // =========================================================================
    const adminClient = createAdminClient()
    const { data: org } = await adminClient
      .from("organisations")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!org?.id) {
      return NextResponse.json({ error: "Organisation not found" }, { status: 400 })
    }

    // =========================================================================
    // STEP 3: Validate + insert job
    // =========================================================================
    const body = await request.json()

    if (!body.title || !body.description) {
      return NextResponse.json(
        { success: false, error: "Title and description are required" },
        { status: 400 }
      )
    }

    const newJob = {
      id: uuidv4(),
      title: body.title,
      description: body.description,
      requirements: body.requirements || null,
      benefits: body.benefits || null,
      location: body.location || null,
      employment_type: body.employment_type || body.job_type || "full-time",
      company: body.company_name || body.company || null,
      skills: Array.isArray(body.skills) ? body.skills : [],
      technical_skills: body.technical_skills || null,
      experience_level: body.experience_level || null,
      salary_min: body.salary_min || null,
      salary_max: body.salary_max || null,
      salary_range: body.salary_range || null,
      status: "open",
      organisation_id: org.id,
      created_by: user.id,
      source_type: body.source_type || "manual",
      source_url: body.source_url || null,
      source_filename: body.source_filename || null,
    }

    const { data: savedJob, error } = await adminClient
      .from("jobs")
      .insert(newJob)
      .select()
      .single()

    if (error) {
      console.error("❌ [API] Job insert error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("✅ [API] Job created:", savedJob.id)
    return NextResponse.json({ success: true, job: savedJob, message: "Job created successfully" })
  } catch (error: any) {
    console.error("❌ [API] POST /jobs error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "Job ID is required" }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from("jobs")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to update job" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Job ID is required" }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient.from("jobs").delete().eq("id", id)

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

import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"
import { getOrgId } from "@/lib/get-org-id"

// Helper function to get user-specific jobs from localStorage
const getUserJobs = (organisationId: string): any[] => {
  try {
    if (typeof window === "undefined") {
      // Server-side: return mock data
      return getMockJobs().filter((job) => job.organisation_id === organisationId)
    }

    // Try multiple possible keys for backward compatibility
    const possibleKeys = [
      `recruitify_jobs_${organisationId}`,
      `recruitify_jobs_office_example_com`, // Your specific account
      `recruitify_jobs_sample`,
      "recruitify_jobs",
    ]

    let allJobs: any[] = []

    for (const key of possibleKeys) {
      const stored = localStorage.getItem(key)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            // Merge without duplicates
            const newJobs = parsed.filter((job) => !allJobs.some((existing) => existing.id === job.id))
            allJobs = [...allJobs, ...newJobs]
          }
        } catch (e) {
          console.error(`Error parsing ${key}:`, e)
        }
      }
    }

    return allJobs
  } catch (error) {
    console.error("Error getting user jobs:", error)
    return getMockJobs().filter((job) => job.organisation_id === organisationId)
  }
}

// Helper function to save user-specific jobs to localStorage
const saveUserJobs = (organisationId: string, jobs: any[]): void => {
  try {
    if (typeof window === "undefined") return

    // Save to multiple keys for redundancy
    const keys = [
      "recruitify_jobs",
      `recruitify_jobs_${organisationId}`,
      `recruitify_jobs_office_example_com`, // Ensure your account always has a backup
    ]

    for (const key of keys) {
      localStorage.setItem(key, JSON.stringify(jobs))
    }
  } catch (error) {
    console.error("Error saving user jobs:", error)
  }
}

// Mock jobs data for fallback
const getMockJobs = () => [
  {
    id: "job_1751665251474_1",
    title: "Senior Frontend Developer",
    company: "TechCorp Solutions",
    location: "San Francisco, CA",
    job_type: "full-time",
    salary_range: "$120,000 - $160,000",
    description:
      "We are looking for a Senior Frontend Developer to join our dynamic team. You will be responsible for developing user-facing web applications using modern JavaScript frameworks.",
    requirements:
      "5+ years of experience with React.js\nStrong knowledge of JavaScript, HTML, CSS\nExperience with TypeScript\nFamiliarity with modern build tools\nUnderstanding of responsive design principles",
    benefits:
      "Competitive salary and equity\nHealth, dental, and vision insurance\nFlexible working hours\nProfessional development budget\nRemote work options",
    skills: "React, JavaScript, TypeScript, HTML, CSS, Git",
    technical_skills: "React, JavaScript, TypeScript, HTML, CSS, Git",
    experience_level: "Senior",
    status: "active",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    organisation_id: "sample-org",
    created_by: "sample-user",
    applications_count: 24,
    matches_count: 8,
  },
  {
    id: "job_1751665251474_2",
    title: "Full Stack Engineer",
    company: "StartupXYZ",
    location: "New York, NY",
    job_type: "full-time",
    salary_range: "$100,000 - $140,000",
    description:
      "Join our fast-growing startup as a Full Stack Engineer. You'll work on both frontend and backend systems, helping to scale our platform.",
    requirements:
      "3+ years of full-stack development experience\nProficiency in Node.js and React\nExperience with databases (PostgreSQL, MongoDB)\nKnowledge of cloud platforms (AWS, Azure)\nStrong problem-solving skills",
    benefits: "Equity package\nHealth insurance\nUnlimited PTO\nLearning and development stipend\nCatered meals",
    skills: "Node.js, React, PostgreSQL, MongoDB, AWS, Docker",
    technical_skills: "Node.js, React, PostgreSQL, MongoDB, AWS, Docker",
    experience_level: "Mid-level",
    status: "active",
    created_at: "2024-01-14T09:00:00Z",
    updated_at: "2024-01-14T09:00:00Z",
    organisation_id: "sample-org",
    created_by: "sample-user",
    applications_count: 18,
    matches_count: 6,
  },
  {
    id: "job_1751665251474_3",
    title: "Product Manager",
    company: "InnovateCorp",
    location: "Remote",
    job_type: "full-time",
    salary_range: "$90,000 - $120,000",
    description:
      "We're seeking a Product Manager to drive product strategy and execution. You'll work closely with engineering, design, and business teams.",
    requirements:
      "3+ years of product management experience\nStrong analytical and communication skills\nExperience with agile methodologies\nData-driven decision making\nCustomer-focused mindset",
    benefits: "Remote work\nHealth benefits\nStock options\nProfessional development\nFlexible schedule",
    skills: "Product Strategy, Analytics, Agile, Roadmapping, User Research",
    technical_skills: "Product Strategy, Analytics, Agile, Roadmapping, User Research",
    experience_level: "Mid-level",
    status: "active",
    created_at: "2024-01-13T08:00:00Z",
    updated_at: "2024-01-13T08:00:00Z",
    organisation_id: "sample-org",
    created_by: "sample-user",
    applications_count: 12,
    matches_count: 4,
  },
]

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: org } = await supabaseAdmin
      .from("organisations")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!org?.id) {
      return NextResponse.json({ success: true, jobs: [], total: 0 })
    }

    const { data: jobs, error } = await supabaseAdmin
      .from("jobs")
      .select("*")
      .eq("organisation_id", org.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Jobs fetch error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, jobs: jobs ?? [], total: jobs?.length ?? 0 })
  } catch (error: any) {
    console.error("❌ Jobs API GET Error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch jobs", jobs: [], total: 0 }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log("=== POST /api/jobs called ===")
  console.log("Headers:", Object.fromEntries(request.headers))
  try {
    console.log("📋 Jobs API - POST request received")

    // Verify Bearer token and resolve real user
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (!user || userError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: org } = await supabaseAdmin
      .from("organisations")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!org?.id) {
      return NextResponse.json({ error: "Organisation not found" }, { status: 400 })
    }

    const body = await request.json()

    if (!body.title || !body.description) {
      return NextResponse.json(
        { success: false, error: "Title and description are required" },
        { status: 400 },
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
      salary_min: body.salary_min || null,
      salary_max: body.salary_max || null,
      status: "open",
      organisation_id: org.id,
      created_by: user.id,
    }

    const { data: savedJob, error } = await supabaseAdmin
      .from("jobs")
      .insert(newJob)
      .select()
      .single()

    if (error) {
      console.error("❌ Supabase job insert error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("✅ Job created in Supabase with ID:", savedJob.id)

    return NextResponse.json({
      success: true,
      job: savedJob,
      message: "Job created successfully",
    })
  } catch (error: any) {
    console.error("Job insert error details:", error.message, error.code)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("=== ✏️ Jobs API PUT Called ===")

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "Job ID is required" }, { status: 400 })
    }

    const organisationId = updates.organisation_id || await getOrgId()
    if (!organisationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get existing jobs
    const existingJobs = getUserJobs(organisationId)
    const jobIndex = existingJobs.findIndex((job) => job.id === id)

    if (jobIndex === -1) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 })
    }

    // Update the job
    const updatedJob = {
      ...existingJobs[jobIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    existingJobs[jobIndex] = updatedJob

    // Save updated jobs
    saveUserJobs(organisationId, existingJobs)

    console.log("✅ Job updated:", id)

    return NextResponse.json({
      success: true,
      job: updatedJob,
      source: "localStorage",
    })
  } catch (error) {
    console.error("❌ Jobs API PUT Error:", error)
    return NextResponse.json({ success: false, error: "Failed to update job" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("=== 🗑️ Jobs API DELETE Called ===")

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const organisationId = searchParams.get("organisationId") || await getOrgId()
    if (!organisationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "Job ID is required" }, { status: 400 })
    }

    // Get existing jobs
    const existingJobs = getUserJobs(organisationId)
    const filteredJobs = existingJobs.filter((job) => job.id !== id)

    if (filteredJobs.length === existingJobs.length) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 })
    }

    // Save updated jobs
    saveUserJobs(organisationId, filteredJobs)

    console.log("✅ Job deleted:", id)

    return NextResponse.json({
      success: true,
      source: "localStorage",
    })
  } catch (error) {
    console.error("❌ Jobs API DELETE Error:", error)
    return NextResponse.json({ success: false, error: "Failed to delete job" }, { status: 500 })
  }
}

// App Router configuration exports
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

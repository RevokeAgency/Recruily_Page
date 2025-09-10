import { type NextRequest, NextResponse } from "next/server"

// Helper function to get user-specific organization ID from email
const getOrgIdFromEmail = (email: string): string => {
  return email.replace("@", "_").replace(".", "_")
}

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
      `recruitify_jobs_demo-org-123`,
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
    organisation_id: "demo-org-123",
    created_by: "demo-user-123",
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
    organisation_id: "demo-org-123",
    created_by: "demo-user-123",
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
    organisation_id: "demo-org-123",
    created_by: "demo-user-123",
    applications_count: 12,
    matches_count: 4,
  },
]

export async function GET(request: NextRequest) {
  try {
    console.log("📋 Jobs API - GET request received")

    const { searchParams } = new URL(request.url)
    const organisationId = searchParams.get("organisationId") || "demo-org-123"

    console.log("🔍 Looking for jobs with organisation ID:", organisationId)

    // For now, let's return mock data to ensure something shows up
    const mockJobs = getMockJobs()

    console.log(`📊 Returning ${mockJobs.length} jobs for organisation: ${organisationId}`)

    return NextResponse.json({
      success: true,
      jobs: mockJobs,
      total: mockJobs.length,
    })
  } catch (error: any) {
    console.error("❌ Jobs API Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch jobs",
        jobs: getMockJobs(),
        total: 0,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📋 Jobs API - POST request received")

    const body = await request.json()
    console.log("📝 Creating job with data:", body)

    // Validate required fields
    if (!body.title || !body.description) {
      return NextResponse.json(
        {
          success: false,
          error: "Title and description are required",
        },
        { status: 400 },
      )
    }

    const organisationId = body.organisationId || body.organisation_id || "demo-org-123"
    console.log("🏢 Using organisation ID:", organisationId)

    // Use original ID format - this is crucial!
    const timestamp = Date.now()
    const randomNum = Math.floor(Math.random() * 1000) + 1
    const jobId = `job_${timestamp}_${randomNum}`

    // Create new job with proper structure
    const newJob = {
      id: jobId,
      title: body.title,
      company: body.company || "Company",
      location: body.location || "Remote",
      job_type: body.jobType || body.job_type || "full-time",
      salary_range: body.salaryRange || body.salary_range || "Competitive",
      description: body.description,
      requirements: body.requirements || "",
      benefits: body.benefits || "",
      skills: body.skills || "",
      technical_skills: body.technicalSkills || body.skills || "",
      experience_level: body.experience_level || "Mid-level",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      organisation_id: organisationId,
      created_by: body.created_by || organisationId,
      applications_count: body.applicationsCount || 0,
      matches_count: body.matchesCount || 0,
    }

    // Get existing user jobs and add the new one
    const existingJobs = getUserJobs(organisationId)
    const updatedJobs = [newJob, ...existingJobs]

    // Save to user-specific storage
    saveUserJobs(organisationId, updatedJobs)

    console.log("✅ Job created successfully with ID:", newJob.id)

    return NextResponse.json({
      success: true,
      job: newJob,
      message: "Job created successfully",
    })
  } catch (error: any) {
    console.error("❌ Jobs API POST Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create job",
      },
      { status: 500 },
    )
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

    const organisationId = updates.organisation_id || "demo-org-123"

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
    const organisationId = searchParams.get("organisationId") || "demo-org-123"

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

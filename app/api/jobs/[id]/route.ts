import { type NextRequest, NextResponse } from "next/server"

// This should match the storage from the main jobs route
// In a real app, this would query the same database
const MOCK_JOBS = [
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
    experience_level: "Senior",
    status: "active",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    organisation_id: "sample-org",
    created_by: "sample-user",
  },
]

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("📋 Jobs API - GET single job:", params.id)

    // Try to find job in mock data first
    let job = MOCK_JOBS.find((j) => j.id === params.id)

    // If not found in mock data, try localStorage (for newly created jobs)
    if (!job) {
      try {
        // In a server environment, we can't access localStorage directly
        // So we'll create a fallback job based on the ID
        console.log("Job not found in mock data, creating fallback")

        job = {
          id: params.id,
          title: "Software Developer",
          company: "Tech Company",
          location: "Berlin, Germany",
          job_type: "full-time",
          salary_range: "€50,000 - €70,000",
          description: "We are looking for a talented software developer to join our team.",
          requirements: "Experience with JavaScript, React, and Node.js required.",
          benefits: "Health insurance, flexible hours, remote work options",
          skills: "JavaScript, React, Node.js, Git",
          experience_level: "Mid-level",
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          organisation_id: "sample-org",
          created_by: "sample-user",
        }
      } catch (error) {
        console.error("Error creating fallback job:", error)
      }
    }

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: "Job not found",
        },
        { status: 404 },
      )
    }

    console.log("✅ Job found:", job.title)

    return NextResponse.json({
      success: true,
      job,
    })
  } catch (error: any) {
    console.error("❌ Jobs API single GET Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch job",
      },
      { status: 500 },
    )
  }
}

// App Router configuration exports
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

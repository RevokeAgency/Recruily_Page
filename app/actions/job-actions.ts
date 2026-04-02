"use server"

import { createServerSupabaseClient } from "@/lib/supabaseServer"
import { revalidatePath } from "next/cache"

export async function createJob(formData: FormData) {
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const requirements = formData.get("requirements") as string
  const location = formData.get("location") as string
  const jobType = formData.get("jobType") as string
  const salaryRange = formData.get("salaryRange") as string
  const organisationId = formData.get("organisationId") as string

  if (!title || !description) {
    return { error: "Title and description are required" }
  }

  const supabase = createServerSupabaseClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // For demo purposes, we'll create the job without checking membership
  // In a real app, you would check if the user has access to this organisation

  // Create the job
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert({
      title,
      description,
      requirements,
      location,
      job_type: jobType,
      salary_range: salaryRange,
      organisation_id: organisationId,
      created_by: user.id,
      status: "active",
    })
    .select()
    .single()

  if (jobError) {
    return { error: jobError.message }
  }

  // Generate some dummy matches for the new job
  await generateDummyMatches(supabase, job.id, organisationId)

  revalidatePath("/dashboard/jobs")
  return { success: true, job }
}

export async function matchCandidates(formData: FormData) {
  const jobId = formData.get("jobId") as string

  const supabase = createServerSupabaseClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Call the match-job-candidates function
  const { data, error } = await supabase.functions.invoke("match-job-candidates", {
    body: { jobId },
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/jobs/${jobId}`)
  revalidatePath("/dashboard/matches")
  return { success: true, matches: data.matches }
}

// Add a helper function to generate dummy matches
async function generateDummyMatches(supabase: any, jobId: string, organisationId: string) {
  const dummyNames = [
    "Emma Johnson",
    "Liam Smith",
    "Olivia Williams",
    "Noah Brown",
    "Ava Jones",
    "Sophia Miller",
    "Jackson Davis",
    "Isabella Wilson",
    "Lucas Moore",
    "Mia Taylor",
    "Aiden Anderson",
    "Charlotte Thomas",
    "Ethan Jackson",
    "Amelia White",
    "Mason Harris",
  ]

  const dummyStrengths = [
    ["Technical Skills", "Problem Solving", "Teamwork"],
    ["Communication", "Leadership", "Adaptability"],
    ["Creativity", "Time Management", "Technical Skills"],
    ["Problem Solving", "Communication", "Leadership"],
    ["Teamwork", "Adaptability", "Creativity"],
  ]

  const dummyStages = ["New", "Interview", "Offer", "Rejected"]

  // Create 10-15 dummy candidates with matches
  const numCandidates = Math.floor(Math.random() * 6) + 10 // 10-15 candidates

  for (let i = 0; i < numCandidates; i++) {
    const name = dummyNames[Math.floor(Math.random() * dummyNames.length)]
    const email = name.toLowerCase().replace(" ", ".") + "@example.com"

    // Create candidate
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .insert({
        name,
        email,
        organisation_id: organisationId,
        status: "active",
      })
      .select()
      .single()

    if (candidateError) continue

    // Create match
    const score = Math.floor(Math.random() * 51) + 50 // 50-100
    const strengths = dummyStrengths[Math.floor(Math.random() * dummyStrengths.length)]
    const stage = dummyStages[Math.floor(Math.random() * (dummyStages.length - 1))] // Exclude "Rejected" most of the time

    await supabase.from("matches").insert({
      job_id: jobId,
      candidate_id: candidate.id,
      score,
      strengths,
      stage,
      result: {
        skills_match: Math.floor(Math.random() * 51) + 50,
        experience_match: Math.floor(Math.random() * 51) + 50,
        education_match: Math.floor(Math.random() * 51) + 50,
        overall_assessment: "This candidate has a good match for the position based on their skills and experience.",
      },
      organisation_id: organisationId,
    })
  }
}

"use server"

import { createServerSupabaseClient } from "@/lib/supabase.server"
import { revalidatePath } from "next/cache"

export async function createCandidate(formData: FormData) {
  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const location = formData.get("location") as string
  const notes = formData.get("notes") as string
  const organisationId = formData.get("organisationId") as string

  const supabase = await createServerSupabaseClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Check if the user has access to this organisation
  const { data: membership, error: membershipError } = await supabase
    .from("members")
    .select()
    .eq("user_id", user.id)
    .eq("organisation_id", organisationId)
    .single()

  if (membershipError || !membership) {
    return { error: "You do not have access to this organisation" }
  }

  // Create the candidate
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .insert({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      location,
      notes,
      organisation_id: organisationId,
      created_by: user.id,
      status: "new",
    })
    .select()
    .single()

  if (candidateError) {
    return { error: candidateError.message }
  }

  revalidatePath("/dashboard/candidates")
  return { success: true, candidate }
}

export async function uploadResume(formData: FormData) {
  const file = formData.get("file") as File
  const candidateId = formData.get("candidateId") as string

  if (!file || !candidateId) {
    return { error: "File and candidate ID are required" }
  }

  const supabase = await createServerSupabaseClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Get the candidate to verify access
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("organisation_id")
    .eq("id", candidateId)
    .single()

  if (candidateError || !candidate) {
    return { error: "Candidate not found" }
  }

  // Check if the user has access to this organisation
  const { data: membership, error: membershipError } = await supabase
    .from("members")
    .select()
    .eq("user_id", user.id)
    .eq("organisation_id", candidate.organisation_id)
    .single()

  if (membershipError || !membership) {
    return { error: "You do not have access to this candidate" }
  }

  // Upload the file to storage
  const fileExt = file.name.split(".").pop()
  const fileName = `${candidateId}/${Date.now()}.${fileExt}`

  const { data: uploadData, error: uploadError } = await supabase.storage.from("resumes").upload(fileName, file)

  if (uploadError) {
    return { error: uploadError.message }
  }

  // Create a resume record
  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .insert({
      candidate_id: candidateId,
      file_path: fileName,
      file_name: file.name,
      file_type: file.type,
    })
    .select()
    .single()

  if (resumeError) {
    return { error: resumeError.message }
  }

  // Call the parse-resume function to extract data
  const { data: parseData, error: parseError } = await supabase.functions.invoke("parse-resume", {
    body: { candidateId, fileId: fileName },
  })

  if (parseError) {
    console.error("Error parsing resume:", parseError)
    // Continue anyway, parsing can be retried later
  }

  revalidatePath(`/dashboard/candidates/${candidateId}`)
  return { success: true, resume }
}

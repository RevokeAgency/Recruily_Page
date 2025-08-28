import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createSupabaseClient } from "../utils/supabase-client.ts"

serve(async (req: Request) => {
  try {
    // Check if request is a valid POST request
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get the current user from the JWT
    const supabase = createSupabaseClient(req)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Parse the multipart form data
    const formData = await req.formData()
    const file = formData.get("file") as File
    const candidateId = formData.get("candidateId") as string

    if (!file || !candidateId) {
      return new Response(JSON.stringify({ error: "File and candidate ID are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get the candidate to verify access
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("organisation_id")
      .eq("id", candidateId)
      .single()

    if (candidateError || !candidate) {
      return new Response(JSON.stringify({ error: "Candidate not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Check if the user has access to this organisation
    const { data: membership, error: membershipError } = await supabase
      .from("members")
      .select()
      .eq("user_id", user.id)
      .eq("organisation_id", candidate.organisation_id)

    if (membershipError || !membership || membership.length === 0) {
      return new Response(JSON.stringify({ error: "You do not have access to this candidate" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Generate a unique file path
    const fileExt = file.name.split(".").pop()
    const filePath = `${candidateId}/${crypto.randomUUID()}.${fileExt}`

    // Upload the file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage.from("resumes").upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

    if (uploadError) {
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Create a resume record
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .insert({
        candidate_id: candidateId,
        file_path: filePath,
        file_name: file.name,
        file_type: file.type
      })
      .select()
      .single();

    if (resumeError) {
      return new Response(JSON.stringify({ error: resumeError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(
      JSON.stringify({
        message: "Resume uploaded successfully",
        resume,
        file: uploadData,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

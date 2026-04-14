import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../utils/cors.ts"

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    )

    // Get the JWT from the request
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      })
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      })
    }

    // Get the request body
    const { jobId } = await req.json()

    if (!jobId) {
      return new Response(JSON.stringify({ error: "Job ID is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      })
    }

    // Get the job to check access
    const { data: job, error: jobError } = await supabaseClient
      .from("job_postings")
      .select("organisation_id")
      .eq("id", jobId)
      .single()

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      })
    }

    // Check if the user has access to this organisation
    const { data: membership, error: membershipError } = await supabaseClient
      .from("members")
      .select()
      .eq("user_id", user.id)
      .eq("organisation_id", job.organisation_id)
      .single()

    if (membershipError || !membership) {
      return new Response(JSON.stringify({ error: "You do not have access to this job" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      })
    }

    // Get all candidates for this organisation
    const { data: candidates, error: candidatesError } = await supabaseClient
      .from("candidates")
      .select(`
        *,
        resumes (*)
      `)
      .eq("organisation_id", job.organisation_id)

    if (candidatesError) {
      return new Response(JSON.stringify({ error: candidatesError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      })
    }

    // For each candidate, calculate a match score and create a match record
    const matches = []
    for (const candidate of candidates || []) {
      // Calculate a match score (in a real app, this would be more sophisticated)
      const matchScore = Math.random() * 0.3 + 0.7 // Random score between 0.7 and 1.0

      // Create match details
      const matchDetails = {
        skills_match: Math.random() * 0.3 + 0.7,
        experience_match: Math.random() * 0.3 + 0.7,
        education_match: Math.random() * 0.3 + 0.7,
      }

      // Insert the match
      const { data: match, error: matchError } = await supabaseClient
        .from("matches")
        .insert({
          job_id: jobId,
          candidate_id: candidate.id,
          match_score: matchScore,
          match_details: matchDetails,
          status: "new",
        })
        .select()
        .single()

      if (matchError) {
        console.error("Error creating match:", matchError)
        continue
      }

      matches.push(match)
    }

    return new Response(JSON.stringify({ matches }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 201,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})

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

    // Get the request body
    const { resumeId } = await req.json()

    if (!resumeId) {
      return new Response(JSON.stringify({ error: "Resume ID is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      })
    }

    // Get the resume
    const { data: resume, error: resumeError } = await supabaseClient
      .from("resumes")
      .select("*")
      .eq("id", resumeId)
      .single()

    if (resumeError || !resume) {
      return new Response(JSON.stringify({ error: "Resume not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      })
    }

    // In a real application, we would extract text from the resume file and use AI to parse it
    // For this demo, we'll just generate some fake parsed data
    const skills = [
      "JavaScript",
      "TypeScript",
      "React",
      "Node.js",
      "Python",
      "SQL",
      "AWS",
      "Docker",
      "Kubernetes",
      "CI/CD",
      "Git",
      "Agile",
      "Scrum",
    ]

    const randomSkills = []
    const skillCount = Math.floor(Math.random() * 5) + 3 // 3-7 skills
    for (let i = 0; i < skillCount; i++) {
      const randomIndex = Math.floor(Math.random() * skills.length)
      randomSkills.push(skills[randomIndex])
    }

    const parsedData = {
      summary: "This is an automatically generated summary of the candidate's resume.",
      years_experience: Math.floor(Math.random() * 10) + 1,
      education: [
        {
          institution: "Example University",
          degree: "Bachelor of Science",
          field: "Computer Science",
          year: 2018,
        },
      ],
      experience: [
        {
          company: "Example Corp",
          title: "Software Engineer",
          start_date: "2018-06",
          end_date: "2021-12",
          description: "Worked on various software projects.",
        },
        {
          company: "Tech Innovators",
          title: "Senior Developer",
          start_date: "2022-01",
          end_date: null, // Current job
          description: "Leading development of new products.",
        },
      ],
    }

    // Update the resume with the parsed data
    const { data: updatedResume, error: updateError } = await supabaseClient
      .from("resumes")
      .update({
        parsed_data: parsedData,
        skills: randomSkills,
        experience: parsedData.experience,
        education: parsedData.education,
      })
      .eq("id", resumeId)
      .select()
      .single()

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      })
    }

    return new Response(JSON.stringify({ resume: updatedResume }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})

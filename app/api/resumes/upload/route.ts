import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/server-supabase"
import { analyzePDFContent, extractTextFromPDF } from "@/lib/gemini-ai"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const candidateId = formData.get("candidateId") as string

    if (!file || !candidateId) {
      return NextResponse.json({ error: "File and candidate ID are required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get the candidate to verify access
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("organisation_id")
      .eq("id", candidateId)
      .single()

    if (candidateError || !candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    // Check if the user has access to this organisation
    const { data: membership, error: membershipError } = await supabase
      .from("members")
      .select()
      .eq("user_id", user.id)
      .eq("organisation_id", candidate.organisation_id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: "You do not have access to this candidate" }, { status: 403 })
    }

    // Upload the file to storage
    const fileExt = file.name.split(".").pop()
    const fileName = `${candidateId}/${Date.now()}.${fileExt}`
    const fileBuffer = await file.arrayBuffer()

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Extract text from PDF and analyze with Gemini
    let parsedData = null
    let skills: string[] = []
    let experience: any[] = []
    let education: any[] = []

    try {
      // Extract text from PDF
      const pdfText = await extractTextFromPDF(file)

      // Analyze with Gemini AI
      const candidateProfile = await analyzePDFContent(pdfText)

      parsedData = {
        summary: candidateProfile.summary,
        years_experience: candidateProfile.yearsOfExperience,
        name: candidateProfile.name,
        email: candidateProfile.email,
        phone: candidateProfile.phone,
        location: candidateProfile.location,
        certifications: candidateProfile.certifications,
        languages: candidateProfile.languages,
      }

      skills = candidateProfile.skills || []
      experience = candidateProfile.experience || []
      education = candidateProfile.education || []

      // Update candidate with extracted information
      await supabase
        .from("candidates")
        .update({
          name: candidateProfile.name || candidate.name,
          email: candidateProfile.email || candidate.email,
          phone: candidateProfile.phone || candidate.phone,
          location: candidateProfile.location || candidate.location,
          skills: skills.join(", "),
          experience_years: candidateProfile.yearsOfExperience,
        })
        .eq("id", candidateId)
    } catch (aiError) {
      console.error("Error analyzing PDF with Gemini:", aiError)
      // Continue with basic resume record creation even if AI analysis fails
      parsedData = {
        summary: "Resume uploaded successfully. AI analysis failed.",
        years_experience: 0,
      }
    }

    // Create a resume record
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .insert({
        candidate_id: candidateId,
        file_path: fileName,
        file_name: file.name,
        file_type: file.type,
        parsed_data: parsedData,
        skills: skills,
        experience: experience,
        education: education,
      })
      .select()
      .single()

    if (resumeError) {
      return NextResponse.json({ error: resumeError.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        resume,
        message: "Resume uploaded and analyzed successfully",
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Resume upload error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// App Router configuration exports
export const dynamic = "force-dynamic"
export const runtime = "nodejs" 
export const maxDuration = 60

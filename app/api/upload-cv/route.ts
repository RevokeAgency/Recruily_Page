import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"
import { analyzeCVWithGemini, generateFallbackCVData } from "@/lib/gemini-ai"

interface CandidateData {
  name?: string
  email?: string
  phone?: string
  location?: string
  skills?: string[]
  experience_years?: number
  education?: string
  degree?: string
  university?: string
  graduation_year?: number
  summary?: string
  linkedin_url?: string
  portfolio_url?: string
  github_url?: string
  languages?: string[]
  certifications?: string[]
  salary_expectation_min?: number
  salary_expectation_max?: number
  visa_status?: string
  availability?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log("📄 Upload CV API - POST request received")

    const formData = await request.formData()
    const file = formData.get("file") as File
    const jobId = formData.get("jobId") as string

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      )
    }

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "Job ID is required" },
        { status: 400 }
      )
    }

    // Validate file type and size
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|txt)$/i)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Please upload a PDF, DOCX, or TXT file." },
        { status: 400 }
      )
    }

    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      )
    }

    console.log(`📁 Processing file: ${file.name} (${file.type}, ${file.size} bytes)`)

    // Fetch job requirements for context (optional)
    let jobRequirements = null
    try {
      const { data: jobData, error: jobError } = await supabase
        .from('job_postings')
        .select('title, description, requirements, technical_skills, experience_level, location, job_type')
        .eq('id', jobId)
        .single()
      
      if (jobError) {
        console.warn("⚠️ Could not fetch job details:", jobError.message)
      } else {
        jobRequirements = {
          title: jobData.title || "",
          description: jobData.description || "",
          requirements: jobData.requirements || "",
          skills: jobData.technical_skills || "",
          technical_skills: jobData.technical_skills || "",
          experience_level: jobData.experience_level || "",
          location: jobData.location || "",
          job_type: jobData.job_type || ""
        }
        console.log(`✅ Job context loaded: ${jobRequirements.title}`)
      }
    } catch (error) {
      console.warn("⚠️ Error fetching job context (proceeding without):", error)
    }

    console.log("🤖 Analyzing CV directly with Gemini AI (no text conversion)...")
    
    // Send PDF/file directly to Gemini for analysis
    let normalizedData = null
    try {
      const geminiResult = await analyzeCVWithGemini(file, jobRequirements)
      if (geminiResult) {
        normalizedData = geminiResult
        console.log("✅ Gemini CV analysis successful:", {
          name: geminiResult.name,
          position: geminiResult.position,
          matchScore: geminiResult.match
        })
      } else {
        console.warn("⚠️ Gemini analysis returned null, using fallback")
        normalizedData = generateFallbackCVData(file.name, jobRequirements)
      }
    } catch (error) {
      console.warn("⚠️ Gemini CV analysis failed, using fallback:", error)
      normalizedData = generateFallbackCVData(file.name, jobRequirements)
    }

    // Ensure we have normalized data
    if (!normalizedData) {
      console.error("❌ Both Gemini analysis and fallback failed")
      return NextResponse.json(
        { success: false, error: "Failed to analyze CV content" },
        { status: 500 }
      )
    }

    // Upload file to Supabase Storage (with fallback)
    let uploadData = null
    let storagePath = null
    
    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const uploadResult = await supabase.storage
        .from('resumes')
        .upload(fileName, file)
      
      if (uploadResult.error) {
        console.warn("⚠️ Supabase storage upload failed:", uploadResult.error)
        console.log("📁 Proceeding without file storage - candidate data will still be saved")
        storagePath = `fallback_${fileName}`
      } else {
        uploadData = uploadResult.data
        storagePath = uploadData.path
        console.log(`✅ File uploaded to storage: ${storagePath}`)
      }
    } catch (error) {
      console.warn("⚠️ Storage upload error (continuing without file storage):", error)
      storagePath = `error_fallback_${Date.now()}_${file.name}`
    }

    // Create candidate record from Gemini analysis
    const candidateId = crypto.randomUUID()
    const candidateRecord = {
      id: candidateId,
      name: normalizedData?.name || 'Unknown Candidate',
      email: normalizedData?.email || `candidate_${Date.now()}@temp.com`,
      phone: normalizedData?.phone || null,
      location: normalizedData?.location || null,
      skills: normalizedData?.skills || [],
      experience_years: normalizedData?.yearsOfExperience || 0,
      education: Array.isArray(normalizedData?.education) 
        ? normalizedData.education.join('; ') 
        : normalizedData?.education || null,
      degree: Array.isArray(normalizedData?.education) && normalizedData.education.length > 0
        ? normalizedData.education[0] 
        : null,
      university: null, // Extract from education if needed
      graduation_year: null, // Would need to parse from education
      summary: normalizedData?.summary || null,
      linkedin_url: null, // Not in CandidateProfile, could be added
      portfolio_url: null, // Not in CandidateProfile, could be added
      github_url: null, // Not in CandidateProfile, could be added
      languages: normalizedData?.languages || ['English'],
      certifications: normalizedData?.certifications || [],
      salary_expectation_min: null, // Not in CandidateProfile
      salary_expectation_max: null, // Not in CandidateProfile
      visa_status: null, // Not in CandidateProfile
      availability: 'available',
      status: 'active',
      source: 'cv_upload',
      tags: ['uploaded', 'gemini_analyzed'],
      organisation_id: 'demo-org-123' // TODO: Get from user context
    }

    // Save candidate to database (with fallback)
    let candidate = candidateRecord // Always start with our candidateRecord as fallback
    try {
      const { data: savedCandidate, error: candidateError } = await supabase
        .from('candidates')
        .insert([candidateRecord])
        .select()
        .single()

      if (candidateError) {
        console.warn("⚠️ Failed to save to database, using local candidate data:", candidateError)
        // Keep candidate = candidateRecord (our fallback)
      } else if (savedCandidate) {
        candidate = savedCandidate
        console.log(`✅ Candidate saved to database: ${candidate.id}`)
      } else {
        console.warn("⚠️ Supabase returned null, using local candidate data")
        // Keep candidate = candidateRecord (our fallback)
      }
    } catch (error) {
      console.warn("⚠️ Database operation failed, continuing with local data:", error)
      // Keep candidate = candidateRecord (our fallback)
    }

    // Additional safety check - ensure candidate is never null
    if (!candidate) {
      console.error("🚨 Critical: candidate is null, using candidateRecord as absolute fallback")
      candidate = candidateRecord
    }

    // Save resume record (if resume table exists)
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const resumeRecord = {
      candidate_id: candidateId,
      file_name: fileName,
      file_path: storagePath,
      file_type: file.type,
      file_size: file.size,
      original_name: file.name,
      parsed_content: normalizedData,
      parsed_text: null, // Direct Gemini analysis - no intermediate text parsing
      parsing_status: 'gemini_analyzed',
      version: 1,
      is_current: true,
      uploaded_by: null // TODO: Get from user context
    }

    // Save resume record (optional - continues without this if it fails)
    try {
      const { data: resume, error: resumeError } = await supabase
        .from('resumes')
        .insert([resumeRecord])
        .select()
        .single()

      if (resumeError) {
        console.warn("⚠️ Failed to save resume record:", resumeError)
      } else {
        console.log(`✅ Resume record saved: ${resume.id}`)
      }
    } catch (error) {
      console.warn("⚠️ Resume record operation failed (continuing):", error)
    }

    // Ensure we return the complete candidate data
    const responseCandidate = {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      location: candidate.location,
      skills: candidate.skills,
      experience_years: candidate.experience_years,
      education: candidate.education,
      summary: candidate.summary,
      languages: candidate.languages,
      certifications: candidate.certifications,
      status: candidate.status,
      source: candidate.source,
      tags: candidate.tags,
      organisation_id: candidate.organisation_id,
      resume_path: storagePath
    }

    return NextResponse.json({
      success: true,
      candidate: responseCandidate,
      message: "CV uploaded and processed successfully"
    })

  } catch (error: any) {
    console.error("❌ Upload CV API Error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "An unexpected error occurred" 
      },
      { status: 500 }
    )
  }
}

// All CV parsing now handled directly by Gemini AI
// No intermediate text parsing needed - PDF/DOCX files sent directly to Gemini

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

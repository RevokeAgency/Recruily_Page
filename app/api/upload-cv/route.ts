import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"
import { normalizeCandidateDataWithGemini } from "@/lib/gemini-ai"

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

    console.log("📋 Form data received:", {
      file: file ? `${file.name} (${file.type}, ${file.size} bytes)` : null,
      jobId: jobId
    })

    if (!file) {
      console.error("❌ No file provided in request")
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      )
    }

    if (!jobId) {
      console.error("❌ No job ID provided in request")
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

    // Parse the CV file
    const parsedData = await parseCVFile(file)
    
    if (!parsedData.success) {
      return NextResponse.json(
        { success: false, error: parsedData.error },
        { status: 400 }
      )
    }

    console.log("🤖 Normalizing candidate data with Gemini AI...")
    
    // Normalize with Gemini AI
    let normalizedData = parsedData.data
    try {
      const geminiResult = await normalizeCandidateDataWithGemini(parsedData.data!, parsedData.rawText!)
      if (geminiResult) {
        normalizedData = geminiResult
        console.log("✅ Gemini normalization successful")
      }
    } catch (error) {
      console.warn("⚠️ Gemini normalization failed, using parsed data:", error)
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

    // Create candidate record
    const candidateId = crypto.randomUUID()
    const candidateRecord = {
      id: candidateId,
      name: normalizedData?.name || 'Unknown Candidate',
      email: normalizedData?.email || `candidate_${Date.now()}@temp.com`,
      phone: normalizedData?.phone || null,
      location: normalizedData?.location || null,
      skills: normalizedData?.skills || [],
      experience_years: normalizedData?.experience_years || 0,
      education: normalizedData?.education || null,
      degree: normalizedData?.degree || null,
      university: normalizedData?.university || null,
      graduation_year: normalizedData?.graduation_year || null,
      summary: normalizedData?.summary || null,
      linkedin_url: normalizedData?.linkedin_url || null,
      portfolio_url: normalizedData?.portfolio_url || null,
      github_url: normalizedData?.github_url || null,
      languages: normalizedData?.languages || ['English'],
      certifications: normalizedData?.certifications || [],
      salary_expectation_min: normalizedData?.salary_expectation_min || null,
      salary_expectation_max: normalizedData?.salary_expectation_max || null,
      visa_status: normalizedData?.visa_status || null,
      availability: normalizedData?.availability || 'available',
      status: 'active',
      source: 'cv_upload',
      tags: ['uploaded'],
      organisation_id: 'demo-org-123' // TODO: Get from user context
    }

    // Save candidate to database (with fallback)
    let candidate = candidateRecord
    try {
      const { data: savedCandidate, error: candidateError } = await supabase
        .from('candidates')
        .insert([candidateRecord])
        .select()
        .single()

      if (candidateError) {
        console.warn("⚠️ Failed to save to database, using local candidate data:", candidateError)
        // Continue with the candidate data we have
      } else {
        candidate = savedCandidate
        console.log(`✅ Candidate saved to database: ${candidate.id}`)
      }
    } catch (error) {
      console.warn("⚠️ Database operation failed, continuing with local data:", error)
      // Continue with the candidate data we have
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
      parsed_text: parsedData.rawText,
      parsing_status: 'completed',
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

    return NextResponse.json({
      success: true,
      candidate: {
        ...candidate,
        resume_path: storagePath
      },
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

// CV parsing function
async function parseCVFile(file: File): Promise<{
  success: boolean
  data?: CandidateData
  rawText?: string
  error?: string
}> {
  try {
    console.log(`🔍 Starting to parse file: ${file.name} (${file.type})`)
    let rawText = ""

    if (file.type === "text/plain" || file.name.endsWith('.txt')) {
      console.log("📄 Parsing as TXT file")
      rawText = await file.text()
    } else if (file.type === "application/pdf" || file.name.endsWith('.pdf')) {
      console.log("📄 Parsing as PDF file")
      rawText = await parsePdfFile(file)
    } else if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith('.docx')
    ) {
      console.log("📄 Parsing as DOCX file")
      rawText = await parseDocxFile(file)
    } else {
      console.error("❌ Unsupported file format:", file.type)
      return {
        success: false,
        error: `Unsupported file format: ${file.type}. Please upload PDF, DOCX, or TXT files.`
      }
    }

    console.log(`📝 Extracted text length: ${rawText.length} characters`)

    if (!rawText.trim()) {
      console.error("❌ No text content found in file")
      return {
        success: false,
        error: "No text content found in file. The file may be corrupted or empty."
      }
    }

    if (rawText.trim().length < 20) {
      console.warn("⚠️ Very short text content extracted")
      return {
        success: false,
        error: "Insufficient text content found in file. Please ensure the CV contains readable text."
      }
    }

    // Extract candidate data from text
    console.log("🔍 Extracting candidate data from text...")
    const candidateData = extractCandidateData(rawText)
    
    console.log("✅ Candidate data extracted:", {
      name: candidateData.name,
      email: candidateData.email,
      skillsCount: candidateData.skills?.length || 0
    })

    return {
      success: true,
      data: candidateData,
      rawText: rawText
    }

  } catch (error: any) {
    console.error("❌ File parsing failed:", error)
    return {
      success: false,
      error: `Failed to parse file: ${error.message}`
    }
  }
}

// PDF parsing with dynamic import to avoid build issues
async function parsePdfFile(file: File): Promise<string> {
  try {
    console.log("🔍 Parsing PDF file:", file.name)
    const buffer = await file.arrayBuffer()
    
    // Dynamic import to avoid build issues
    const pdfParse = (await import('pdf-parse')).default
    const uint8Array = new Uint8Array(buffer)
    
    // Use pdf-parse to extract text
    const pdfData = await pdfParse(uint8Array)
    const extractedText = pdfData.text
    
    console.log(`📄 Extracted ${extractedText.length} characters from PDF`)
    
    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error("PDF appears to be empty or contains insufficient text")
    }
    
    return extractedText
  } catch (error: any) {
    console.error("❌ PDF parsing error:", error)
    throw new Error(`Failed to parse PDF file: ${error.message}`)
  }
}

// DOCX parsing with mammoth.js
async function parseDocxFile(file: File): Promise<string> {
  try {
    console.log("🔍 Parsing DOCX file:", file.name)
    const buffer = await file.arrayBuffer()
    
    // Use mammoth to extract text from DOCX
    const result = await mammoth.extractRawText({ arrayBuffer: buffer })
    const extractedText = result.value
    
    console.log(`📄 Extracted ${extractedText.length} characters from DOCX`)
    
    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error("DOCX appears to be empty or contains insufficient text")
    }
    
    // Log any warnings from mammoth
    if (result.messages.length > 0) {
      console.warn("⚠️ DOCX parsing warnings:", result.messages)
    }
    
    return extractedText
  } catch (error: any) {
    console.error("❌ DOCX parsing error:", error)
    throw new Error(`Failed to parse DOCX file: ${error.message}`)
  }
}

// Extract candidate data from raw text
function extractCandidateData(text: string): CandidateData {
  const lowerText = text.toLowerCase()
  
  return {
    name: extractName(text),
    email: extractEmail(text),
    phone: extractPhone(text),
    location: extractLocation(text),
    skills: extractSkills(lowerText),
    experience_years: extractExperienceYears(lowerText),
    education: extractEducation(text),
    summary: extractSummary(text),
    linkedin_url: extractLinkedInUrl(text),
    languages: extractLanguages(lowerText),
    certifications: extractCertifications(text)
  }
}

function extractName(text: string): string {
  // Look for name patterns at the beginning of the text
  const namePatterns = [
    /^([A-Z][a-zA-Z\s]{2,40})\n/,
    /name:\s*([A-Z][a-zA-Z\s]{2,40})/i,
    /^([A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+)/
  ]
  
  for (const pattern of namePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  return ""
}

function extractEmail(text: string): string {
  const emailPattern = /[\w\.-]+@[\w\.-]+\.\w+/
  const match = text.match(emailPattern)
  return match ? match[0] : ""
}

function extractPhone(text: string): string {
  const phonePatterns = [
    /\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
    /\+?[\d\s\-\(\)]{10,15}/
  ]
  
  for (const pattern of phonePatterns) {
    const match = text.match(pattern)
    if (match) {
      return match[0].trim()
    }
  }
  
  return ""
}

function extractLocation(text: string): string {
  const locationPatterns = [
    /(?:location|address):\s*([^\n]{5,50})/i,
    /([A-Z][a-zA-Z\s]+,\s*[A-Z]{2,3})/,
    /([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)/
  ]
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  return ""
}

function extractSkills(lowerText: string): string[] {
  const commonSkills = [
    'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue',
    'node.js', 'nodejs', 'express', 'mongodb', 'sql', 'mysql', 'postgresql',
    'html', 'css', 'git', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
    'redux', 'graphql', 'rest api', 'microservices', 'agile', 'scrum',
    'project management', 'leadership', 'communication', 'teamwork'
  ]
  
  const foundSkills: string[] = []
  
  for (const skill of commonSkills) {
    if (lowerText.includes(skill)) {
      foundSkills.push(skill)
    }
  }
  
  return foundSkills
}

function extractExperienceYears(lowerText: string): number {
  const yearPatterns = [
    /(\d+)\+?\s*years?\s*(?:of\s*)?experience/,
    /experience:\s*(\d+)\s*years?/,
    /(\d+)\s*years?\s*in\s*(?:the\s*)?field/
  ]
  
  for (const pattern of yearPatterns) {
    const match = lowerText.match(pattern)
    if (match && match[1]) {
      return parseInt(match[1], 10)
    }
  }
  
  return 0
}

function extractEducation(text: string): string {
  const educationPatterns = [
    /(?:education|degree):\s*([^\n]{10,100})/i,
    /(bachelor|master|phd|doctorate).*?(?:in|of)\s*([^\n]{5,50})/i,
    /(university|college|institute).*?([^\n]{10,100})/i
  ]
  
  for (const pattern of educationPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  return ""
}

function extractSummary(text: string): string {
  const summaryPatterns = [
    /(?:summary|profile|about):\s*([\s\S]{50,500}?)(?:\n\n|$)/i,
    /(?:objective|goal):\s*([\s\S]{50,300}?)(?:\n\n|$)/i
  ]
  
  for (const pattern of summaryPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  return ""
}

function extractLinkedInUrl(text: string): string {
  const linkedinPattern = /(?:linkedin\.com\/in\/|linkedin\.com\/profile\/)[A-Za-z0-9\-_]+/i
  const match = text.match(linkedinPattern)
  return match ? `https://${match[0]}` : ""
}

function extractLanguages(lowerText: string): string[] {
  const languages = ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'portuguese', 'italian', 'russian', 'arabic']
  const foundLanguages = ['english'] // Default to English
  
  for (const lang of languages) {
    if (lowerText.includes(lang) && !foundLanguages.includes(lang)) {
      foundLanguages.push(lang)
    }
  }
  
  return foundLanguages
}

function extractCertifications(text: string): string[] {
  const certPatterns = [
    /(?:certified|certification):\s*([^\n]{5,100})/gi,
    /(?:cert|certificate):\s*([^\n]{5,100})/gi
  ]
  
  const certifications: string[] = []
  
  for (const pattern of certPatterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      if (match[1]) {
        certifications.push(match[1].trim())
      }
    }
  }
  
  return certifications
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
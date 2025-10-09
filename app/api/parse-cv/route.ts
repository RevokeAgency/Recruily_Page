import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { v4 as uuidv4 } from 'uuid'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI
const getGeminiClient = () => {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING')
  }
  
  return new GoogleGenerativeAI(apiKey)
}

export async function POST(request: NextRequest) {
  console.log('🚀 Enhanced CV parsing request received')
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const jobId = formData.get('jobId') as string
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 })
    }

    if (!jobId) {
      return NextResponse.json({
        success: false,
        error: 'Job ID is required'
      }, { status: 400 })
    }

    console.log(`📄 Processing CV file: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`)

    // Validate file type and size
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: `Invalid file type: ${file.type}. Please upload PDF, DOC, DOCX, or TXT files.`
      }, { status: 400 })
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: 'File size exceeds 10MB limit'
      }, { status: 400 })
    }

    // Get job requirements for context
    let jobData = null
    try {
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('title, description, technical_skills, requirements, location, salary_range')
        .eq('id', jobId)
        .single()

      if (!jobError && job) {
        jobData = job
        console.log(`📋 Job context loaded: ${job.title}`)
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch job data:', error)
    }

    // Extract CV data using Gemini AI
    let extractedData
    try {
      extractedData = await extractCVDataWithGemini(file, jobData)
    } catch (error: any) {
      if (error.message === 'GEMINI_API_KEY_MISSING') {
        return NextResponse.json({
          success: false,
          error: 'Gemini API key is not configured. Please set up your API key in environment variables.',
          needsApiKey: true,
          instructions: {
            message: 'To use AI-powered CV parsing, please set up your free Gemini API key',
            steps: [
              'Visit https://aistudio.google.com/app/apikey',
              'Create a new API key in Google AI Studio (free)',
              'Add GEMINI_API_KEY=your_key_here to your .env.local file',
              'Restart your application'
            ]
          }
        }, { status: 400 })
      }
      
      console.error('❌ Gemini extraction error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to extract data from CV. Please check your API configuration.'
      }, { status: 500 })
    }
    
    if (!extractedData) {
      return NextResponse.json({
        success: false,
        error: 'Failed to extract data from CV. Please ensure the file contains readable text and try again.'
      }, { status: 500 })
    }

    console.log(`✅ CV data extracted successfully for: ${extractedData.candidate.name}`)

    // Generate unique candidate ID
    const candidateId = uuidv4()
    
    // Upload file to Supabase Storage
    let resumeUrl = null
    try {
      const fileName = `${candidateId}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          upsert: true
        })

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('resumes')
          .getPublicUrl(fileName)
        
        resumeUrl = urlData?.publicUrl
        console.log(`📎 File uploaded to storage: ${fileName}`)
      }
    } catch (error) {
      console.warn('⚠️ File upload failed:', error)
    }

    // Create candidate record
    const candidateRecord = {
      id: candidateId,
      name: extractedData.candidate.name,
      email: extractedData.candidate.email,
      phone: extractedData.candidate.phone,
      location: extractedData.candidate.location,
      summary: extractedData.candidate.summary,
      skills: extractedData.candidate.skills,
      experience: extractedData.candidate.experience,
      education: extractedData.candidate.education,
      languages: extractedData.candidate.languages || ['English'],
      certifications: extractedData.candidate.certifications || [],
      experience_years: extractedData.candidate.experienceYears || 0,
      degree: extractedData.candidate.education?.[0]?.degree || null,
      university: extractedData.candidate.education?.[0]?.school || null,
      graduation_year: extractedData.candidate.education?.[0]?.year || null,
      linkedin_url: extractedData.candidate.linkedinUrl || null,
      portfolio_url: extractedData.candidate.portfolioUrl || null,
      github_url: extractedData.candidate.githubUrl || null,
      salary_expectation_min: null,
      salary_expectation_max: null,
      visa_status: null,
      availability: 'available',
      status: 'active',
      source: 'cv_upload',
      tags: ['cv_parsed', 'gemini_extracted'],
      organisation_id: 'demo-org-123',
      resume_url: resumeUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Save candidate to database
    const { data: candidateData, error: candidateError } = await supabase
      .from('candidates')
      .insert([candidateRecord])
      .select()
      .single()

    if (candidateError) {
      console.error('❌ Error saving candidate:', candidateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to save candidate to database'
      }, { status: 500 })
    }

    console.log(`💾 Candidate saved to database: ${candidateData.id}`)

    // Save resume metadata
    if (resumeUrl) {
      const resumeRecord = {
        id: uuidv4(),
        candidate_id: candidateId,
        filename: file.name,
        file_path: resumeUrl,
        file_size: file.size,
        mime_type: file.type,
        uploaded_at: new Date().toISOString()
      }

      const { error: resumeError } = await supabase
        .from('resumes')
        .insert([resumeRecord])

      if (resumeError) {
        console.warn('⚠️ Error saving resume metadata:', resumeError)
      }
    }

    // Return success with extracted data
    return NextResponse.json({
      success: true,
      candidate: candidateData,
      extractedData: extractedData,
      message: `Successfully processed ${file.name} and extracted candidate data`
    })

  } catch (error) {
    console.error('❌ Enhanced CV parsing error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

// Enhanced CV data extraction using Gemini AI
async function extractCVDataWithGemini(file: File, jobData: any) {
  try {
    console.log('🤖 Starting Gemini AI CV analysis...')
    
    // Get Gemini client (will throw if API key missing)
    const genAI = getGeminiClient()
    
    // Get the generative model
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1, // Lower temperature for more consistent extraction
        topK: 1,
        topP: 0.1,
        maxOutputTokens: 2048,
      },
    })

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString("base64")

    // Create job context for better matching
    const jobContext = jobData ? `
JOB CONTEXT FOR MATCHING:
- Job Title: ${jobData.title}
- Required Skills: ${jobData.technical_skills || 'Not specified'}
- Job Description: ${jobData.description?.substring(0, 300) || 'Not specified'}
- Location: ${jobData.location || 'Not specified'}
` : ''

    const prompt = `You are an expert CV/Resume parser and job matching system. Analyze this document and extract ALL available information.

${jobContext}

Extract information and return ONLY a valid JSON object in this EXACT format:
{
  "candidate": {
    "name": "Full name exactly as written",
    "email": "Email address if found",
    "phone": "Phone number if found", 
    "location": "City, State/Country if found",
    "summary": "Professional summary or objective",
    "skills": ["skill1", "skill2", "skill3"],
    "experience": [
      {
        "title": "Job Title",
        "company": "Company Name", 
        "duration": "Start Date - End Date",
        "description": "Job description or achievements"
      }
    ],
    "education": [
      {
        "degree": "Degree Name",
        "school": "Institution Name",
        "year": "Graduation Year"
      }
    ],
    "languages": ["English", "Spanish"],
    "certifications": ["Certification 1", "Certification 2"],
    "linkedinUrl": "LinkedIn URL if found",
    "portfolioUrl": "Portfolio URL if found",
    "githubUrl": "GitHub URL if found",
    "experienceYears": 5
  },
  "matching": {
    "overallScore": 85,
    "skillsMatch": 90,
    "experienceMatch": 80,
    "educationMatch": 75,
    "strengths": ["Strong technical skills", "Relevant experience"],
    "gaps": ["Could use more experience in X"]
  }
}

CRITICAL INSTRUCTIONS:
1. Extract ALL text content from the document
2. Do NOT use placeholder or generic data
3. If information is not found, use null for strings and [] for arrays
4. Calculate a realistic match score based on job requirements
5. Return ONLY the JSON - no explanations, no markdown, no additional text
6. Ensure all text is properly extracted and not truncated`

    // Make API call to Gemini
    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      },
      prompt,
    ])

    const response = await result.response
    const text = response.text()

    console.log('📤 Gemini response received, length:', text.length)
    console.log('🔍 First 200 chars:', text.substring(0, 200))

    // Parse JSON response
    try {
      // Clean the response - remove any markdown formatting
      let cleanedText = text.trim()
      
      // Remove markdown code blocks if present
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      
      // Find JSON object in response
      const jsonStart = cleanedText.indexOf('{')
      const jsonEnd = cleanedText.lastIndexOf('}') + 1
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No JSON object found in response')
      }
      
      const jsonString = cleanedText.substring(jsonStart, jsonEnd)
      const parsedData = JSON.parse(jsonString)

      // Validate required fields
      if (!parsedData.candidate || !parsedData.candidate.name) {
        throw new Error('Invalid response: missing candidate name')
      }

      console.log('✅ CV data successfully extracted and parsed')
      return parsedData

    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response:', parseError)
      console.error('📄 Raw response:', text.substring(0, 500))
      throw new Error('Failed to parse CV data from AI response')
    }

  } catch (error) {
    console.error('❌ Gemini AI analysis failed:', error)
    throw error
  }
}
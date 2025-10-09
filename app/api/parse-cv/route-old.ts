import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 CV parsing request received')
    
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

    // Validate file type and size
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Please upload a PDF, DOCX, or TXT file.'
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
    let jobRequirements = null
    try {
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('title, description, technical_skills, requirements')
        .eq('id', jobId)
        .single()

      if (jobError) {
        console.error('Error fetching job data:', jobError)
        // Continue without job requirements
      } else {
        jobRequirements = {
          title: jobData.title,
          description: jobData.description,
          skills: jobData.technical_skills?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
          requirements: jobData.requirements
        }
      }
    } catch (error) {
      console.error('Error fetching job requirements:', error)
    }

    console.log('📋 Job requirements:', jobRequirements)

    // Parse CV with AI - Enhanced error handling
    let cvAnalysis
    try {
      console.log('🤖 Starting Gemini AI analysis for:', file.name, 'Size:', file.size, 'Type:', file.type)
      
      cvAnalysis = await analyzeCVWithGemini(file, jobRequirements)
      
      if (cvAnalysis && cvAnalysis.candidate) {
        console.log('✅ CV analysis completed successfully:', cvAnalysis.candidate.name)
      } else {
        console.warn('⚠️ Gemini returned null result, trying text extraction fallback')
        cvAnalysis = await extractTextAndAnalyze(file, jobRequirements)
      }
    } catch (error) {
      console.error('❌ Primary CV analysis failed:', error)
      
      // Try text extraction fallback before using mock data
      try {
        console.log('🔄 Attempting text extraction fallback...')
        cvAnalysis = await extractTextAndAnalyze(file, jobRequirements)
      } catch (fallbackError) {
        console.error('❌ Text extraction fallback also failed:', fallbackError)
        
        // Only use mock data as absolute last resort with clear indication
        console.warn('🚨 Using mock data as last resort - this should not happen in production')
        cvAnalysis = {
          candidate: {
            name: `CV_${file.name.split('.')[0]}_MOCK`,
            email: 'extracted@placeholder.com',
            phone: '+1 (555) MOCK-CV',
            location: 'Location not extracted',
            summary: `This is mock data - CV parsing failed for ${file.name}. Please implement proper text extraction.`,
            skills: ['CV_PARSING_FAILED'],
            experience: [
              {
                title: 'MOCK DATA - CV parsing failed',
                company: 'Please check CV format',
                duration: 'Unknown',
                description: `Real CV parsing failed for ${file.name}`
              }
            ],
            education: [
              {
                degree: 'MOCK - CV parsing failed',
                school: 'Please check file format',
                year: 'Unknown'
              }
            ],
            languages: ['PARSING_FAILED'],
            certifications: ['CV_EXTRACTION_ERROR']
          },
          analysis: {
            strengths: ['MOCK DATA - CV parsing failed'],
            gaps: ['Please implement proper CV text extraction']
          }
        }
      }
    }

    if (!cvAnalysis?.candidate) {
      return NextResponse.json({
        success: false,
        error: 'Failed to extract candidate information from CV'
      }, { status: 500 })
    }

    // Generate candidate ID
    const candidateId = uuidv4()
    
    // Store file in Supabase Storage (simplified for demo)
    const fileName = `${candidateId}_${file.name}`
    let resumeUrl = null
    
    try {
      // Convert file to buffer for storage
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          upsert: true
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
      } else {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('resumes')
          .getPublicUrl(fileName)
        
        resumeUrl = urlData?.publicUrl
        console.log('✅ File uploaded to:', resumeUrl)
      }
    } catch (error) {
      console.error('Error uploading file:', error)
    }

    // Normalize candidate data
    const normalizedData = cvAnalysis.candidate
    
    // Create candidate record
    const candidateRecord = {
      id: candidateId,
      name: normalizedData?.name || 'Unknown Candidate',
      email: normalizedData?.email || null,
      phone: normalizedData?.phone || null,
      location: normalizedData?.location || null,
      summary: normalizedData?.summary || null,
      skills: Array.isArray(normalizedData?.skills) ? normalizedData.skills : [],
      experience: Array.isArray(normalizedData?.experience) ? normalizedData.experience : [],
      education: Array.isArray(normalizedData?.education) ? normalizedData.education : [],
      languages: Array.isArray(normalizedData?.languages) ? normalizedData.languages : ['English'],
      certifications: Array.isArray(normalizedData?.certifications) ? normalizedData.certifications : [],
      experience_years: normalizedData?.experience_years || calculateExperienceYears(normalizedData?.experience || []),
      degree: normalizedData?.degree || normalizedData?.education?.[0]?.degree || null,
      university: normalizedData?.university || normalizedData?.education?.[0]?.school || null,
      graduation_year: normalizedData?.graduation_year || normalizedData?.education?.[0]?.year || null,
      linkedin_url: normalizedData?.linkedin_url || null,
      portfolio_url: normalizedData?.portfolio_url || null,
      github_url: normalizedData?.github_url || null,
      salary_expectation_min: normalizedData?.salary_expectation_min || null,
      salary_expectation_max: normalizedData?.salary_expectation_max || null,
      visa_status: normalizedData?.visa_status || null,
      availability: normalizedData?.availability || 'available',
      status: 'active',
      source: 'cv_upload',
      tags: ['cv_parsed'],
      organisation_id: 'demo-org-123', // TODO: Get from user context
      resume_url: resumeUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Save candidate to database
    try {
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .insert([candidateRecord])
        .select()
        .single()

      if (candidateError) {
        console.error('Error saving candidate:', candidateError)
        throw new Error('Failed to save candidate to database')
      }

      console.log('✅ Candidate saved:', candidateData.id)

      // Also save resume metadata
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
          console.error('Error saving resume metadata:', resumeError)
        }
      }

      return NextResponse.json({
        success: true,
        candidate: candidateData,
        analysis: cvAnalysis.analysis
      })

    } catch (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to save candidate information'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ CV parsing error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

// Helper function to analyze CV with Gemini AI
async function analyzeCVWithGemini(file: File, jobRequirements: any) {
  try {
    // Use existing Gemini AI functionality from lib/gemini-ai.ts
    const { analyzeCVWithGemini: existingAnalyzer } = await import('@/lib/gemini-ai')
    const result = await existingAnalyzer(file, jobRequirements)
    
    if (!result) {
      throw new Error('Gemini AI returned null result')
    }
    
    // Convert Gemini result format to our expected format
    return {
      candidate: {
        name: result.name || 'Unknown Name',
        email: result.email || null,
        phone: result.phone || null,
        location: result.location || null,
        summary: result.summary || result.experience || null,
        skills: Array.isArray(result.skills) ? result.skills : [],
        experience: result.experience ? [{
          title: result.position || 'Unknown Position',
          company: 'From CV',
          duration: 'Unknown',
          description: result.experience
        }] : [],
        education: Array.isArray(result.education) ? result.education.map(edu => ({
          degree: edu,
          school: 'From CV',
          year: 'Unknown'
        })) : [],
        languages: Array.isArray(result.languages) ? result.languages : ['English'],
        certifications: Array.isArray(result.certifications) ? result.certifications : [],
        experience_years: result.yearsOfExperience || 0
      },
      analysis: {
        strengths: [`Match score: ${result.match || 'N/A'}%`],
        gaps: ['Detailed analysis not available']
      }
    }
  } catch (error) {
    console.error('Gemini analysis error:', error)
    throw error
  }
}

// Fallback text extraction function
async function extractTextAndAnalyze(file: File, jobRequirements: any) {
  try {
    console.log('📄 Attempting basic text extraction from CV')
    
    if (file.type === 'text/plain') {
      // For TXT files, we can read the content directly
      const text = await file.text()
      return analyzeExtractedText(text, file.name, jobRequirements)
    } else {
      // For PDF/DOCX, we need a more sophisticated approach
      // For now, return structured mock data that indicates we need proper extraction
      throw new Error('Advanced text extraction not implemented for binary files')
    }
  } catch (error) {
    console.error('Text extraction failed:', error)
    throw error
  }
}

// Basic text analysis function
function analyzeExtractedText(text: string, filename: string, jobRequirements: any) {
  // Simple regex-based extraction
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const phoneRegex = /[\+]?[1-9]?[\-\s\(\)]?[(]?[0-9]{3}[)]?[\-\s\.]?[0-9]{3,4}[\-\s\.]?[0-9]{3,6}/g
  
  const emails = text.match(emailRegex) || []
  const phones = text.match(phoneRegex) || []
  
  // Extract name (first line that looks like a name)
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  const nameCandidate = lines.find(line => 
    line.length > 5 && line.length < 50 && 
    /^[A-Za-z\s]+$/.test(line.trim()) &&
    !line.toLowerCase().includes('resume') &&
    !line.toLowerCase().includes('cv')
  )
  
  // Extract skills (look for common programming languages and technologies)
  const skillKeywords = ['javascript', 'python', 'java', 'react', 'node', 'angular', 'vue', 'typescript', 'css', 'html', 'sql', 'mongodb', 'postgresql', 'aws', 'docker', 'kubernetes', 'git']
  const foundSkills = skillKeywords.filter(skill => 
    text.toLowerCase().includes(skill)
  )
  
  return {
    candidate: {
      name: nameCandidate?.trim() || `Extracted_${filename.split('.')[0]}`,
      email: emails[0] || null,
      phone: phones[0] || null,
      location: null, // Would need more sophisticated extraction
      summary: text.substring(0, 200) + '...', // First 200 chars as summary
      skills: foundSkills.length > 0 ? foundSkills : ['Skills not clearly identified'],
      experience: [{
        title: 'Position extracted from CV',
        company: 'Company from CV',
        duration: 'Duration not extracted',
        description: 'Experience details extracted from CV text'
      }],
      education: [{
        degree: 'Education extracted from CV',
        school: 'Institution from CV', 
        year: 'Year not extracted'
      }],
      languages: ['English'],
      certifications: [],
      experience_years: foundSkills.length // Rough estimate based on skills
    },
    analysis: {
      strengths: ['Basic text extraction completed'],
      gaps: ['Needs more sophisticated parsing']
    }
  }
}

// Helper function to calculate experience years from experience array
function calculateExperienceYears(experience: any[]): number {
  if (!experience || experience.length === 0) return 0
  
  let totalYears = 0
  
  experience.forEach((exp) => {
    if (exp.duration) {
      // Try to extract years from duration string
      const yearMatches = exp.duration.match(/(\d+)\s*(?:years?|yrs?)/i)
      if (yearMatches) {
        totalYears += parseInt(yearMatches[1])
      } else {
        // Fallback: just look for any number
        const numberMatch = exp.duration.match(/(\d+)/)
        if (numberMatch) {
          totalYears += Math.min(parseInt(numberMatch[1]), 10) // Cap at 10 years per role
        }
      }
    }
  })
  
  return Math.max(totalYears, 1) // Minimum 1 year if we have experience entries
}
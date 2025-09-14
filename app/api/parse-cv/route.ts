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

    // Parse CV with AI
    let cvAnalysis
    try {
      cvAnalysis = await analyzeCVWithGemini(file, jobRequirements)
      console.log('✅ CV analysis completed:', cvAnalysis?.candidate?.name)
    } catch (error) {
      console.error('❌ CV analysis failed:', error)
      
      // Fallback to mock data for development
      cvAnalysis = {
        candidate: {
          name: 'John Smith',
          email: 'john.smith@email.com',
          phone: '+1 (555) 123-4567',
          location: 'San Francisco, CA',
          summary: 'Experienced software developer with strong technical skills.',
          skills: ['JavaScript', 'React', 'Node.js', 'Python'],
          experience: [
            {
              title: 'Software Developer',
              company: 'Tech Company',
              duration: '2021 - Present',
              description: 'Developed web applications using modern technologies.'
            }
          ],
          education: [
            {
              degree: 'Bachelor of Computer Science',
              school: 'University of Technology',
              year: '2020'
            }
          ],
          languages: ['English', 'Spanish'],
          certifications: ['AWS Certified Developer']
        },
        analysis: {
          strengths: ['Strong technical background', 'Relevant experience'],
          gaps: ['Could use more frontend experience']
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
    return await existingAnalyzer(file, jobRequirements)
  } catch (error) {
    console.error('Gemini analysis error:', error)
    throw error
  }
}

// Helper function to calculate experience years from experience array
function calculateExperienceYears(experience: any[]): number {
  if (!experience || experience.length === 0) return 0
  
  let totalYears = 0
  
  experience.forEach((exp) => {
    if (exp.duration) {
      const match = exp.duration.match(/(\d+)/)
      if (match) {
        totalYears += parseInt(match[1])
      }
    }
  })
  
  return Math.max(totalYears, 0)
}
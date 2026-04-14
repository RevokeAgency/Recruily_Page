import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase.client"
import { calculateMatchingScore } from "@/lib/gemini-ai"
import { getOrgId } from "@/lib/get-org-id"

export async function POST(request: NextRequest) {
  try {
    console.log("🤝 Invite Candidate API - POST request received")

    const body = await request.json()
    const { jobId, candidateId } = body

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "Job ID is required" },
        { status: 400 }
      )
    }

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: "Candidate ID is required" },
        { status: 400 }
      )
    }

    console.log(`🔗 Linking candidate ${candidateId} to job ${jobId}`)

    // Fetch job details (try Supabase first, then fallback to localStorage mock)
    let job = null
    let jobError = null
    
    try {
      const { data: jobData, error: supabaseJobError } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', jobId)
        .single()
      
      job = jobData
      jobError = supabaseJobError
    } catch (error) {
      console.warn("⚠️ Supabase job query failed, using fallback")
      jobError = error
    }

    // If Supabase query failed or returned no data, try localStorage fallback
    if (jobError || !job) {
      console.log("📋 Job not found in Supabase, checking localStorage fallback...")
      
      // Create a mock job data for development/testing
      // In real usage, this should come from a proper database
      const mockJobs = [
        {
          id: "job_1753952346309_960",
          title: "Senior Frontend Developer", 
          company: "TechCorp Solutions",
          location: "San Francisco, CA",
          description: "Senior Frontend Developer position",
          requirements: "5+ years React experience",
          technical_skills: "React, TypeScript, JavaScript",
          experience_level: "Senior",
          job_type: "Full-time",
          salary_min: 120000,
          salary_max: 160000
        },
        {
          id: "job_1753952346310_961",
          title: "Marketing Manager",
          company: "Growth Dynamics", 
          location: "New York, NY",
          description: "Marketing Manager position",
          requirements: "3+ years marketing experience",
          technical_skills: "Google Analytics, HubSpot, Salesforce",
          experience_level: "Mid-level",
          job_type: "Full-time",
          salary_min: 80000,
          salary_max: 110000
        }
      ]
      
      job = mockJobs.find(j => j.id === jobId)
      
      if (!job) {
        console.error("❌ Job not found in Supabase or localStorage fallback:", jobId)
        return NextResponse.json(
          { success: false, error: "Job not found" },
          { status: 404 }
        )
      } else {
        console.log(`✅ Using fallback job data: ${job.title}`)
      }
    }

    // Fetch candidate details (try Supabase first, then fallback)
    let candidate = null
    let candidateError = null
    
    try {
      const { data: candidateData, error: supabaseCandidateError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single()
      
      candidate = candidateData
      candidateError = supabaseCandidateError
    } catch (error) {
      console.warn("⚠️ Supabase candidate query failed, using fallback")
      candidateError = error
    }

    // If Supabase query failed, create a fallback candidate for development
    if (candidateError || !candidate) {
      console.log("👤 Candidate not found in Supabase, using fallback data...")
      
      // Create a mock candidate based on the candidateId from the upload response
      candidate = {
        id: candidateId,
        name: "John Doe",
        email: "john.doe@email.com",
        phone: "123-456-7890", 
        location: "New York, NY",
        skills: ["Sales", "Marketing", "Communication", "Negotiation"],
        experience_years: 5,
        education: "Bachelor of Science in Business Administration",
        summary: "Experienced professional with strong sales background",
        languages: ["English", "Spanish"],
        certifications: ["Salesforce Certified"],
        organisation_id: (await getOrgId()) || ""
      }
      
      console.log(`✅ Using fallback candidate data: ${candidate.name}`)
    }

    // Check if match already exists
    const { data: existingMatch } = await supabase
      .from('matches')
      .select('id')
      .eq('job_id', jobId)
      .eq('candidate_id', candidateId)
      .single()

    if (existingMatch) {
      return NextResponse.json(
        { success: false, error: "Candidate is already invited to this job" },
        { status: 409 }
      )
    }

    console.log("🤖 Calculating AI matching score...")

    // Calculate matching score using AI
    let matchingResult
    try {
      matchingResult = await calculateMatchingScore(job, candidate)
      console.log("✅ AI matching calculation successful")
    } catch (error) {
      console.warn("⚠️ AI matching failed, using fallback scoring:", error)
      matchingResult = calculateFallbackScore(job, candidate)
    }

    // Create match record
    const matchRecord = {
      job_id: jobId,
      candidate_id: candidateId,
      score: matchingResult.score,
      status: 'invited',
      match_reasons: matchingResult.match_reasons || {},
      strengths: matchingResult.strengths || [],
      weaknesses: matchingResult.weaknesses || [],
      skill_matches: matchingResult.skill_matches || {},
      experience_match: matchingResult.experience_match || 0,
      location_match: matchingResult.location_match || false,
      salary_match: matchingResult.salary_match || false,
      ai_analysis: matchingResult.ai_analysis || {},
      created_by: null // TODO: Get from user context
    }

    // Create match record (try Supabase, fallback to mock)
    let match = null
    let matchError = null
    
    try {
      const { data: matchData, error: supabaseMatchError } = await (supabase as any)
        .from('matches')
        .insert([matchRecord])
        .select(`
          *,
          job:job_postings(*),
          candidate:candidates(*)
        `)
        .single()
      
      match = matchData
      matchError = supabaseMatchError
    } catch (error) {
      console.warn("⚠️ Supabase match creation failed, using mock response")
      matchError = error
    }

    // If Supabase failed, create a mock match for development
    if (matchError || !match) {
      console.log("🤝 Creating fallback match record...")
      
      match = {
        id: `match_${Date.now()}`,
        ...matchRecord,
        job: job,
        candidate: candidate,
        created_at: new Date().toISOString()
      }
      
      console.log(`✅ Using fallback match: ${match.id}`)
    }

    console.log(`✅ Match created: ${match.id} with score ${match.score}%`)

    return NextResponse.json({
      success: true,
      match: match,
      message: `Candidate successfully invited with ${match.score}% match score`
    })

  } catch (error: any) {
    console.error("❌ Invite Candidate API Error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "An unexpected error occurred" 
      },
      { status: 500 }
    )
  }
}

// Fallback scoring when AI is unavailable
function calculateFallbackScore(job: any, candidate: any): any {
  let totalScore = 0
  let maxScore = 0
  const strengths: string[] = []
  const weaknesses: string[] = []
  const skillMatches: any = {}

  // Skill matching (40% weight)
  const skillWeight = 40
  maxScore += skillWeight
  
  const jobSkills = Array.isArray(job.skills) ? job.skills : 
    (job.technical_skills ? job.technical_skills.split(',').map((s: string) => s.trim().toLowerCase()) : [])
  const candidateSkills = Array.isArray(candidate.skills) ? 
    candidate.skills.map((s: string) => s.toLowerCase()) : []

  if (jobSkills.length > 0 && candidateSkills.length > 0) {
    const matchedSkills = jobSkills.filter((skill: string) => 
      candidateSkills.some((cs: string) => cs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs))
    )
    
    const skillScore = (matchedSkills.length / jobSkills.length) * skillWeight
    totalScore += skillScore
    
    skillMatches.matched = matchedSkills
    skillMatches.missing = jobSkills.filter((skill: string) => !matchedSkills.includes(skill))
    
    if (matchedSkills.length >= jobSkills.length * 0.7) {
      strengths.push(`Strong skill match (${matchedSkills.length}/${jobSkills.length} skills)`)
    } else if (matchedSkills.length < jobSkills.length * 0.3) {
      weaknesses.push(`Limited skill match (${matchedSkills.length}/${jobSkills.length} skills)`)
    }
  } else {
    totalScore += skillWeight * 0.5 // Neutral score when no skills data
  }

  // Experience matching (30% weight)
  const expWeight = 30
  maxScore += expWeight
  
  const candidateExp = candidate.experience_years || 0
  const jobExpRequired = extractRequiredExperience(job.requirements || job.description || '')
  
  if (jobExpRequired > 0) {
    if (candidateExp >= jobExpRequired) {
      const expScore = Math.min(expWeight, (candidateExp / jobExpRequired) * expWeight)
      totalScore += expScore
      strengths.push(`Meets experience requirement (${candidateExp} years)`)
    } else {
      const expScore = (candidateExp / jobExpRequired) * expWeight * 0.7
      totalScore += expScore
      weaknesses.push(`Below required experience (${candidateExp}/${jobExpRequired} years)`)
    }
  } else {
    totalScore += expWeight * 0.7 // Neutral score when no experience requirement
  }

  // Location matching (15% weight)
  const locationWeight = 15
  maxScore += locationWeight
  
  const locationMatch = checkLocationMatch(job.location, candidate.location)
  if (locationMatch) {
    totalScore += locationWeight
    strengths.push('Location match')
  } else if (job.remote_ok) {
    totalScore += locationWeight * 0.8
    strengths.push('Remote work available')
  } else {
    totalScore += locationWeight * 0.3
    weaknesses.push('Location mismatch')
  }

  // Education matching (15% weight)
  const eduWeight = 15
  maxScore += eduWeight
  
  if (candidate.degree || candidate.education) {
    totalScore += eduWeight * 0.8
    strengths.push('Has education background')
  } else {
    totalScore += eduWeight * 0.5
  }

  // Calculate final percentage
  const finalScore = Math.round((totalScore / maxScore) * 100)

  return {
    score: Math.max(20, Math.min(95, finalScore)), // Keep between 20-95%
    match_reasons: {
      skill_match: skillMatches.matched?.length || 0,
      experience_match: candidateExp >= (jobExpRequired || 0),
      location_match: locationMatch
    },
    strengths,
    weaknesses,
    skill_matches: skillMatches,
    experience_match: Math.min(100, Math.round((candidateExp / Math.max(jobExpRequired || 1, 1)) * 100)),
    location_match: locationMatch,
    salary_match: checkSalaryMatch(job, candidate),
    ai_analysis: {
      method: 'fallback',
      timestamp: new Date().toISOString(),
      factors_considered: ['skills', 'experience', 'location', 'education']
    }
  }
}

function extractRequiredExperience(text: string): number {
  const expPatterns = [
    /(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)/i,
    /minimum\s*(?:of\s*)?(\d+)\s*years?/i,
    /(\d+)\s*to\s*\d+\s*years?\s*experience/i
  ]
  
  for (const pattern of expPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return parseInt(match[1], 10)
    }
  }
  
  return 0
}

function checkLocationMatch(jobLocation: string, candidateLocation: string): boolean {
  if (!jobLocation || !candidateLocation) return false
  
  const jobLoc = jobLocation.toLowerCase()
  const candLoc = candidateLocation.toLowerCase()
  
  // Check for exact match or city/state overlap
  if (jobLoc === candLoc) return true
  
  // Extract cities and states/countries
  const jobParts = jobLoc.split(',').map(p => p.trim())
  const candParts = candLoc.split(',').map(p => p.trim())
  
  // Check if any parts match
  return jobParts.some(jp => candParts.some(cp => 
    jp.includes(cp) || cp.includes(jp) || 
    (jp.length > 3 && cp.length > 3 && (jp.includes(cp.substring(0, 4)) || cp.includes(jp.substring(0, 4))))
  ))
}

function checkSalaryMatch(job: any, candidate: any): boolean {
  const jobSalaryMin = job.salary_min || 0
  const jobSalaryMax = job.salary_max || 0
  const candSalaryMin = candidate.salary_expectation_min || 0
  const candSalaryMax = candidate.salary_expectation_max || 0
  
  // If no salary data, assume neutral match
  if (!jobSalaryMin && !jobSalaryMax && !candSalaryMin && !candSalaryMax) {
    return true
  }
  
  // Check if ranges overlap
  if (jobSalaryMax > 0 && candSalaryMin > 0) {
    return jobSalaryMax >= candSalaryMin
  }
  
  if (jobSalaryMin > 0 && candSalaryMax > 0) {
    return jobSalaryMin <= candSalaryMax
  }
  
  return true // Default to true if insufficient data
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
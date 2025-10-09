import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Weighted scoring system as specified
interface MatchingWeights {
  skills: number
  experience: number
  education: number
  languages: number
  certifications: number
  other: number
}

const SCORING_WEIGHTS: MatchingWeights = {
  skills: 0.40,      // 40%
  experience: 0.30,  // 30%
  education: 0.10,   // 10%
  languages: 0.10,   // 10%
  certifications: 0.05, // 5%
  other: 0.05        // 5%
}

export async function POST(request: NextRequest) {
  console.log('🎯 Enhanced candidate matching request received')
  
  try {
    const { candidateId, jobId, extractedData } = await request.json()
    
    if (!candidateId || !jobId) {
      return NextResponse.json({
        success: false,
        error: 'Candidate ID and Job ID are required'
      }, { status: 400 })
    }

    console.log(`🔗 Matching candidate ${candidateId} to job ${jobId}`)

    // Check if Supabase is available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('⚠️ Supabase not available, creating mock match')
      return createMockMatch(candidateId, jobId, extractedData)
    }

    // Use service role client for database operations
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Fetch candidate data
    let candidate, job
    try {
      const { data: candidateData, error: candidateError } = await supabaseAdmin
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single()

      if (candidateError && !candidateError.message?.includes('Mock')) {
        throw candidateError
      }
      candidate = candidateData

      // Fetch job data  
      const { data: jobData, error: jobError } = await supabaseAdmin
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (jobError && !jobError.message?.includes('Mock')) {
        throw jobError
      }
      job = jobData
    } catch (dbError: any) {
      console.warn('⚠️ Database fetch failed, using mock data:', dbError.message)
      return createMockMatch(candidateId, jobId, extractedData)
    }

    if (!candidate || !job) {
      console.warn('⚠️ No candidate or job data, using mock match')
      return createMockMatch(candidateId, jobId, extractedData)
    }

    console.log(`📊 Matching ${candidate.name} to ${job.title}`)

    // Use AI-extracted matching data if available, otherwise calculate
    let matchingResult
    if (extractedData && extractedData.matching) {
      console.log('🤖 Using AI-generated matching scores')
      matchingResult = {
        overallScore: extractedData.matching.overallScore || 75,
        skillsScore: extractedData.matching.skillsMatch || 70,
        experienceScore: extractedData.matching.experienceMatch || 70,
        educationScore: extractedData.matching.educationMatch || 70,
        languagesScore: 85, // Default high score for languages
        certificationsScore: 70,
        otherScore: 75,
        strengths: extractedData.matching.strengths || [],
        gaps: extractedData.matching.gaps || [],
        summary: `AI-matched candidate with ${extractedData.matching.overallScore || 75}% compatibility`
      }
    } else {
      console.log('📈 Calculating matching scores manually')
      matchingResult = await calculateDetailedMatch(candidate, job)
    }

    // Create match record
    const matchRecord = {
      id: uuidv4(),
      candidate_id: candidateId,
      job_id: jobId,
      overall_score: Math.round(matchingResult.overallScore),
      skills_score: Math.round(matchingResult.skillsScore),
      experience_score: Math.round(matchingResult.experienceScore),
      education_score: Math.round(matchingResult.educationScore),
      languages_score: Math.round(matchingResult.languagesScore),
      certifications_score: Math.round(matchingResult.certificationsScore),
      other_score: Math.round(matchingResult.otherScore),
      ai_summary: matchingResult.summary,
      strengths: matchingResult.strengths,
      gaps: matchingResult.gaps,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Save match to database with fallback
    let matchData
    try {
      const { data, error: matchError } = await supabaseAdmin
        .from('matches')
        .insert([matchRecord])
        .select()
        .single()

      if (matchError && !matchError.message?.includes('Mock')) {
        throw matchError
      }
      matchData = data || matchRecord
    } catch (dbError: any) {
      console.warn('⚠️ Match save failed, using record data:', dbError.message)
      matchData = matchRecord
    }

    console.log(`✅ Match created with ${matchRecord.overall_score}% score`)

    return NextResponse.json({
      success: true,
      match: matchData,
      analysis: {
        overallScore: matchingResult.overallScore,
        categoryScores: {
          skills: matchingResult.skillsScore,
          experience: matchingResult.experienceScore,
          education: matchingResult.educationScore,
          languages: matchingResult.languagesScore,
          certifications: matchingResult.certificationsScore,
          other: matchingResult.otherScore
        },
        summary: matchingResult.summary,
        strengths: matchingResult.strengths,
        gaps: matchingResult.gaps,
        weights: SCORING_WEIGHTS
      }
    })

  } catch (error) {
    console.error('❌ Enhanced matching error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

// Calculate detailed matching scores
async function calculateDetailedMatch(candidate: any, job: any) {
  console.log('📊 Calculating detailed match scores')

  // Skills matching
  const skillsScore = calculateSkillsMatch(
    candidate.skills || [],
    job.technical_skills || ''
  )

  // Experience matching
  const experienceScore = calculateExperienceMatch(
    candidate.experience_years || 0,
    candidate.experience || [],
    job.description || '',
    job.requirements || ''
  )

  // Education matching
  const educationScore = calculateEducationMatch(
    candidate.education || [],
    candidate.degree || '',
    job.requirements || ''
  )

  // Languages matching
  const languagesScore = calculateLanguagesMatch(
    candidate.languages || ['English'],
    job.location || '',
    job.requirements || ''
  )

  // Certifications matching
  const certificationsScore = calculateCertificationsMatch(
    candidate.certifications || [],
    job.technical_skills || '',
    job.requirements || ''
  )

  // Other factors (location, availability, etc.)
  const otherScore = calculateOtherFactors(candidate, job)

  // Calculate weighted overall score
  const overallScore = (
    skillsScore * SCORING_WEIGHTS.skills +
    experienceScore * SCORING_WEIGHTS.experience +
    educationScore * SCORING_WEIGHTS.education +
    languagesScore * SCORING_WEIGHTS.languages +
    certificationsScore * SCORING_WEIGHTS.certifications +
    otherScore * SCORING_WEIGHTS.other
  )

  // Generate analysis
  const analysis = generateMatchAnalysis({
    skillsScore,
    experienceScore,
    educationScore,
    languagesScore,
    certificationsScore,
    otherScore,
    overallScore
  }, candidate, job)

  return {
    overallScore: Math.round(overallScore),
    skillsScore,
    experienceScore,
    educationScore,
    languagesScore,
    certificationsScore,
    otherScore,
    ...analysis
  }
}

function calculateSkillsMatch(candidateSkills: string[], jobSkills: string): number {
  if (!candidateSkills.length || !jobSkills) return 50

  const jobSkillsList = jobSkills.toLowerCase()
    .split(/[,\s]+/)
    .map(s => s.trim())
    .filter(s => s.length > 2)

  const candidateSkillsLower = candidateSkills.map(s => s.toLowerCase().trim())

  let matchCount = 0
  let partialMatches = 0

  jobSkillsList.forEach(jobSkill => {
    const exactMatch = candidateSkillsLower.find(candidateSkill => 
      candidateSkill === jobSkill
    )
    
    if (exactMatch) {
      matchCount += 1
    } else {
      // Check for partial matches
      const partialMatch = candidateSkillsLower.find(candidateSkill =>
        candidateSkill.includes(jobSkill) || jobSkill.includes(candidateSkill)
      )
      if (partialMatch) {
        partialMatches += 0.5
      }
    }
  })

  const totalMatches = matchCount + partialMatches
  const matchPercentage = (totalMatches / Math.max(jobSkillsList.length, 1)) * 100

  // Bonus for having many relevant skills
  const skillsBonusScore = Math.min(candidateSkills.length * 2, 20)

  return Math.min(matchPercentage + skillsBonusScore, 100)
}

function calculateExperienceMatch(experienceYears: number, experience: any[], jobDescription: string, jobRequirements: string): number {
  const text = (jobDescription + ' ' + jobRequirements).toLowerCase()
  
  // Extract required experience from job text
  const experiencePatterns = [
    /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/g,
    /minimum\s*(\d+)\s*(?:years?|yrs?)/g,
    /at least\s*(\d+)\s*(?:years?|yrs?)/g
  ]

  let requiredYears = 0
  experiencePatterns.forEach(pattern => {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      const years = parseInt(match[1])
      if (years > requiredYears) {
        requiredYears = years
      }
    }
  })

  if (requiredYears === 0) requiredYears = 2 // Default minimum

  // Calculate score based on experience comparison
  let score = 70 // Base score

  if (experienceYears >= requiredYears * 1.5) {
    score = 100 // Significantly exceeds requirements
  } else if (experienceYears >= requiredYears) {
    score = 90 // Meets or exceeds requirements
  } else if (experienceYears >= requiredYears * 0.8) {
    score = 80 // Close to requirements
  } else if (experienceYears >= requiredYears * 0.6) {
    score = 70 // Somewhat below requirements
  } else if (experienceYears >= requiredYears * 0.4) {
    score = 60 // Significantly below requirements
  } else {
    score = Math.max(experienceYears * 15, 30) // Minimal experience
  }

  // Bonus for relevant experience titles
  if (experience && experience.length > 0) {
    const relevantTitles = experience.filter(exp => {
      const title = exp.title?.toLowerCase() || ''
      return title.includes('senior') || title.includes('lead') || title.includes('manager')
    })
    if (relevantTitles.length > 0) {
      score += 10
    }
  }

  return Math.min(score, 100)
}

function calculateEducationMatch(education: any[], degree: string, jobRequirements: string): number {
  if (!education.length && !degree) return 60

  let score = 70 // Base score for having education

  const requirements = jobRequirements.toLowerCase()
  const degreeText = degree?.toLowerCase() || ''

  // Check for degree relevance
  const relevantFields = [
    'computer science', 'software engineering', 'information technology',
    'engineering', 'mathematics', 'science', 'business', 'management'
  ]

  relevantFields.forEach(field => {
    if (degreeText.includes(field) || requirements.includes(field)) {
      score += 5
    }
  })

  // Bonus for advanced degrees
  if (degreeText.includes('master') || degreeText.includes('phd') || degreeText.includes('doctorate')) {
    score += 15
  }

  // Check prestigious institutions (simplified)
  const prestigiousKeywords = ['university', 'institute', 'college']
  education.forEach(edu => {
    const school = edu.school?.toLowerCase() || ''
    if (prestigiousKeywords.some(keyword => school.includes(keyword))) {
      score += 5
    }
  })

  return Math.min(score, 100)
}

function calculateLanguagesMatch(languages: string[], jobLocation: string, jobRequirements: string): number {
  if (!languages.length) return 70

  let score = 80 // Base score for multilingual

  const location = jobLocation.toLowerCase()
  const requirements = jobRequirements.toLowerCase()

  // Bonus for multiple languages
  if (languages.length > 1) score += 5
  if (languages.length > 2) score += 5

  // Check for specific language requirements
  languages.forEach(lang => {
    const language = lang.toLowerCase()
    if (requirements.includes(language) || location.includes('international')) {
      score += 10
    }
  })

  return Math.min(score, 100)
}

function calculateCertificationsMatch(certifications: string[], jobSkills: string, jobRequirements: string): number {
  if (!certifications.length) return 60

  let score = 70 // Base score for having certifications
  let relevantCertCount = 0

  const skills = jobSkills.toLowerCase()
  const requirements = jobRequirements.toLowerCase()

  certifications.forEach(cert => {
    const certification = cert.toLowerCase()
    
    // Check for relevant tech certifications
    const techCerts = ['aws', 'azure', 'google cloud', 'microsoft', 'cisco', 'oracle', 'salesforce']
    if (techCerts.some(tech => certification.includes(tech))) {
      relevantCertCount++
      score += 10
    }

    // Check if mentioned in job
    if (skills.includes(certification) || requirements.includes(certification)) {
      score += 15
    }
  })

  // Bonus for multiple relevant certifications
  score += Math.min(relevantCertCount * 5, 20)

  return Math.min(score, 100)
}

function calculateOtherFactors(candidate: any, job: any): number {
  let score = 75 // Base score

  // Location match
  if (candidate.location && job.location) {
    const candidateLocation = candidate.location.toLowerCase()
    const jobLocation = job.location.toLowerCase()
    
    if (candidateLocation.includes(jobLocation) || jobLocation.includes(candidateLocation)) {
      score += 15
    } else if (jobLocation.includes('remote')) {
      score += 10
    }
  }

  // Portfolio/GitHub presence
  if (candidate.portfolio_url || candidate.github_url || candidate.linkedin_url) {
    score += 10
  }

  // Recent activity (graduation, job changes)
  if (candidate.graduation_year) {
    const currentYear = new Date().getFullYear()
    const yearsSinceGraduation = currentYear - candidate.graduation_year
    if (yearsSinceGraduation <= 2) {
      score += 5 // Recent graduate bonus
    }
  }

  return Math.min(score, 100)
}

function generateMatchAnalysis(scores: any, candidate: any, job: any) {
  const strengths = []
  const gaps = []

  // Analyze strengths
  if (scores.skillsScore >= 80) {
    strengths.push('Excellent technical skills alignment with job requirements')
  }
  if (scores.experienceScore >= 80) {
    strengths.push('Strong relevant work experience')
  }
  if (scores.educationScore >= 80) {
    strengths.push('Strong educational background')
  }
  if (scores.languagesScore >= 85) {
    strengths.push('Excellent language capabilities')
  }
  if (scores.certificationsScore >= 75) {
    strengths.push('Relevant professional certifications')
  }

  // Analyze gaps
  if (scores.skillsScore < 60) {
    gaps.push('Technical skills need development to meet job requirements')
  }
  if (scores.experienceScore < 60) {
    gaps.push('Would benefit from more relevant work experience')
  }
  if (scores.educationScore < 60) {
    gaps.push('Educational background could be more aligned with role')
  }

  // Generate summary
  const summary = `Candidate shows ${scores.overallScore >= 80 ? 'excellent' : scores.overallScore >= 70 ? 'good' : scores.overallScore >= 60 ? 'moderate' : 'limited'} compatibility with the ${job.title} position. ${strengths.length > 0 ? `Key strengths include ${strengths.length} areas of excellence.` : ''} ${gaps.length > 0 ? `Development opportunities identified in ${gaps.length} areas.` : ''}`

  return { strengths, gaps, summary }
}

// Create mock match when database is not available
function createMockMatch(candidateId: string, jobId: string, extractedData: any) {
  console.log('🎭 Creating mock match for demonstration')
  
  // Use AI-extracted matching data if available
  let matchingResult
  if (extractedData && extractedData.matching) {
    matchingResult = {
      overallScore: extractedData.matching.overallScore || 75,
      skillsScore: extractedData.matching.skillsMatch || 70,
      experienceScore: extractedData.matching.experienceMatch || 75,
      educationScore: extractedData.matching.educationMatch || 80,
      languagesScore: 85,
      certificationsScore: 70,
      otherScore: 75,
      strengths: extractedData.matching.strengths || [
        'Strong professional background',
        'Relevant skill set for the position'
      ],
      gaps: extractedData.matching.gaps || [
        'Could benefit from additional experience in specific areas'
      ],
      summary: `AI-matched candidate with ${extractedData.matching.overallScore || 75}% compatibility`
    }
  } else {
    // Generate realistic mock scores
    matchingResult = {
      overallScore: 78,
      skillsScore: 80,
      experienceScore: 75,
      educationScore: 80,
      languagesScore: 85,
      certificationsScore: 70,
      otherScore: 75,
      strengths: [
        'Strong technical background',
        'Good professional experience',
        'Relevant educational qualifications'
      ],
      gaps: [
        'Could expand expertise in emerging technologies'
      ],
      summary: 'Candidate demonstrates good compatibility with the position requirements'
    }
  }

  const mockMatch = {
    id: uuidv4(),
    candidate_id: candidateId,
    job_id: jobId,
    overall_score: Math.round(matchingResult.overallScore),
    skills_score: Math.round(matchingResult.skillsScore),
    experience_score: Math.round(matchingResult.experienceScore),
    education_score: Math.round(matchingResult.educationScore),
    languages_score: Math.round(matchingResult.languagesScore),
    certifications_score: Math.round(matchingResult.certificationsScore),
    other_score: Math.round(matchingResult.otherScore),
    ai_summary: matchingResult.summary,
    strengths: matchingResult.strengths,
    gaps: matchingResult.gaps,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    demo_mode: true
  }

  return NextResponse.json({
    success: true,
    match: mockMatch,
    analysis: {
      overallScore: matchingResult.overallScore,
      categoryScores: {
        skills: matchingResult.skillsScore,
        experience: matchingResult.experienceScore,
        education: matchingResult.educationScore,
        languages: matchingResult.languagesScore,
        certifications: matchingResult.certificationsScore,
        other: matchingResult.otherScore
      },
      summary: matchingResult.summary,
      strengths: matchingResult.strengths,
      gaps: matchingResult.gaps,
      weights: SCORING_WEIGHTS
    },
    message: 'Mock match created for demonstration'
  })
}
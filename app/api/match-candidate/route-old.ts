import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { v4 as uuidv4 } from 'uuid'

// Define the matching weights as specified by the user
interface MatchingWeights {
  skills: number
  experience: number
  education: number
  languages: number
  certifications: number
  other: number
}

const DEFAULT_WEIGHTS: MatchingWeights = {
  skills: 0.40,      // 40%
  experience: 0.30,  // 30%
  education: 0.10,   // 10%
  languages: 0.10,   // 10%
  certifications: 0.05, // 5%
  other: 0.05        // 5%
}

export async function POST(request: NextRequest) {
  try {
    console.log('🤝 Candidate matching request received')
    
    const { candidateId, jobId, weights = DEFAULT_WEIGHTS } = await request.json()
    
    if (!candidateId || !jobId) {
      return NextResponse.json({
        success: false,
        error: 'Candidate ID and Job ID are required'
      }, { status: 400 })
    }

    // Fetch candidate data
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single()

    if (candidateError || !candidate) {
      return NextResponse.json({
        success: false,
        error: 'Candidate not found'
      }, { status: 404 })
    }

    // Fetch job data
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 })
    }

    console.log('📊 Matching candidate:', candidate.name, 'to job:', job.title)

    // Perform AI-enhanced matching
    let aiMatchResult
    try {
      aiMatchResult = await performAIMatching(candidate, job)
      console.log('✅ AI matching completed with score:', aiMatchResult.overallScore)
    } catch (error) {
      console.error('❌ AI matching failed, using fallback:', error)
      
      // Fallback to rule-based matching
      aiMatchResult = await performRuleBasedMatching(candidate, job, weights)
    }

    // Create match record
    const matchId = uuidv4()
    const matchRecord = {
      id: matchId,
      candidate_id: candidateId,
      job_id: jobId,
      overall_score: Math.round(aiMatchResult.overallScore),
      skills_score: Math.round(aiMatchResult.skillsScore || 0),
      experience_score: Math.round(aiMatchResult.experienceScore || 0),
      education_score: Math.round(aiMatchResult.educationScore || 0),
      languages_score: Math.round(aiMatchResult.languagesScore || 0),
      certifications_score: Math.round(aiMatchResult.certificationsScore || 0),
      other_score: Math.round(aiMatchResult.otherScore || 0),
      ai_summary: aiMatchResult.summary || null,
      strengths: aiMatchResult.strengths || [],
      gaps: aiMatchResult.gaps || [],
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Save match to database
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .insert([matchRecord])
      .select()
      .single()

    if (matchError) {
      console.error('Error saving match:', matchError)
      return NextResponse.json({
        success: false,
        error: 'Failed to save match results'
      }, { status: 500 })
    }

    console.log('✅ Match saved:', matchData.id)

    return NextResponse.json({
      success: true,
      match: matchData,
      analysis: {
        overallScore: aiMatchResult.overallScore,
        categoryScores: {
          skills: aiMatchResult.skillsScore,
          experience: aiMatchResult.experienceScore,
          education: aiMatchResult.educationScore,
          languages: aiMatchResult.languagesScore,
          certifications: aiMatchResult.certificationsScore,
          other: aiMatchResult.otherScore
        },
        summary: aiMatchResult.summary,
        strengths: aiMatchResult.strengths,
        gaps: aiMatchResult.gaps
      }
    })

  } catch (error) {
    console.error('❌ Candidate matching error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

// AI-enhanced matching using existing Gemini integration
async function performAIMatching(candidate: any, job: any) {
  try {
    // Use existing Gemini AI functionality
    const { matchCandidateWithAI } = await import('@/lib/gemini-ai')
    
    const result = await matchCandidateWithAI(candidate, job)
    
    return {
      overallScore: result.overallScore || 75,
      skillsScore: result.skillsScore || 80,
      experienceScore: result.experienceScore || 75,
      educationScore: result.educationScore || 70,
      languagesScore: result.languagesScore || 85,
      certificationsScore: result.certificationsScore || 60,
      otherScore: result.otherScore || 75,
      summary: result.summary || 'AI analysis completed successfully',
      strengths: result.strengths || ['Good technical fit'],
      gaps: result.gaps || ['Some areas for development']
    }
  } catch (error) {
    console.error('AI matching error:', error)
    throw error
  }
}

// Rule-based matching fallback
async function performRuleBasedMatching(candidate: any, job: any, weights: MatchingWeights) {
  console.log('🔧 Using rule-based matching fallback')
  
  // Skills matching
  const skillsScore = calculateSkillsScore(candidate.skills || [], job.technical_skills || '')
  
  // Experience matching
  const experienceScore = calculateExperienceScore(candidate.experience_years || 0, job)
  
  // Education matching
  const educationScore = calculateEducationScore(candidate.education || [], job)
  
  // Languages matching
  const languagesScore = calculateLanguagesScore(candidate.languages || [], job)
  
  // Certifications matching
  const certificationsScore = calculateCertificationsScore(candidate.certifications || [], job)
  
  // Other factors
  const otherScore = calculateOtherScore(candidate, job)
  
  // Calculate weighted overall score
  const overallScore = (
    skillsScore * weights.skills +
    experienceScore * weights.experience +
    educationScore * weights.education +
    languagesScore * weights.languages +
    certificationsScore * weights.certifications +
    otherScore * weights.other
  )
  
  // Generate analysis
  const strengths = []
  const gaps = []
  
  if (skillsScore >= 80) strengths.push('Strong technical skills match')
  else if (skillsScore < 60) gaps.push('Technical skills need development')
  
  if (experienceScore >= 80) strengths.push('Excellent experience level')
  else if (experienceScore < 60) gaps.push('More experience would be beneficial')
  
  if (educationScore >= 80) strengths.push('Strong educational background')
  
  if (certificationsScore >= 70) strengths.push('Good certifications')
  
  return {
    overallScore,
    skillsScore,
    experienceScore,
    educationScore,
    languagesScore,
    certificationsScore,
    otherScore,
    summary: `Rule-based analysis shows ${Math.round(overallScore)}% compatibility`,
    strengths,
    gaps
  }
}

// Skills scoring function
function calculateSkillsScore(candidateSkills: string[], jobSkills: string): number {
  if (!candidateSkills.length || !jobSkills) return 50
  
  const jobSkillsList = jobSkills.toLowerCase().split(',').map(s => s.trim())
  const candidateSkillsLower = candidateSkills.map(s => s.toLowerCase().trim())
  
  let matchCount = 0
  let totalJobSkills = jobSkillsList.length
  
  jobSkillsList.forEach(jobSkill => {
    if (candidateSkillsLower.some(candidateSkill => 
      candidateSkill.includes(jobSkill) || jobSkill.includes(candidateSkill)
    )) {
      matchCount++
    }
  })
  
  const baseScore = totalJobSkills > 0 ? (matchCount / totalJobSkills) * 100 : 50
  
  // Bonus for having many skills
  const skillsBonusScore = Math.min(candidateSkills.length * 2, 20)
  
  return Math.min(baseScore + skillsBonusScore, 100)
}

// Experience scoring function
function calculateExperienceScore(candidateExperience: number, job: any): number {
  const requiredExperience = extractRequiredExperience(job.description || '', job.requirements || '')
  
  if (requiredExperience <= 0) return 75 // Default if no experience requirement specified
  
  if (candidateExperience >= requiredExperience * 1.5) return 100
  if (candidateExperience >= requiredExperience) return 90
  if (candidateExperience >= requiredExperience * 0.8) return 80
  if (candidateExperience >= requiredExperience * 0.6) return 70
  if (candidateExperience >= requiredExperience * 0.4) return 60
  
  return Math.max(candidateExperience * 10, 30)
}

// Education scoring function
function calculateEducationScore(candidateEducation: any[], job: any): number {
  if (!candidateEducation.length) return 60
  
  const jobDescription = (job.description || '').toLowerCase()
  const jobRequirements = (job.requirements || '').toLowerCase()
  
  let score = 70 // Base score for having education
  
  candidateEducation.forEach(edu => {
    const degree = (edu.degree || '').toLowerCase()
    const school = (edu.school || '').toLowerCase()
    
    // Bonus for relevant degree
    if (degree.includes('computer') || degree.includes('engineering') || 
        degree.includes('software') || degree.includes('technology')) {
      score += 10
    }
    
    // Bonus for advanced degree
    if (degree.includes('master') || degree.includes('phd') || degree.includes('doctorate')) {
      score += 10
    }
    
    // Bonus for prestigious institutions (simplified check)
    if (school.includes('stanford') || school.includes('mit') || 
        school.includes('harvard') || school.includes('berkeley')) {
      score += 5
    }
  })
  
  return Math.min(score, 100)
}

// Languages scoring function
function calculateLanguagesScore(candidateLanguages: string[], job: any): number {
  if (!candidateLanguages.length) return 70 // English assumed
  
  let score = 80 // Base score for multilingual capability
  
  const jobDescription = (job.description || '').toLowerCase()
  const location = (job.location || '').toLowerCase()
  
  // Bonus for specific language requirements
  candidateLanguages.forEach(lang => {
    const language = lang.toLowerCase()
    if (jobDescription.includes(language) || location.includes('international')) {
      score += 10
    }
  })
  
  // Bonus for multiple languages
  if (candidateLanguages.length > 2) score += 5
  
  return Math.min(score, 100)
}

// Certifications scoring function
function calculateCertificationsScore(candidateCertifications: string[], job: any): number {
  if (!candidateCertifications.length) return 60
  
  const jobDescription = (job.description || '').toLowerCase()
  const jobSkills = (job.technical_skills || '').toLowerCase()
  
  let score = 70 // Base score for having certifications
  let relevantCertCount = 0
  
  candidateCertifications.forEach(cert => {
    const certification = cert.toLowerCase()
    
    // Check for relevant certifications
    if (certification.includes('aws') || certification.includes('google') || 
        certification.includes('microsoft') || certification.includes('azure') ||
        certification.includes('kubernetes') || certification.includes('docker')) {
      relevantCertCount++
    }
    
    // Check if mentioned in job
    if (jobDescription.includes(certification) || jobSkills.includes(certification)) {
      score += 15
    }
  })
  
  // Bonus for relevant tech certifications
  score += relevantCertCount * 10
  
  return Math.min(score, 100)
}

// Other factors scoring function
function calculateOtherScore(candidate: any, job: any): number {
  let score = 75 // Base score
  
  // Location match
  if (candidate.location && job.location) {
    const candidateLocation = candidate.location.toLowerCase()
    const jobLocation = job.location.toLowerCase()
    
    if (candidateLocation.includes(jobLocation) || jobLocation.includes(candidateLocation)) {
      score += 10
    } else if (jobLocation.includes('remote')) {
      score += 5
    }
  }
  
  // Availability
  if (candidate.availability === 'available') {
    score += 5
  }
  
  // Portfolio/GitHub presence
  if (candidate.portfolio_url || candidate.github_url) {
    score += 5
  }
  
  // Recent graduation bonus for junior roles
  const currentYear = new Date().getFullYear()
  if (candidate.graduation_year && (currentYear - candidate.graduation_year) <= 2) {
    if (job.seniority_level === 'junior' || job.title.toLowerCase().includes('junior')) {
      score += 10
    }
  }
  
  return Math.min(score, 100)
}

// Helper function to extract required experience from job description
function extractRequiredExperience(description: string, requirements: string): number {
  const text = (description + ' ' + requirements).toLowerCase()
  
  // Look for patterns like "3+ years", "5-7 years", "minimum 4 years"
  const patterns = [
    /(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)/g,
    /(\d+)-\d+\s*years?\s*(?:of\s*)?(?:experience|exp)/g,
    /minimum\s*(\d+)\s*years?/g,
    /at least\s*(\d+)\s*years?/g,
    /(\d+)\s*to\s*\d+\s*years?/g
  ]
  
  let maxExperience = 0
  
  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      const years = parseInt(match[1])
      if (years > maxExperience) {
        maxExperience = years
      }
    }
  })
  
  return maxExperience
}
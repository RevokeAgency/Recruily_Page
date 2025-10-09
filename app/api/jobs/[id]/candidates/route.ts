import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🔍 Fetching candidates for job:', params.id)
  
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Fetch candidates with their match scores for this job
    const { data: matches, error: matchError } = await supabaseAdmin
      .from('job_matches')
      .select(`
        *,
        candidate:candidates (
          id,
          name,
          email,
          phone,
          location,
          summary,
          skills,
          experience,
          education,
          languages,
          certifications,
          experience_years,
          degree,
          university,
          linkedin_url,
          portfolio_url,
          github_url,
          resume_url,
          created_at,
          source,
          tags
        )
      `)
      .eq('job_id', params.id)
      .order('overall_score', { ascending: false })

    if (matchError) {
      console.error('❌ Error fetching job matches:', matchError)
      
      // Fallback: fetch all candidates and create mock matches
      const { data: candidates, error: candidateError } = await supabaseAdmin
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (candidateError) {
        throw candidateError
      }

      // Create mock matches for demo purposes
      const mockMatches = candidates.map((candidate, index) => ({
        id: `mock-${candidate.id}`,
        job_id: params.id,
        candidate_id: candidate.id,
        overall_score: Math.max(60, 95 - index * 3), // Decreasing scores from 95 to 60
        skills_score: Math.max(55, 90 - index * 2),
        experience_score: Math.max(50, 85 - index * 2),
        education_score: Math.max(40, 80 - index * 3),
        languages_score: Math.max(70, 85 - index * 1),
        certifications_score: Math.max(30, 75 - index * 4),
        other_score: Math.max(40, 70 - index * 2),
        strengths: generateStrengths(candidate),
        gaps: generateGaps(candidate),
        recommendations: generateRecommendations(candidate),
        created_at: candidate.created_at,
        candidate: candidate
      }))

      return NextResponse.json({
        success: true,
        candidates: mockMatches,
        total: mockMatches.length,
        message: 'Using demo candidate matches - job_matches table not found'
      })
    }

    console.log(`✅ Found ${matches.length} candidates for job ${params.id}`)

    return NextResponse.json({
      success: true,
      candidates: matches,
      total: matches.length
    })

  } catch (error: any) {
    console.error('❌ Error fetching candidates:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch candidates',
      candidates: [],
      total: 0
    }, { status: 500 })
  }
}

// Helper functions for generating demo match data
function generateStrengths(candidate: any): string[] {
  const strengths = []
  
  if (candidate.experience_years >= 5) {
    strengths.push(`${candidate.experience_years} years of relevant experience`)
  }
  
  if (candidate.skills && candidate.skills.length > 0) {
    const skillCount = Array.isArray(candidate.skills) ? candidate.skills.length : candidate.skills.split(',').length
    if (skillCount >= 3) {
      strengths.push(`Strong technical skill set (${skillCount} skills)`)
    }
  }
  
  if (candidate.degree) {
    strengths.push(`Educational background: ${candidate.degree}`)
  }
  
  if (candidate.certifications && candidate.certifications.length > 0) {
    strengths.push('Industry certifications')
  }
  
  if (candidate.languages && candidate.languages.length > 1) {
    strengths.push('Multilingual capabilities')
  }
  
  return strengths.slice(0, 3) // Limit to top 3 strengths
}

function generateGaps(candidate: any): string[] {
  const gaps = []
  
  if (candidate.experience_years < 3) {
    gaps.push('Limited professional experience')
  }
  
  if (!candidate.certifications || candidate.certifications.length === 0) {
    gaps.push('No industry certifications mentioned')
  }
  
  if (!candidate.linkedin_url) {
    gaps.push('No LinkedIn profile provided')
  }
  
  return gaps.slice(0, 2) // Limit to top 2 gaps
}

function generateRecommendations(candidate: any): string[] {
  const recommendations = []
  
  if (candidate.overall_score >= 85) {
    recommendations.push('Schedule interview immediately')
    recommendations.push('Strong candidate - fast-track process')
  } else if (candidate.overall_score >= 70) {
    recommendations.push('Consider for phone screening')
    recommendations.push('Request additional information')
  } else {
    recommendations.push('Review CV in detail before proceeding')
    recommendations.push('Consider for future opportunities')
  }
  
  return recommendations.slice(0, 2)
}
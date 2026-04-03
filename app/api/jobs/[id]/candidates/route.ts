import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CandidateStore } from '@/lib/candidate-store'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🔍 Fetching candidates for job:', params.id)

  try {
    // Check for uploaded candidates in memory store
    const uploadedCandidates = CandidateStore.getCandidatesForJob(params.id)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('⚠️ Supabase credentials not available')
      return NextResponse.json({
        success: true,
        candidates: uploadedCandidates,
        total: uploadedCandidates.length,
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Fetch matches with joined candidate data using the real `matches` table
    const { data: matches, error: matchError } = await supabaseAdmin
      .from('matches')
      .select(`
        *,
        candidate:candidates (
          id,
          name,
          email,
          phone,
          location,
          status,
          skills,
          experience_years,
          education,
          summary,
          languages,
          certifications,
          organisation_id,
          created_at,
          updated_at
        )
      `)
      .eq('job_id', params.id)
      .order('score', { ascending: false })

    if (matchError) {
      console.error('❌ Error fetching job matches:', matchError)
      return NextResponse.json({
        success: true,
        candidates: uploadedCandidates,
        total: uploadedCandidates.length,
      })
    }

    console.log(`✅ Found ${matches?.length || 0} matches for job ${params.id}`)

    const transformedMatches = (matches || []).map((match: any) => {
      const candidate = match.candidate || {}
      return {
        id: match.id,
        candidate_id: match.candidate_id,
        job_id: match.job_id,
        overall_score: match.score,
        skills_score: match.skill_matches?.skills_score || 0,
        experience_score: match.experience_match || 0,
        education_score: 0,
        strengths: Array.isArray(match.strengths) ? match.strengths : [],
        gaps: Array.isArray(match.weaknesses) ? match.weaknesses : [],
        recommendations: [],
        status: match.status,
        created_at: match.created_at,
        candidate: {
          id: candidate.id,
          name: candidate.name || '',
          email: candidate.email || '',
          phone: candidate.phone,
          location: candidate.location,
          status: candidate.status,
          skills: Array.isArray(candidate.skills) ? candidate.skills : [],
          experience: [],
          education: Array.isArray(candidate.education) ? candidate.education : [],
          summary: candidate.summary || '',
          languages: Array.isArray(candidate.languages) ? candidate.languages : ['English'],
          certifications: Array.isArray(candidate.certifications) ? candidate.certifications : [],
          experience_years: candidate.experience_years || 0,
          tags: [],
        }
      }
    })

    const combinedCandidates = [...uploadedCandidates, ...transformedMatches]

    return NextResponse.json({
      success: true,
      candidates: combinedCandidates,
      total: combinedCandidates.length,
    })

  } catch (error: any) {
    console.error('❌ Error fetching candidates:', error)
    const uploadedCandidates = CandidateStore.getCandidatesForJob(params.id)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch candidates',
      candidates: uploadedCandidates,
      total: uploadedCandidates.length
    }, { status: 500 })
  }
}
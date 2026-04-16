import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🔍 Fetching candidates for job:', params.id)

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: matches, error } = await supabaseAdmin
      .from('matches')
      .select(`
        id,
        score,
        strengths,
        weaknesses,
        skill_matches,
        experience_match,
        status,
        created_at,
        candidate_id,
        job_id,
        candidate:candidates (
          id,
          name,
          email,
          phone,
          location,
          skills,
          experience_years,
          education,
          summary,
          languages,
          certifications,
          organisation_id,
          created_at
        )
      `)
      .eq('job_id', params.id)
      .order('score', { ascending: false })

    if (error) {
      console.error('❌ Error fetching job matches:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log(`✅ Found ${matches?.length ?? 0} matches for job ${params.id}`)

    const candidates = (matches ?? []).map((match: any) => {
      const candidate = match.candidate || {}
      return {
        id: match.id,
        match_id: match.id,
        candidate_id: match.candidate_id,
        job_id: match.job_id,
        overall_score: match.score ?? 0,
        skills_score: match.skill_matches?.skills_score ?? 0,
        experience_score: match.experience_match ?? match.skill_matches?.experience_score ?? 0,
        education_score: match.skill_matches?.education_score ?? 0,
        strengths: Array.isArray(match.strengths) ? match.strengths : [],
        gaps: Array.isArray(match.weaknesses) ? match.weaknesses : [],
        recommendations: Array.isArray(match.skill_matches?.recommendations) ? match.skill_matches.recommendations : [],
        match_status: match.status,
        created_at: match.created_at,
        candidate: {
          id: candidate.id,
          name: candidate.name || '',
          email: candidate.email || '',
          phone: candidate.phone,
          location: candidate.location,
          skills: Array.isArray(candidate.skills) ? candidate.skills : [],
          education: candidate.education ? (typeof candidate.education === 'string' ? [candidate.education] : candidate.education) : [],
          summary: candidate.summary || '',
          languages: Array.isArray(candidate.languages) ? candidate.languages : ['English'],
          certifications: Array.isArray(candidate.certifications) ? candidate.certifications : [],
          experience_years: candidate.experience_years ?? 0,
        },
      }
    })

    return NextResponse.json({
      success: true,
      candidates,
      total: candidates.length,
    })

  } catch (error: any) {
    console.error('❌ Error fetching candidates:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch candidates', candidates: [], total: 0 },
      { status: 500 }
    )
  }
}

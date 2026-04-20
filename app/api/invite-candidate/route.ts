import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { GEMINI_MODELS, GEMINI_MODEL_PRIMARY } from '@/lib/gemini-ai'

// ─── Gemini REST API (direct fetch, no SDK) ───────────────────────────────────

const GEMINI_BASE = 'https://generativelanguage.googleapis.com'
const GEMINI_API_VERSION = 'v1beta'
const MATCH_MODELS = GEMINI_MODELS
const TIMEOUT_MS = 11000

async function matchWithGemini(candidate: any, job: any): Promise<any> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const cSkills = (candidate.skills ?? []).join(', ') || '—'
  const jSkills = (job.skills ?? []).join(', ') || '—'

  const prompt = `You are a senior DACH recruiter. Score this candidate against this job. Return ONLY the JSON object — no prose, no markdown.

CANDIDATE:
Name: ${candidate.name} | Experience: ${candidate.experience_years ?? 0} years
Skills: ${cSkills}
Education: ${candidate.education || '—'} | Languages: ${(candidate.languages ?? []).join(', ')} | Location: ${candidate.location || '—'}

JOB:
Title: ${job.title} | Company: ${job.company || '—'}
Required Skills: ${jSkills}
Requirements: ${(job.requirements || '').substring(0, 300)}

{"score":0,"skills_score":0,"experience_score":0,"education_score":0,"languages_score":0,"strengths":[],"weaknesses":[],"recommendations":[]}`

  const contents = [{ role: 'user', parts: [{ text: prompt }] }]
  let lastError: Error | null = null

  for (const modelId of MATCH_MODELS) {
    const url = `${GEMINI_BASE}/${GEMINI_API_VERSION}/models/${modelId}:generateContent?key=${apiKey}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: { maxOutputTokens: 1024, temperature: 0.1, responseMimeType: 'application/json' },
        }),
        signal: controller.signal,
      })
      if (!res.ok) {
        lastError = new Error(`Gemini ${res.status} on ${modelId}`)
        console.warn(`⚠️ ${lastError.message}`)
        continue
      }
      const data = await res.json() as any
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) { lastError = new Error(`No text from ${modelId}`); continue }
      return JSON.parse(text)
    } catch (err: any) {
      lastError = err
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastError ?? new Error('All Gemini models failed')
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  console.log('🤝 [POST] /api/invite-candidate')

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: { user }, error: authError } = await admin.auth.getUser(token)
    if (!user || authError) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // ── Body ──────────────────────────────────────────────────────────────────
    const body = await request.json()
    const { jobId, candidateId } = body

    if (!jobId) return NextResponse.json({ success: false, error: 'Job ID is required' }, { status: 400 })
    if (!candidateId) return NextResponse.json({ success: false, error: 'Candidate ID is required' }, { status: 400 })

    console.log(`🔗 Inviting candidate ${candidateId} to job ${jobId}`)

    // ── Fetch job + candidate in parallel ─────────────────────────────────────
    const [{ data: job, error: jobErr }, { data: candidate, error: candErr }] = await Promise.all([
      admin.from('jobs').select('*').eq('id', jobId).single(),
      admin.from('candidates').select('*').eq('id', candidateId).single(),
    ])

    if (jobErr || !job) {
      console.error('❌ Job not found:', jobErr?.message)
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 })
    }

    if (candErr || !candidate) {
      console.error('❌ Candidate not found:', candErr?.message)
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 })
    }

    // ── Check for existing match ───────────────────────────────────────────────
    const { data: existingMatch } = await admin
      .from('matches')
      .select('id')
      .eq('job_id', jobId)
      .eq('candidate_id', candidateId)
      .maybeSingle()

    if (existingMatch?.id) {
      return NextResponse.json({ success: false, error: 'Candidate is already invited to this job' }, { status: 409 })
    }

    // ── Gemini matching (no dummy fallback) ───────────────────────────────────
    let geminiScores: any
    try {
      geminiScores = await matchWithGemini(candidate, job)
    } catch (geminiErr: any) {
      console.error('❌ Gemini matching failed:', geminiErr.message)
      return NextResponse.json(
        { success: false, error: `Match scoring unavailable: ${geminiErr.message}` },
        { status: 503 }
      )
    }

    const score = Math.max(0, Math.min(100, Math.round(geminiScores.score ?? 0)))
    const skillsScore = Math.round(geminiScores.skills_score ?? 0)
    const experienceScore = Math.round(geminiScores.experience_score ?? 0)
    const educationScore = Math.round(geminiScores.education_score ?? 0)
    const languagesScore = Math.round(geminiScores.languages_score ?? 0)
    const strengths = Array.isArray(geminiScores.strengths) ? geminiScores.strengths : []
    const weaknesses = Array.isArray(geminiScores.weaknesses) ? geminiScores.weaknesses : []
    const recommendations = Array.isArray(geminiScores.recommendations) ? geminiScores.recommendations : []

    console.log(`✅ Gemini score: ${score}%`)

    // ── Insert match record ───────────────────────────────────────────────────
    const { data: match, error: matchErr } = await admin
      .from('matches')
      .insert([{
        id: uuidv4(),
        job_id: jobId,
        candidate_id: candidateId,
        score,
        status: 'invited',
        strengths,
        weaknesses,
        skill_matches: {
          skills_score: skillsScore,
          experience_score: experienceScore,
          education_score: educationScore,
          languages_score: languagesScore,
          recommendations,
        },
        experience_match: experienceScore,
        ai_analysis: {
          overall_score: score,
          skills_breakdown: {
            skills: skillsScore,
            experience: experienceScore,
            education: educationScore,
            languages: languagesScore,
          },
          generated_by: GEMINI_MODEL_PRIMARY,
        },
      }])
      .select()
      .single()

    if (matchErr) {
      console.error('❌ Match insert error:', matchErr.message)
      return NextResponse.json({ success: false, error: matchErr.message }, { status: 500 })
    }

    console.log(`✅ Invitation created: ${match.id} — ${score}%`)

    return NextResponse.json({
      success: true,
      match,
      message: `Candidate successfully invited with ${score}% match score`,
    })

  } catch (error: any) {
    console.error('❌ /api/invite-candidate error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Unexpected error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 26

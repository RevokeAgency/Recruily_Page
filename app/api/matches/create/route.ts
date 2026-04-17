import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// ─── Gemini REST API (direct fetch — no SDK, no model discovery) ──────────────

const GEMINI_BASE = 'https://generativelanguage.googleapis.com'
const GEMINI_API_VERSION = 'v1beta'
const MATCH_MODELS = ['gemini-3.0-flash', 'gemini-2.5-flash']
const TIMEOUT_MS = 8000

async function matchWithGemini(candidate: any, job: any): Promise<any> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const prompt = `Analyze the match between this candidate and job. Always close the JSON object completely with '}'.

CANDIDATE:
Name: ${candidate.name}
Experience: ${candidate.experience_years ?? 0} years
Skills: ${(candidate.skills ?? []).join(', ') || 'Not specified'}
Education: ${candidate.education || 'Not specified'}
Languages: ${(candidate.languages ?? []).join(', ') || 'Not specified'}
Summary: ${(candidate.summary || '').substring(0, 300)}

JOB:
Title: ${job.title}
Company: ${job.company || 'Unknown'}
Required Skills: ${(job.skills ?? []).join(', ') || 'Not specified'}
Requirements: ${(job.requirements || '').substring(0, 400)}
Description: ${(job.description || '').substring(0, 300)}

Return ONLY this JSON (integers 0-100, arrays of strings):
{"score":75,"skills_score":70,"experience_score":80,"education_score":75,"languages_score":85,"strengths":["Strength 1"],"weaknesses":["Gap 1"],"recommendations":["Recommendation 1"]}`

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
        const errBody = await res.text().catch(() => '')
        lastError = new Error(`Gemini ${res.status} on ${modelId}: ${errBody.slice(0, 200)}`)
        console.warn(`⚠️ ${lastError.message}`)
        continue
      }

      const data = await res.json() as any
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) { lastError = new Error(`No text from ${modelId}`); continue }

      console.log(`✅ Gemini match ${modelId}: ${text.length} chars`)
      return JSON.parse(text)

    } catch (err: any) {
      console.warn(`⚠️ Gemini ${modelId} error: ${err.message}`)
      lastError = err
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError ?? new Error('All Gemini models failed')
}

// ─── Fallback scoring (no Gemini) ─────────────────────────────────────────────

function calculateFallbackScore(candidate: any, job: any) {
  const candidateSkills: string[] = (candidate.skills ?? []).map((s: string) => s.toLowerCase())
  const jobSkills: string[] = (job.skills ?? []).map((s: string) => s.toLowerCase())

  const matchedSkills = jobSkills.filter(js =>
    candidateSkills.some(cs => cs.includes(js) || js.includes(cs))
  )

  const skillsScore = jobSkills.length > 0
    ? Math.round((matchedSkills.length / jobSkills.length) * 100)
    : 60

  const expYears = candidate.experience_years ?? 0
  const experienceScore = Math.min(100, 40 + expYears * 8)
  const educationScore = candidate.education ? 75 : 60
  const languagesScore = (candidate.languages?.length ?? 0) > 1 ? 85 : 75

  const score = Math.round(
    skillsScore * 0.40 +
    experienceScore * 0.30 +
    educationScore * 0.10 +
    languagesScore * 0.10 +
    70 * 0.10   // other
  )

  return {
    score,
    skills_score: skillsScore,
    experience_score: experienceScore,
    education_score: educationScore,
    languages_score: languagesScore,
    strengths: [
      `${expYears} years of professional experience`,
      matchedSkills.length > 0 ? `Skills match: ${matchedSkills.slice(0, 3).join(', ')}` : 'Professional background',
      candidate.education ? `Education: ${candidate.education}` : 'Industry experience',
    ].filter(Boolean),
    weaknesses: [
      matchedSkills.length < jobSkills.length ? `Missing skills: ${jobSkills.filter(s => !matchedSkills.includes(s)).slice(0, 2).join(', ')}` : null,
      expYears < 2 ? 'Limited work experience' : null,
    ].filter(Boolean) as string[],
    recommendations: [
      score >= 75 ? 'Strong candidate — schedule interview' : 'Consider for initial screening',
      'Review full CV for additional context',
    ],
  }
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  console.log('🎯 [POST] /api/matches/create')

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

    // ── Org ───────────────────────────────────────────────────────────────────
    const { data: org } = await admin
      .from('organisations')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!org?.id) {
      return NextResponse.json({ success: false, error: 'Organisation not found' }, { status: 404 })
    }

    // ── Body ──────────────────────────────────────────────────────────────────
    const { candidateId, jobId } = await request.json()

    if (!candidateId || !jobId) {
      return NextResponse.json({ success: false, error: 'candidateId and jobId are required' }, { status: 400 })
    }

    console.log(`🔗 Matching candidate ${candidateId} ↔ job ${jobId}`)

    // ── Fetch candidate + job ─────────────────────────────────────────────────
    const [{ data: candidate, error: candErr }, { data: job, error: jobErr }] = await Promise.all([
      admin.from('candidates').select('*').eq('id', candidateId).single(),
      admin.from('jobs').select('*').eq('id', jobId).single(),
    ])

    if (candErr || !candidate) {
      console.error('❌ Candidate not found:', candErr?.message)
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 })
    }

    if (jobErr || !job) {
      console.error('❌ Job not found:', jobErr?.message)
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 })
    }

    console.log(`👤 Candidate: ${candidate.name} | 💼 Job: ${job.title}`)

    // ── Calculate match scores ────────────────────────────────────────────────
    let scores: ReturnType<typeof calculateFallbackScore>

    try {
      const geminiScores = await matchWithGemini(candidate, job)
      scores = {
        score: Math.max(0, Math.min(100, Math.round(geminiScores.score ?? 70))),
        skills_score: Math.round(geminiScores.skills_score ?? 70),
        experience_score: Math.round(geminiScores.experience_score ?? 70),
        education_score: Math.round(geminiScores.education_score ?? 70),
        languages_score: Math.round(geminiScores.languages_score ?? 80),
        strengths: Array.isArray(geminiScores.strengths) ? geminiScores.strengths : [],
        weaknesses: Array.isArray(geminiScores.weaknesses) ? geminiScores.weaknesses : [],
        recommendations: Array.isArray(geminiScores.recommendations) ? geminiScores.recommendations : [],
      }
      console.log(`✅ Gemini match score: ${scores.score}%`)
    } catch (geminiErr: any) {
      console.warn('⚠️ Gemini matching failed, using fallback:', geminiErr.message)
      scores = calculateFallbackScore(candidate, job)
      console.log(`✅ Fallback match score: ${scores.score}%`)
    }

    // ── Check if match already exists ─────────────────────────────────────────
    const { data: existingMatch } = await admin
      .from('matches')
      .select('id')
      .eq('job_id', jobId)
      .eq('candidate_id', candidateId)
      .maybeSingle()

    const scorePayload = {
      score: scores.score,
      status: 'pending',
      strengths: scores.strengths,
      weaknesses: scores.weaknesses,
      skill_matches: {
        skills_score: scores.skills_score,
        experience_score: scores.experience_score,
        education_score: scores.education_score,
        languages_score: scores.languages_score,
        recommendations: scores.recommendations,
      },
      experience_match: scores.experience_score,
      ai_analysis: {
        overall_score: scores.score,
        skills_breakdown: {
          skills: scores.skills_score,
          experience: scores.experience_score,
          education: scores.education_score,
          languages: scores.languages_score,
        },
        generated_by: 'gemini-1.5-flash',
      },
    }

    let savedMatch: any = null
    let matchErr: any = null

    if (existingMatch?.id) {
      // ── UPDATE existing match ─────────────────────────────────────────────
      console.log(`🔄 Updating existing match ${existingMatch.id}`)
      const { data, error } = await admin
        .from('matches')
        .update(scorePayload)
        .eq('id', existingMatch.id)
        .select()
        .single()
      savedMatch = data
      matchErr = error
    } else {
      // ── INSERT new match ──────────────────────────────────────────────────
      console.log('➕ Inserting new match')
      const { data, error } = await admin
        .from('matches')
        .insert([{ id: uuidv4(), candidate_id: candidateId, job_id: jobId, ...scorePayload }])
        .select()
        .single()
      savedMatch = data
      matchErr = error
    }

    if (matchErr) {
      console.error('❌ Match save error:', matchErr.message, matchErr.code, matchErr.details)
      return NextResponse.json({ success: false, error: matchErr.message }, { status: 500 })
    }

    console.log(`✅ Match saved: ${savedMatch.id} — score ${savedMatch.score}%`)

    return NextResponse.json({
      success: true,
      match: savedMatch,
      message: `Match created: ${savedMatch.score}% compatibility`,
    })

  } catch (error: any) {
    console.error('❌ /api/matches/create error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

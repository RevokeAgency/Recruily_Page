import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { GEMINI_MODELS, GEMINI_MODEL_PRIMARY } from '@/lib/gemini-ai'

// ─── Gemini REST API (direct fetch — no SDK) ───────────────────────────────────

const GEMINI_BASE = 'https://generativelanguage.googleapis.com'
const GEMINI_API_VERSION = 'v1beta'
const MATCH_MODELS = GEMINI_MODELS
const TIMEOUT_MS = 11000

// ─── IMLRS 6-Layer Matching ────────────────────────────────────────────────────
// Based on RECRUILY Product Sheet — Intelligent Multi-Layer Recruiting System
//
// Layer 1 — Hard Skills Match       (25%) skills overlap
// Layer 2 — Experience Trajectory   (20%) years, progression, industry relevance
// Layer 3 — Soft Skills & Culture   (15%) inferred from CV language
// Layer 4 — Motivation & Fit        (10%) job–background alignment
// Layer 5 — Languages & Education   (16%) language reqs, degree fit
// Layer 6 — Location & CV Quality   (14%) remote/onsite fit, data completeness

async function matchWithGemini(candidate: any, job: any): Promise<any> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const cSkills = (candidate.skills ?? []).join(', ') || '—'
  const jSkills = (job.skills ?? []).join(', ') || '—'
  const requirements = (job.requirements || '').substring(0, 300)

  const prompt = `You are a senior DACH recruiter. Evaluate this candidate against this job using the 6-layer IMLRS framework. Return ONLY the JSON object — no prose, no markdown fences.

CANDIDATE:
Name: ${candidate.name} | Experience: ${candidate.experience_years ?? 0} years
Skills: ${cSkills}
Education: ${candidate.education || '—'} | Languages: ${(candidate.languages ?? []).join(', ')} | Location: ${candidate.location || '—'}

JOB:
Title: ${job.title} | Company: ${job.company || '—'}
Required Skills: ${jSkills}
Requirements: ${requirements}

SCORING LAYERS (integer scores 0-100):
- skills_score (25%): Hard skills overlap — how many required skills does the candidate have?
- experience_score (20%): Years, seniority progression, industry relevance.
- soft_skills_score (15%): Inferred from CV completeness, language, career coherence.
- motivation_score (10%): Job-background alignment, logical career move.
- education_score (8%): Degree level fit, language requirements met.
- location_score (7%): Location/remote fit based on job and candidate location.
- score: Weighted overall 0-100. Formula: skills*0.25 + experience*0.20 + soft_skills*0.15 + motivation*0.10 + education*0.08 + location*0.07 + (completeness bonus up to 15).
- strengths: Up to 3 specific reasons this candidate fits (cite concrete facts).
- weaknesses: Up to 3 specific gaps or risks (cite concrete facts).
- recommendations: 1-2 actionable recruiter recommendations.

{"score":0,"skills_score":0,"experience_score":0,"soft_skills_score":0,"motivation_score":0,"education_score":0,"location_score":0,"strengths":[],"weaknesses":[],"recommendations":[]}`

  const contents = [{ role: 'user', parts: [{ text: prompt }] }]
  let lastError: Error | null = null
  console.time('gemini-match')

  try {
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
  } finally {
    console.timeEnd('gemini-match')
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

    // ── IMLRS 6-Layer Matching (no fallback — clean error on failure) ─────────
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

    const scores = {
      score: Math.max(0, Math.min(100, Math.round(geminiScores.score ?? 0))),
      skills_score: Math.round(geminiScores.skills_score ?? 0),
      experience_score: Math.round(geminiScores.experience_score ?? 0),
      soft_skills_score: Math.round(geminiScores.soft_skills_score ?? 0),
      motivation_score: Math.round(geminiScores.motivation_score ?? 0),
      education_score: Math.round(geminiScores.education_score ?? 0),
      location_score: Math.round(geminiScores.location_score ?? 0),
      strengths: Array.isArray(geminiScores.strengths) ? geminiScores.strengths : [],
      weaknesses: Array.isArray(geminiScores.weaknesses) ? geminiScores.weaknesses : [],
      recommendations: Array.isArray(geminiScores.recommendations) ? geminiScores.recommendations : [],
    }

    console.log(`✅ IMLRS score: ${scores.score}% (skills:${scores.skills_score} exp:${scores.experience_score} soft:${scores.soft_skills_score})`)

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
        soft_skills_score: scores.soft_skills_score,
        motivation_score: scores.motivation_score,
        location_score: scores.location_score,
        recommendations: scores.recommendations,
      },
      experience_match: scores.experience_score,
      ai_analysis: {
        overall_score: scores.score,
        skills_breakdown: {
          skills: scores.skills_score,
          experience: scores.experience_score,
          education: scores.education_score,
          soft_skills: scores.soft_skills_score,
          motivation: scores.motivation_score,
          location: scores.location_score,
        },
        generated_by: GEMINI_MODEL_PRIMARY,
        framework: 'IMLRS-6-layer',
      },
    }

    let savedMatch: any = null
    let matchErr: any = null

    if (existingMatch?.id) {
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
export const maxDuration = 26

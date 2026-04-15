import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { GoogleGenerativeAI } from '@google/generative-ai'

const CV_JSON_PROMPT = `Extract candidate information from this CV. Return ONLY valid JSON, no markdown, no extra text.

Return this exact JSON structure (use null for missing fields):
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "+1234567890",
  "location": "City, Country",
  "summary": "Professional summary in 2-3 sentences",
  "experience_years": 5,
  "skills": ["Skill1", "Skill2", "Skill3"],
  "education": "Highest degree and university",
  "languages": ["English", "German"],
  "certifications": ["Cert1", "Cert2"]
}`

function getGeminiModel() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { maxOutputTokens: 1024, temperature: 0.1 },
  })
}

function cleanJsonResponse(raw: string): any {
  const stripped = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(stripped)
}

// ─── PDF → Gemini natively (no pdf-parse, avoids ENOENT test-file bug) ────────

async function parsePDF(file: File): Promise<any> {
  const model = getGeminiModel()
  const base64 = Buffer.from(await file.arrayBuffer()).toString('base64')

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Gemini timeout after 8s')), 8000)
  )

  const result = await Promise.race([
    model.generateContent([
      { inlineData: { data: base64, mimeType: 'application/pdf' } },
      { text: CV_JSON_PROMPT },
    ]),
    timeoutPromise,
  ])

  return cleanJsonResponse((result as any).response.text())
}

// ─── DOCX → mammoth text → Gemini ─────────────────────────────────────────────

async function parseDOCX(file: File): Promise<any> {
  const mammoth = await import('mammoth')
  const buffer = Buffer.from(await file.arrayBuffer())
  const { value: text } = await mammoth.extractRawText({ buffer })

  if (!text || text.trim().length < 20) throw new Error('Could not extract text from DOCX')

  const model = getGeminiModel()
  const prompt = `${CV_JSON_PROMPT}\n\nCV TEXT:\n${text.substring(0, 4000)}`

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Gemini timeout after 8s')), 8000)
  )

  const result = await Promise.race([model.generateContent(prompt), timeoutPromise])
  return cleanJsonResponse((result as any).response.text())
}

// ─── TXT → Gemini ─────────────────────────────────────────────────────────────

async function parseTXT(file: File): Promise<any> {
  const text = await file.text()
  if (!text || text.trim().length < 20) throw new Error('Text file appears empty')

  const model = getGeminiModel()
  const prompt = `${CV_JSON_PROMPT}\n\nCV TEXT:\n${text.substring(0, 4000)}`

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Gemini timeout after 8s')), 8000)
  )

  const result = await Promise.race([model.generateContent(prompt), timeoutPromise])
  return cleanJsonResponse((result as any).response.text())
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  console.log('📄 [POST] /api/candidates/upload')

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

    // ── File ──────────────────────────────────────────────────────────────────
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File exceeds 10 MB limit' }, { status: 400 })
    }

    console.log(`📎 File: ${file.name} (${file.type}, ${Math.round(file.size / 1024)} KB)`)

    // ── Parse CV with Gemini (strategy depends on file type) ──────────────────
    let parsed: any = {}
    try {
      const type = file.type

      if (type === 'application/pdf') {
        console.log('🤖 Sending PDF directly to Gemini (native PDF support)...')
        parsed = await parsePDF(file)
      } else if (
        type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        type === 'application/msword'
      ) {
        console.log('🤖 Extracting DOCX text → Gemini...')
        parsed = await parseDOCX(file)
      } else if (type === 'text/plain') {
        console.log('🤖 Sending TXT text → Gemini...')
        parsed = await parseTXT(file)
      } else {
        return NextResponse.json(
          { success: false, error: `Unsupported file type: ${type}. Use PDF, DOCX, or TXT.` },
          { status: 400 }
        )
      }

      console.log(`✅ Gemini parsed: ${parsed.name}`)
    } catch (geminiErr: any) {
      console.warn('⚠️ Gemini parsing failed, using filename fallback:', geminiErr.message)
      parsed = {
        name: file.name.replace(/\.[^/.]+$/, '').replace(/[_\-().]/g, ' ').trim(),
        email: null,
        skills: [],
        languages: ['English'],
      }
    }

    // ── Build candidate record (aligned to actual DB schema) ──────────────────
    const candidateId = uuidv4()
    const emailFallback = `cv_import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@recruily-import.com`

    const candidateRecord = {
      id: candidateId,
      organisation_id: org.id,
      created_by: user.id,
      name: (parsed.name || file.name.replace(/\.[^/.]+$/, '')).trim() || 'Unknown Candidate',
      email: parsed.email || emailFallback,
      phone: parsed.phone || null,
      location: parsed.location || null,
      summary: parsed.summary || null,
      experience_years: Number.isInteger(parsed.experience_years) ? parsed.experience_years : 0,
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      education: typeof parsed.education === 'string' ? parsed.education : null,
      languages: Array.isArray(parsed.languages) ? parsed.languages : ['English'],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      status: 'active',
    }

    // ── Upsert (email UNIQUE constraint) ──────────────────────────────────────
    const { data: savedCandidate, error: dbError } = await admin
      .from('candidates')
      .upsert([candidateRecord], { onConflict: 'email', ignoreDuplicates: false })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Candidate upsert error:', dbError.message, dbError.code)
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })
    }

    console.log(`✅ Candidate saved: ${savedCandidate.id} — ${savedCandidate.name}`)

    return NextResponse.json({
      success: true,
      candidate: savedCandidate,
      message: `CV parsed and saved: ${savedCandidate.name}`,
    })

  } catch (error: any) {
    console.error('❌ /api/candidates/upload error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

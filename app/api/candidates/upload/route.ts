import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ─── Gemini model ──────────────────────────────────────────────────────────────

function getModel() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')
  const genAI = new GoogleGenerativeAI(apiKey)
  // gemini-2.0-flash: faster + better document understanding than 1.5-flash
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { maxOutputTokens: 1024, temperature: 0.1 },
  })
}

const TIMEOUT_MS = 9000

function withTimeout<T>(promise: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Gemini timeout after ${ms}ms`)), ms)),
  ])
}

// ─── JSON extraction (handles Gemini wrapping JSON in text/markdown) ───────────

function extractJSON(raw: string): any {
  const stripped = raw.trim()
  // Remove markdown code fences
  const clean = stripped.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  // Try direct parse first
  try { return JSON.parse(clean) } catch {}

  // Find the first {...} block in case Gemini added prose before/after
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try { return JSON.parse(clean.slice(start, end + 1)) } catch {}
  }

  throw new Error(`Could not extract JSON from Gemini response: ${clean.slice(0, 200)}`)
}

const CV_PROMPT = `You are a professional CV/Resume parser. Extract real personal information from this CV.

RULES (follow strictly):
- Extract ONLY information that is explicitly stated in the CV
- "name" must be the real person's full name (e.g. "Maria Müller") — NOT a job title, file title, template heading, or keyword like "Lebenslauf"
- If you cannot find a real person name, return null for "name"
- If you cannot find an email address, return null for "email"
- The CV may be in German, English, or another language — handle it correctly
- Do NOT invent or fabricate any data

Return ONLY this exact JSON — no markdown, no explanation:
{
  "name": "Full Name or null",
  "email": "email@example.com or null",
  "phone": "+1234567890 or null",
  "location": "City, Country or null",
  "summary": "2-3 sentence professional summary or null",
  "experience_years": 5,
  "skills": ["Skill1", "Skill2"],
  "education": "Degree and university or null",
  "languages": ["German", "English"],
  "certifications": ["Cert1"]
}`

// ─── PDF: try text extraction first, fall back to Gemini multimodal ───────────

async function parsePDF(file: File): Promise<any> {
  const buffer = Buffer.from(await file.arrayBuffer())

  // Attempt 1: extract text with pdf-parse (import the lib directly to avoid
  // the ENOENT test-file bug caused by the top-level require in the package root)
  let pdfText = ''
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParseLib = require('pdf-parse/lib/pdf-parse.js')
    const fn = typeof pdfParseLib === 'function' ? pdfParseLib : pdfParseLib.default
    const parsed = await fn(buffer)
    pdfText = (parsed.text || '').trim()
    console.log(`📄 pdf-parse extracted ${pdfText.length} chars`)
  } catch (textErr: any) {
    console.warn('⚠️ pdf-parse failed, will use Gemini multimodal:', textErr.message)
  }

  const model = getModel()

  // Attempt 2a: if we got meaningful text, use a text prompt (most reliable)
  if (pdfText.length > 80) {
    console.log('🤖 Sending extracted PDF text to Gemini...')
    const prompt = `${CV_PROMPT}\n\nCV TEXT:\n${pdfText.substring(0, 4500)}`
    const result = await withTimeout(model.generateContent(prompt))
    return extractJSON((result as any).response.text())
  }

  // Attempt 2b: scanned/image PDF — send binary to Gemini multimodal
  console.log('🤖 Sending PDF binary to Gemini (multimodal — likely scanned)...')
  const base64 = buffer.toString('base64')
  const result = await withTimeout(
    model.generateContent([
      { inlineData: { data: base64, mimeType: 'application/pdf' } },
      { text: CV_PROMPT },
    ])
  )
  return extractJSON((result as any).response.text())
}

// ─── DOCX ─────────────────────────────────────────────────────────────────────

async function parseDOCX(file: File): Promise<any> {
  const mammoth = await import('mammoth')
  const buffer = Buffer.from(await file.arrayBuffer())
  const { value: text } = await mammoth.extractRawText({ buffer })
  if (!text || text.trim().length < 30) throw new Error('Could not extract text from DOCX')

  console.log(`🤖 Sending DOCX text (${text.length} chars) to Gemini...`)
  const model = getModel()
  const prompt = `${CV_PROMPT}\n\nCV TEXT:\n${text.substring(0, 4500)}`
  const result = await withTimeout(model.generateContent(prompt))
  return extractJSON((result as any).response.text())
}

// ─── TXT ──────────────────────────────────────────────────────────────────────

async function parseTXT(file: File): Promise<any> {
  const text = await file.text()
  if (!text || text.trim().length < 30) throw new Error('Text file appears empty')

  console.log(`🤖 Sending TXT (${text.length} chars) to Gemini...`)
  const model = getModel()
  const prompt = `${CV_PROMPT}\n\nCV TEXT:\n${text.substring(0, 4500)}`
  const result = await withTimeout(model.generateContent(prompt))
  return extractJSON((result as any).response.text())
}

// ─── Validate parsed name (reject template headings / filenames) ───────────────

const NON_NAME_PATTERNS = [
  /^lebenslauf/i,       // German for "CV"
  /^curriculum vitae/i,
  /^resume/i,
  /^bewerbung/i,        // German for "application"
  /^vorlage/i,          // German for "template"
  /^\s*$/,
  /^\d+$/,
]

function isValidPersonName(name: string | null | undefined): boolean {
  if (!name || name.trim().length < 2) return false
  const n = name.trim()
  // Must contain at least one space (first + last name) or be clearly a name
  if (NON_NAME_PATTERNS.some(p => p.test(n))) return false
  // If it's very long (>40 chars), it's probably a heading/title, not a name
  if (n.length > 40) return false
  return true
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  console.log('📄 [POST] /api/candidates/upload')

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: { user }, error: authError } = await admin.auth.getUser(token)
    if (!user || authError) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    // ── Org ───────────────────────────────────────────────────────────────────
    const { data: org } = await admin
      .from('organisations')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!org?.id) return NextResponse.json({ success: false, error: 'Organisation not found' }, { status: 404 })

    // ── File ──────────────────────────────────────────────────────────────────
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ success: false, error: 'File exceeds 10 MB' }, { status: 400 })

    console.log(`📎 File: ${file.name} (${file.type}, ${Math.round(file.size / 1024)} KB)`)

    // ── Parse CV ──────────────────────────────────────────────────────────────
    let parsed: any = {}
    let geminiSucceeded = false

    try {
      const type = file.type
      if (type === 'application/pdf') {
        parsed = await parsePDF(file)
      } else if (
        type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        type === 'application/msword'
      ) {
        parsed = await parseDOCX(file)
      } else if (type === 'text/plain') {
        parsed = await parseTXT(file)
      } else {
        return NextResponse.json({ success: false, error: `Unsupported file type: ${type}` }, { status: 400 })
      }
      geminiSucceeded = true
      console.log(`✅ Gemini raw result: name="${parsed.name}" email="${parsed.email}"`)
    } catch (geminiErr: any) {
      console.warn('⚠️ Gemini failed, using filename fallback:', geminiErr.message)
    }

    // Validate name — if Gemini returned a template heading, null it out
    if (geminiSucceeded && !isValidPersonName(parsed.name)) {
      console.warn(`⚠️ Parsed name "${parsed.name}" looks like a template heading — discarding`)
      parsed.name = null
    }

    // ── Build candidate record ────────────────────────────────────────────────
    const candidateId = uuidv4()
    const emailFallback = `cv_import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@recruily-import.com`
    const nameFallback = file.name.replace(/\.[^/.]+$/, '').replace(/[_\-().]+/g, ' ').trim()

    const candidateRecord = {
      id: candidateId,
      organisation_id: org.id,
      created_by: user.id,
      name: (isValidPersonName(parsed.name) ? parsed.name : nameFallback).trim() || 'Unknown Candidate',
      email: (parsed.email && parsed.email.includes('@') && !parsed.email.includes('@email.com'))
        ? parsed.email
        : emailFallback,
      phone: parsed.phone || null,
      location: parsed.location || null,
      summary: parsed.summary || null,
      experience_years: Number.isInteger(parsed.experience_years) && parsed.experience_years >= 0
        ? parsed.experience_years
        : 0,
      skills: Array.isArray(parsed.skills) ? parsed.skills.filter((s: any) => typeof s === 'string' && s.trim()) : [],
      education: typeof parsed.education === 'string' ? parsed.education : null,
      languages: Array.isArray(parsed.languages) ? parsed.languages : ['English'],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      status: 'active',
    }

    console.log(`💾 Saving candidate: name="${candidateRecord.name}" email="${candidateRecord.email}"`)

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
      message: `CV parsed: ${savedCandidate.name}`,
    })

  } catch (error: any) {
    console.error('❌ /api/candidates/upload error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

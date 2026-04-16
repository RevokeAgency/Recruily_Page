import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// ─── Gemini REST API (no SDK — direct fetch for full control + error visibility) ─

const GEMINI_BASE = 'https://generativelanguage.googleapis.com'
const TIMEOUT_MS = 7000   // Netlify hard limit 10s → leave 3s for auth+db

function getApiKey(): string {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY not set in Netlify environment variables')
  return key
}

// Module-level model cache: discovered once per cold-start
let _cachedModel: string | null = null

// ─── Discover which model is actually available for this API key ───────────────

async function discoverModel(): Promise<string> {
  if (_cachedModel) return _cachedModel

  const key = getApiKey()

  // Try v1beta first, then v1
  for (const apiVersion of ['v1beta', 'v1']) {
    try {
      const res = await fetch(
        `${GEMINI_BASE}/${apiVersion}/models?key=${key}&pageSize=50`,
        { signal: AbortSignal.timeout(3000) }
      )
      if (!res.ok) {
        console.warn(`⚠️ List models (${apiVersion}): HTTP ${res.status}`)
        continue
      }
      const data = await res.json() as { models?: Array<{ name: string; supportedGenerationMethods?: string[] }> }
      const all = data.models ?? []
      console.log(`📋 Available models (${apiVersion}):`, all.map(m => m.name).join(', '))

      // Prefer flash models that support generateContent, newest first
      const PREFER = [
        'gemini-2.5-flash', 'gemini-2.5-flash-preview-05-20',
        'gemini-2.5-flash-preview-04-17',
        'gemini-2.0-flash', 'gemini-2.0-flash-001',
        'gemini-2.0-flash-exp', 'gemini-2.0-flash-lite',
        'gemini-1.5-flash-002', 'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro-002', 'gemini-1.5-pro',
      ]
      for (const preferred of PREFER) {
        const match = all.find(m =>
          m.name === `models/${preferred}` &&
          (m.supportedGenerationMethods ?? []).includes('generateContent')
        )
        if (match) {
          const modelId = match.name.replace('models/', '')
          console.log(`✅ Using model: ${modelId} (${apiVersion})`)
          _cachedModel = `${apiVersion}|${modelId}`
          return _cachedModel
        }
      }

      // If none of the preferred match, just take any generateContent capable one
      const any = all.find(m =>
        (m.supportedGenerationMethods ?? []).includes('generateContent') &&
        m.name.includes('gemini')
      )
      if (any) {
        const modelId = any.name.replace('models/', '')
        console.log(`✅ Fallback model: ${modelId} (${apiVersion})`)
        _cachedModel = `${apiVersion}|${modelId}`
        return _cachedModel
      }
    } catch (err: any) {
      console.warn(`⚠️ discoverModel (${apiVersion}) error:`, err.message)
    }
  }

  // Hard fallback — try without discovery
  console.warn('⚠️ Model discovery failed — using gemini-1.5-flash default')
  _cachedModel = 'v1beta|gemini-1.5-flash'
  return _cachedModel
}

// ─── Call Gemini REST API ──────────────────────────────────────────────────────

async function callGemini(contents: any[]): Promise<string> {
  const key = getApiKey()
  const modelSpec = await discoverModel()
  const [apiVersion, modelId] = modelSpec.split('|')

  const url = `${GEMINI_BASE}/${apiVersion}/models/${modelId}:generateContent?key=${key}`

  const body = {
    contents,
    generationConfig: { maxOutputTokens: 512, temperature: 0.1 },
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => '(no body)')
    // Reset cache on 404 so next request re-discovers
    if (res.status === 404) _cachedModel = null
    throw new Error(`Gemini ${res.status} ${res.statusText}: ${errBody.slice(0, 300)}`)
  }

  const data = await res.json() as any
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error(`Gemini returned no text: ${JSON.stringify(data).slice(0, 200)}`)
  return text
}

// ─── JSON extraction ───────────────────────────────────────────────────────────

function extractJSON(raw: string): any {
  const clean = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  try { return JSON.parse(clean) } catch {}
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try { return JSON.parse(clean.slice(start, end + 1)) } catch {}
  }
  throw new Error(`Cannot parse Gemini JSON: ${clean.slice(0, 200)}`)
}

// ─── CV prompt ────────────────────────────────────────────────────────────────

const CV_PROMPT = `You are a CV/Resume parser. Extract real personal information.

STRICT RULES:
- "name": real full name only (e.g. "Maria Müller"). NOT "Lebenslauf", "Resume", "CV", job titles, or headings.
- "email": only real email addresses. NOT placeholder like "name@email.com".
- Return null for any field you cannot find with certainty.
- CV may be in German, English, or other languages.
- Do NOT invent data.

Return ONLY valid JSON, no markdown fences, no explanation:
{"name":null,"email":null,"phone":null,"location":null,"summary":null,"experience_years":0,"skills":[],"education":null,"languages":["German"],"certifications":[]}`

// ─── File parsers ──────────────────────────────────────────────────────────────

async function parsePDF(file: File): Promise<any> {
  const buffer = Buffer.from(await file.arrayBuffer())

  // Try text extraction first
  let pdfText = ''
  try {
    const pdfParseLib = require('pdf-parse/lib/pdf-parse.js')
    const fn = typeof pdfParseLib === 'function' ? pdfParseLib : pdfParseLib.default
    const parsed = await fn(buffer)
    pdfText = (parsed.text || '').trim()
    console.log(`📄 pdf-parse: ${pdfText.length} chars`)
  } catch (err: any) {
    console.warn('⚠️ pdf-parse failed:', err.message)
  }

  if (pdfText.length > 100) {
    const text = await callGemini([{
      role: 'user',
      parts: [{ text: `${CV_PROMPT}\n\nCV TEXT:\n${pdfText.substring(0, 4000)}` }],
    }])
    return extractJSON(text)
  }

  // Scanned/image PDF → multimodal
  console.log('📷 Scanned PDF — sending binary to Gemini')
  const base64 = buffer.toString('base64')
  const text = await callGemini([{
    role: 'user',
    parts: [
      { inlineData: { data: base64, mimeType: 'application/pdf' } },
      { text: CV_PROMPT },
    ],
  }])
  return extractJSON(text)
}

async function parseDOCX(file: File): Promise<any> {
  const mammoth = await import('mammoth')
  const buffer = Buffer.from(await file.arrayBuffer())
  const { value: rawText } = await mammoth.extractRawText({ buffer })
  if (!rawText?.trim() || rawText.trim().length < 50) throw new Error('No text in DOCX')
  const text = await callGemini([{
    role: 'user',
    parts: [{ text: `${CV_PROMPT}\n\nCV TEXT:\n${rawText.substring(0, 4000)}` }],
  }])
  return extractJSON(text)
}

async function parseTXT(file: File): Promise<any> {
  const rawText = await file.text()
  if (!rawText?.trim() || rawText.trim().length < 50) throw new Error('TXT file is empty')
  const text = await callGemini([{
    role: 'user',
    parts: [{ text: `${CV_PROMPT}\n\nCV TEXT:\n${rawText.substring(0, 4000)}` }],
  }])
  return extractJSON(text)
}

// ─── Name validation ──────────────────────────────────────────────────────────

const REJECT_NAME = [
  /^lebenslauf/i, /^curriculum vitae/i, /^resume/i, /^bewerbung/i,
  /^vorlage/i, /^template/i, /^name$/i, /^\s*$/, /^\d+$/,
]

function isValidName(name: string | null | undefined): boolean {
  if (!name || name.trim().length < 2) return false
  const n = name.trim()
  if (n.length > 50) return false
  return !REJECT_NAME.some(p => p.test(n))
}

// ─── Deterministic fallback email (filename+size → no duplicates on re-upload) ─

function fallbackEmail(file: File): string {
  const slug = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase()
    .slice(0, 40)
  return `cv_import_${slug}_${file.size}@recruily-import.com`
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
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ success: false, error: 'File too large (max 10 MB)' }, { status: 400 })

    console.log(`📎 ${file.name} (${file.type}, ${Math.round(file.size / 1024)} KB)`)

    // ── Parse CV with Gemini ──────────────────────────────────────────────────
    let parsed: any = {}
    let geminiError: string | null = null

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
      console.log(`✅ Gemini parsed: name="${parsed.name}" email="${parsed.email}" skills=${JSON.stringify(parsed.skills?.slice(0, 3))}`)
    } catch (err: any) {
      geminiError = err.message
      console.error('❌ Gemini CV parsing failed:', geminiError)
    }

    if (parsed.name && !isValidName(parsed.name)) {
      console.warn(`⚠️ Discarding invalid name: "${parsed.name}"`)
      parsed.name = null
    }

    // ── Build candidate record ────────────────────────────────────────────────
    const nameFallback = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[_\-().]+/g, ' ')
      .trim()

    const emailFromGemini = parsed.email &&
      parsed.email.includes('@') &&
      !parsed.email.match(/@email\.com$/) &&
      !parsed.email.match(/^(email|name|vorname|example)@/)
      ? parsed.email
      : null

    const candidateRecord = {
      id: uuidv4(),
      organisation_id: org.id,
      created_by: user.id,
      name: (isValidName(parsed.name) ? parsed.name : nameFallback).trim() || 'Unknown',
      email: emailFromGemini ?? fallbackEmail(file),
      phone: parsed.phone || null,
      location: parsed.location || null,
      summary: parsed.summary || null,
      experience_years: Number.isInteger(parsed.experience_years) && parsed.experience_years >= 0
        ? parsed.experience_years : 0,
      skills: Array.isArray(parsed.skills)
        ? parsed.skills.filter((s: any) => typeof s === 'string' && s.trim().length > 0)
        : [],
      education: typeof parsed.education === 'string' ? parsed.education : null,
      languages: Array.isArray(parsed.languages) && parsed.languages.length > 0
        ? parsed.languages : ['German'],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      status: 'active',
    }

    console.log(`💾 Saving: name="${candidateRecord.name}" email="${candidateRecord.email}"`)

    const { data: saved, error: dbError } = await admin
      .from('candidates')
      .upsert([candidateRecord], { onConflict: 'email', ignoreDuplicates: false })
      .select()
      .single()

    if (dbError) {
      console.error('❌ DB error:', dbError.message, dbError.code)
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })
    }

    console.log(`✅ Saved: ${saved.id} — ${saved.name}`)

    return NextResponse.json({
      success: true,
      candidate: saved,
      gemini_failed: !!geminiError,
      gemini_error: geminiError,
      message: geminiError
        ? `CV saved (AI parsing failed: ${geminiError})`
        : `CV parsed: ${saved.name}`,
    })

  } catch (error: any) {
    console.error('❌ /api/candidates/upload error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

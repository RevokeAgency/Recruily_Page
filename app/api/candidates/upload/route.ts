import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// ─── Gemini REST API (direct fetch, no SDK, no model discovery) ───────────────

const GEMINI_BASE = 'https://generativelanguage.googleapis.com'
const GEMINI_API_VERSION = 'v1beta'
const GEMINI_MODELS = ['gemini-3.0-flash', 'gemini-2.5-flash']
// Netlify hard limit is 10s. Auth+Org+DB ≈ 1s → 8s for Gemini.
const TIMEOUT_MS = 8000

function getApiKey(): string {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY not set in Netlify environment variables')
  return key
}

// ─── Call Gemini REST API — tries primary model, falls back on 404/error ──────

async function callGemini(contents: any[]): Promise<string> {
  const key = getApiKey()
  let lastError: Error | null = null

  for (const modelId of GEMINI_MODELS) {
    const url = `${GEMINI_BASE}/${GEMINI_API_VERSION}/models/${modelId}:generateContent?key=${key}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: { maxOutputTokens: 4096, temperature: 0.1, responseMimeType: 'application/json' },
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const errBody = await res.text().catch(() => '')
        const err = new Error(`Gemini ${res.status} on ${modelId}: ${errBody.slice(0, 200)}`)
        console.warn(`⚠️ ${err.message}`)
        lastError = err
        continue   // try next model
      }

      const data = await res.json() as any
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) {
        lastError = new Error(`Gemini returned no text (model: ${modelId})`)
        continue
      }

      console.log(`✅ Gemini ${modelId}: ${text.length} chars`)
      return text

    } catch (err: any) {
      console.warn(`⚠️ Gemini ${modelId} error: ${err.message}`)
      lastError = err
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError ?? new Error('All Gemini models failed')
}

// ─── JSON extraction & repair ─────────────────────────────────────────────────

/** Strip markdown fences and non-printable control chars (keep \t \n \r) */
function stripMarkdown(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
}

/**
 * Escape literal \n / \r / \t that appear INSIDE JSON string values.
 * These are valid whitespace outside strings but invalid inside — the most
 * common reason Stefan's CV fails while Denise's works fine.
 */
function fixInlineNewlines(s: string): string {
  let out = ''
  let inStr = false
  let esc = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (esc) { out += c; esc = false; continue }
    if (c === '\\' && inStr) { out += c; esc = true; continue }
    if (c === '"') { inStr = !inStr; out += c; continue }
    if (inStr) {
      if (c === '\n') { out += '\\n'; continue }
      if (c === '\r') { out += '\\r'; continue }
      if (c === '\t') { out += '\\t'; continue }
    }
    out += c
  }
  return out
}

function extractJSON(raw: string): any {
  const s = stripMarkdown(raw)

  // Layer 1 — direct parse after markdown strip
  try { return JSON.parse(s) } catch {}

  // Layer 2 — extract only the {...} block (ignore preamble/postamble)
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start !== -1 && end > start) {
    const block = s.slice(start, end + 1)

    // Layer 2a — raw block
    try { return JSON.parse(block) } catch {}

    // Layer 2b — fix literal newlines inside string values
    try { return JSON.parse(fixInlineNewlines(block)) } catch {}

    // Layer 2c — remove trailing commas + fix newlines
    const repaired = fixInlineNewlines(block.replace(/,\s*([\}\]])/g, '$1'))
    try { return JSON.parse(repaired) } catch {}
  }

  // All attempts failed — log FULL raw string so we can see exactly what broke
  console.error(`❌ GEMINI RAW OUTPUT (${raw.length} chars):\n${raw}`)
  throw new Error(`Cannot parse Gemini JSON (${raw.length} chars). First 300: ${s.slice(0, 300)}`)
}

// ─── CV prompt ────────────────────────────────────────────────────────────────

const CV_PROMPT = `Extract only the hard facts from this CV. Return ONLY valid JSON, no markdown, no explanation. Always end the JSON with '}'.

IMPORTANT: Use only simple plain text inside values. No newlines, no backslashes, no unescaped quotes within string values. If a value contains a newline, replace it with a space. If you cannot fill a field, use null.

Fields: name (full name only, null if heading/title/role), email (real address only, null if placeholder), phone (digits only), location (city/country, single line), experience_years (integer ≥ 0), skills (max 6 short strings), education (one line), languages (array), certifications (array). Set summary to null always.

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

    // ── Hard stop: no DB write without parsed data ────────────────────────────
    if (geminiError) {
      return NextResponse.json(
        { success: false, error: `CV parsing failed: ${geminiError}` },
        { status: 422 }
      )
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

    const email = emailFromGemini ?? fallbackEmail(file)
    const dataFields = {
      name: (isValidName(parsed.name) ? parsed.name : nameFallback).trim() || 'Unknown',
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

    console.log(`💾 Saving: name="${dataFields.name}" email="${email}"`)

    // ── Check if candidate already exists by email ────────────────────────────
    // NEVER change the id of an existing candidate — that breaks matches FK
    const { data: existing } = await admin
      .from('candidates')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    let saved: any = null
    let dbError: any = null

    if (existing?.id) {
      console.log(`🔄 Updating existing candidate ${existing.id}`)
      const { data, error } = await admin
        .from('candidates')
        .update(dataFields)
        .eq('id', existing.id)
        .select()
        .single()
      saved = data
      dbError = error
    } else {
      console.log('➕ Inserting new candidate')
      const { data, error } = await admin
        .from('candidates')
        .insert([{ id: uuidv4(), organisation_id: org.id, created_by: user.id, email, ...dataFields }])
        .select()
        .single()
      saved = data
      dbError = error
    }

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

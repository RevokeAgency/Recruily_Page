import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// ─── Gemini REST API (direct fetch, no SDK, no model discovery) ───────────────

const GEMINI_BASE = 'https://generativelanguage.googleapis.com'
const GEMINI_API_VERSION = 'v1beta'
const GEMINI_MODELS = ['gemini-3.0-flash', 'gemini-2.5-flash']
// maxDuration = 26s. Non-Gemini overhead ≈ 2s → 11s per model (2 attempts = 22s budget).
const TIMEOUT_MS = 11000

function getApiKey(): string {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY not set in Netlify environment variables')
  return key
}

// ─── Call Gemini REST API — tries primary model, falls back on 404/error ──────

async function callGemini(contents: any[]): Promise<string> {
  const key = getApiKey()
  let lastError: Error | null = null
  console.time('gemini-call')

  try {
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
          generationConfig: { maxOutputTokens: 2048, temperature: 0.1, responseMimeType: 'application/json' },
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
      // Log suspiciously short responses immediately — helps diagnose Stefan-style failures
      if (text.length < 150) {
        console.warn(`⚠️ Very short Gemini response (${text.length} chars) — full text:\n${text}`)
      }
      return text

    } catch (err: any) {
      console.warn(`⚠️ Gemini ${modelId} error: ${err.message}`)
      lastError = err
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError ?? new Error('All Gemini models failed')
  } finally {
    console.timeEnd('gemini-call')
  }
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

const CV_PROMPT = `Extract hard facts from this CV. Return ONLY valid JSON — no markdown, no explanation. Always close the object with '}'.

RULES (follow exactly):
- name: Full personal name only (e.g. "Stefan Müller"). Null if it is a heading like "Lebenslauf", job title, or company name.
- email: Search the ENTIRE text for any pattern containing '@'. Email format: user@domain.tld. Extract it exactly as written. If multiple, use the first. If none found, null. Never invent one.
- phone: Digits, spaces, +, () only. Single line. Null if not found.
- location: City and/or country. Single line, no newlines. Null if not found.
- experience_years: Total years of professional experience as integer ≥ 0. Default 0.
- skills: Up to 6 short skill names. Empty array if none.
- education: Highest degree + institution, single line. Null if not found.
- languages: Array of languages. Default ["German"] if CV is in German.
- certifications: Array of certification names. Empty array if none.
- summary: Always null.
- IMPORTANT: No newlines, no backslashes, no unescaped quotes inside any string value.

{"name":null,"email":null,"phone":null,"location":null,"summary":null,"experience_years":0,"skills":[],"education":null,"languages":["German"],"certifications":[]}`

// ─── Text pre-cleaning ────────────────────────────────────────────────────────

/**
 * Remove known watermarks, template placeholders, and noise from extracted
 * CV text before it is sent to Gemini. Keeps the character budget low and
 * prevents watermark strings from confusing the model.
 */
function cleanCVText(text: string): string {
  return text
    .replace(/LEBENSLAUF\.DE/gi, '')
    .replace(/www\.lebenslauf\.de/gi, '')
    .replace(/Powered by LEBENSLAUF/gi, '')
    .replace(/\[Vor- und Nachname\]/g, '')
    .replace(/\[Datum\]/g, '')
    .replace(/\[Ort\]/g, '')
    .replace(/\[Straße und Hausnummer\]/g, '')
    .replace(/\[PLZ\]/g, '')
    .replace(/\[Stadt\]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ─── File parsers ──────────────────────────────────────────────────────────────

async function parsePDF(file: File): Promise<any> {
  const buffer = Buffer.from(await file.arrayBuffer())

  // Try text extraction first
  let pdfText = ''
  try {
    const pdfParseLib = require('pdf-parse/lib/pdf-parse.js')
    const fn = typeof pdfParseLib === 'function' ? pdfParseLib : pdfParseLib.default
    const parsed = await fn(buffer)
    pdfText = cleanCVText((parsed.text || '').trim())
    console.log(`📄 pdf-parse: ${pdfText.length} chars (after cleaning)`)
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
  const cleaned = cleanCVText(rawText || '')
  if (!cleaned || cleaned.length < 50) throw new Error('No text in DOCX')
  const text = await callGemini([{
    role: 'user',
    parts: [{ text: `${CV_PROMPT}\n\nCV TEXT:\n${cleaned.substring(0, 4000)}` }],
  }])
  return extractJSON(text)
}

async function parseTXT(file: File): Promise<any> {
  const rawText = await file.text()
  const cleaned = cleanCVText(rawText || '')
  if (!cleaned || cleaned.length < 50) throw new Error('TXT file is empty')
  const text = await callGemini([{
    role: 'user',
    parts: [{ text: `${CV_PROMPT}\n\nCV TEXT:\n${cleaned.substring(0, 4000)}` }],
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

/**
 * Rescue an email from a field value that may contain extra chars, spaces, or
 * surrounding text (e.g. "E-Mail: s.mueller@company.de," → "s.mueller@company.de").
 * Returns null for placeholders or if no @ pattern is found.
 */
function extractEmailFromString(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null
  const match = raw.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)
  if (!match) return null
  const email = match[0].toLowerCase()
  // Reject obvious placeholders
  if (/@email\.com$/.test(email) || /^(email|name|vorname|example|user|test)@/.test(email)) return null
  return email
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

    // ── Mandatory field validation — no DB write without real name + email ──────
    const validatedName = isValidName(parsed.name) ? parsed.name.trim() : null
    // extractEmailFromString handles garbled values: "E-Mail: s@co.de," → "s@co.de"
    const validatedEmail = extractEmailFromString(parsed.email)

    if (!validatedName || !validatedEmail) {
      const missing = [!validatedName && 'Name', !validatedEmail && 'E-Mail'].filter(Boolean).join(' & ')
      // Log the full parsed object so we can see exactly what Gemini returned
      console.warn(`⚠️ 422 — Mandatory fields missing [${missing}]`)
      console.warn(`⚠️ Gemini parsed object: ${JSON.stringify(parsed, null, 2)}`)
      return NextResponse.json(
        { success: false, error: `CV konnte nicht gelesen werden (${missing} fehlt) — bitte erneut versuchen.` },
        { status: 422 }
      )
    }

    // ── Build candidate record ────────────────────────────────────────────────
    const email = validatedEmail
    const dataFields = {
      name: validatedName,
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
      message: `CV parsed: ${saved.name}`,
    })

  } catch (error: any) {
    console.error('❌ /api/candidates/upload error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 26 // seconds — Netlify Pro limit; gives Gemini 22s budget

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ─── Gemini setup ──────────────────────────────────────────────────────────────

function getGeminiClient() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in environment variables')
  return new GoogleGenerativeAI(apiKey)
}

// Try models in order — first one that works wins
const MODEL_PRIORITY = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash']

// Netlify hard limit is 10s → leave 3s for auth+org+db → 7s for Gemini
const TIMEOUT_MS = 7000

function withTimeout<T>(promise: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini timeout after ${ms}ms`)), ms)
    ),
  ])
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
  throw new Error(`Cannot parse Gemini JSON: ${clean.slice(0, 150)}`)
}

// ─── CV prompt ────────────────────────────────────────────────────────────────

const CV_PROMPT = `You are a CV/Resume parser. Extract real personal information.

STRICT RULES:
- "name": real full name only (e.g. "Maria Müller"). NOT "Lebenslauf", "Resume", "CV", job titles, or headings.
- "email": only real email addresses. NOT placeholder emails like "name@email.com".
- Return null for any field you cannot find with certainty.
- CV may be in German, English, or other languages.
- Do NOT invent data.

Return ONLY valid JSON, no markdown fences, no explanation:
{"name":null,"email":null,"phone":null,"location":null,"summary":null,"experience_years":0,"skills":[],"education":null,"languages":["German"],"certifications":[]}`

// ─── Try Gemini with fallback models ──────────────────────────────────────────

async function callGeminiText(prompt: string): Promise<string> {
  const client = getGeminiClient()
  let lastError: Error | null = null

  for (const modelName of MODEL_PRIORITY) {
    try {
      console.log(`🤖 Trying model: ${modelName}`)
      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: { maxOutputTokens: 512, temperature: 0.1 },
      })
      const result = await withTimeout(model.generateContent(prompt))
      const text = (result as any).response.text()
      console.log(`✅ ${modelName} responded (${text.length} chars)`)
      return text
    } catch (err: any) {
      console.warn(`⚠️ ${modelName} failed: ${err.message}`)
      lastError = err
    }
  }
  throw lastError ?? new Error('All Gemini models failed')
}

async function callGeminiMultimodal(parts: any[]): Promise<string> {
  const client = getGeminiClient()
  let lastError: Error | null = null

  for (const modelName of MODEL_PRIORITY) {
    try {
      console.log(`🤖 Trying multimodal model: ${modelName}`)
      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: { maxOutputTokens: 512, temperature: 0.1 },
      })
      const result = await withTimeout(model.generateContent(parts))
      const text = (result as any).response.text()
      console.log(`✅ ${modelName} multimodal responded (${text.length} chars)`)
      return text
    } catch (err: any) {
      console.warn(`⚠️ ${modelName} multimodal failed: ${err.message}`)
      lastError = err
    }
  }
  throw lastError ?? new Error('All Gemini models failed (multimodal)')
}

// ─── PDF parsing ──────────────────────────────────────────────────────────────

async function parsePDF(file: File): Promise<any> {
  const buffer = Buffer.from(await file.arrayBuffer())

  // Try text extraction first (faster, more reliable than multimodal)
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
    const prompt = `${CV_PROMPT}\n\nCV TEXT:\n${pdfText.substring(0, 4000)}`
    return extractJSON(await callGeminiText(prompt))
  }

  // Scanned/image PDF → multimodal
  console.log('📷 Scanned PDF — using multimodal')
  const base64 = buffer.toString('base64')
  const text = await callGeminiMultimodal([
    { inlineData: { data: base64, mimeType: 'application/pdf' } },
    { text: CV_PROMPT },
  ])
  return extractJSON(text)
}

// ─── DOCX parsing ─────────────────────────────────────────────────────────────

async function parseDOCX(file: File): Promise<any> {
  const mammoth = await import('mammoth')
  const buffer = Buffer.from(await file.arrayBuffer())
  const { value: text } = await mammoth.extractRawText({ buffer })
  if (!text?.trim() || text.trim().length < 50) throw new Error('No text in DOCX')
  const prompt = `${CV_PROMPT}\n\nCV TEXT:\n${text.substring(0, 4000)}`
  return extractJSON(await callGeminiText(prompt))
}

// ─── TXT parsing ──────────────────────────────────────────────────────────────

async function parseTXT(file: File): Promise<any> {
  const text = await file.text()
  if (!text?.trim() || text.trim().length < 50) throw new Error('TXT file is empty')
  const prompt = `${CV_PROMPT}\n\nCV TEXT:\n${text.substring(0, 4000)}`
  return extractJSON(await callGeminiText(prompt))
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
  if (REJECT_NAME.some(p => p.test(n))) return false
  return true
}

// ─── Deterministic fallback email ─────────────────────────────────────────────
// Uses filename + size so the same CV re-upload upserts the same record
// instead of creating a new duplicate each time.

function fallbackEmail(file: File): string {
  const slug = file.name
    .replace(/\.[^/.]+$/, '')           // remove extension
    .replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')
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

    // Reject template headings extracted as names
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

    // ── Upsert on email (same CV re-upload → update existing record) ──────────
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
        ? `CV saved with partial data (AI parsing failed: ${geminiError})`
        : `CV parsed: ${saved.name}`,
    })

  } catch (error: any) {
    console.error('❌ /api/candidates/upload error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

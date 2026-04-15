import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ─── Gemini CV Parsing ─────────────────────────────────────────────────────────

async function parseCVWithGemini(text: string): Promise<any> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { maxOutputTokens: 1024, temperature: 0.1 },
  })

  const prompt = `Extract candidate information from this CV text. Return ONLY valid JSON, no markdown, no extra text.

CV TEXT:
${text.substring(0, 4000)}

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

  const timeoutMs = 8000
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Gemini timeout')), timeoutMs)
  )

  const result = await Promise.race([
    model.generateContent(prompt),
    timeoutPromise,
  ])

  const responseText = (result as any).response.text().trim()

  // Strip markdown code fences if present
  const jsonText = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(jsonText)
}

// ─── Text Extraction ───────────────────────────────────────────────────────────

async function extractTextFromFile(file: File): Promise<string> {
  const type = file.type

  if (type === 'application/pdf') {
    const pdfParse = await import('pdf-parse').then(m => m.default)
    const buffer = Buffer.from(await file.arrayBuffer())
    const data = await pdfParse(buffer)
    return data.text
  }

  if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    type === 'application/msword'
  ) {
    const mammoth = await import('mammoth')
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  if (type === 'text/plain') {
    return file.text()
  }

  throw new Error(`Unsupported file type: ${type}. Use PDF, DOCX, or TXT.`)
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

    // ── Extract text ──────────────────────────────────────────────────────────
    let cvText: string
    try {
      cvText = await extractTextFromFile(file)
    } catch (extractErr: any) {
      console.error('❌ Text extraction failed:', extractErr.message)
      return NextResponse.json({ success: false, error: extractErr.message }, { status: 400 })
    }

    if (!cvText || cvText.trim().length < 30) {
      return NextResponse.json({ success: false, error: 'Could not extract text from file — ensure it is not scanned/image-only' }, { status: 400 })
    }

    console.log(`✅ Extracted ${cvText.length} chars from CV`)

    // ── Parse with Gemini ─────────────────────────────────────────────────────
    let parsed: any = {}
    try {
      parsed = await parseCVWithGemini(cvText)
      console.log(`✅ Gemini parsed: ${parsed.name}`)
    } catch (geminiErr: any) {
      console.warn('⚠️ Gemini parsing failed, using text fallback:', geminiErr.message)
      // Minimal fallback: derive name from filename, no AI data
      parsed = {
        name: file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
        email: null,
        skills: [],
        languages: ['English'],
      }
    }

    // ── Build candidate record ────────────────────────────────────────────────
    const candidateId = uuidv4()
    const emailFallback = `cv_import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@recruily-import.com`

    const candidateRecord = {
      id: candidateId,
      organisation_id: org.id,
      created_by: user.id,
      name: (parsed.name || file.name.replace(/\.[^/.]+$/, '')).trim(),
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

    // ── Upsert to DB ──────────────────────────────────────────────────────────
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

import { type NextRequest, NextResponse } from 'next/server'
import { parseDocumentServerSide } from '@/lib/server-pdf-parser'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const IMPORT_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash']

async function fetchJobUrl(url: string): Promise<{ text: string; siteType: string; blocked: boolean }> {
  const hostname = new URL(url).hostname.toLowerCase()
  let siteType = 'generic'
  if (hostname.includes('linkedin')) siteType = 'linkedin'
  else if (hostname.includes('karriere.at')) siteType = 'karriere'
  else if (hostname.includes('indeed')) siteType = 'indeed'
  else if (hostname.includes('glassdoor')) siteType = 'glassdoor'
  else if (hostname.includes('stepstone')) siteType = 'stepstone'
  else if (hostname.includes('xing')) siteType = 'xing'

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'de-AT,de;q=0.9,en;q=0.8',
        'Referer': 'https://www.google.com/',
        'Cache-Control': 'no-cache',
        'DNT': '1',
      },
      signal: controller.signal,
    })

    if (!res.ok) {
      if ([401, 403, 429].includes(res.status)) return { text: '', siteType, blocked: true }
      throw new Error(`HTTP ${res.status}`)
    }

    const html = await res.text()

    // Prepend JSON-LD structured data if available (gives Gemini richer context)
    const jsonLd = extractJsonLd(html)

    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
      .replace(/\s{2,}/g, ' ')
      .trim()

    const combined = jsonLd ? `${jsonLd}\n\n${text}` : text
    return { text: combined.slice(0, 8000), siteType, blocked: false }
  } catch {
    return { text: '', siteType, blocked: true }
  } finally {
    clearTimeout(timer)
  }
}

function extractJsonLd(html: string): string | null {
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1])
      if (data['@type'] === 'JobPosting') {
        const loc = typeof data.jobLocation === 'string'
          ? data.jobLocation
          : data.jobLocation?.address?.addressLocality || ''
        const desc = (data.description || '').replace(/<[^>]+>/g, ' ').slice(0, 2000)
        return `Title: ${data.title || ''}\nCompany: ${data.hiringOrganization?.name || ''}\nLocation: ${loc}\nDescription: ${desc}`
      }
    } catch { /* invalid JSON, continue */ }
  }
  return null
}

async function distillWithGemini(rawText: string): Promise<Record<string, any>> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('No Gemini API key configured')

  const prompt = `You are a job posting parser. Extract all relevant data from this job ad and return ONLY valid JSON (no markdown, no code fences).

For "description_html": format the full job description as attractive HTML using <h3> for section headings, <ul><li> for bullet lists, and <p> for paragraphs. Common sections: Aufgaben/Responsibilities, Anforderungen/Requirements, Vorteile/Benefits. Keep the original language. Make it look great in a dashboard UI.

Return ONLY this JSON shape (null for missing fields, empty array for missing lists):
{
  "title": "string",
  "company": "string",
  "location": "string",
  "employment_type": "full-time|part-time|contract|freelance|internship",
  "salary_range": "string",
  "hard_skills": ["string"],
  "soft_skills": ["string"],
  "benefits": ["string"],
  "requirements": ["string"],
  "experience_level": "junior|mid|senior|lead|executive",
  "description": "string (2-3 sentence plain text summary)",
  "description_html": "string (formatted HTML with h3/ul/li/p tags)"
}

JOB AD TEXT:
${rawText.slice(0, 6000)}`

  for (const model of IMPORT_MODELS) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 22000)
    try {
      const res = await fetch(`${GEMINI_BASE}/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.1, responseMimeType: 'application/json' },
        }),
        signal: controller.signal,
      })
      if (!res.ok) { console.warn(`⚠️ Gemini import ${res.status} on ${model}`); continue }
      const data = await res.json() as any
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) { console.warn(`⚠️ No text from ${model}`); continue }
      const clean = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
      const parsed = JSON.parse(clean)
      console.log(`✅ Distilled with ${model}: "${parsed.title}"`)
      return parsed
    } catch (err: any) {
      console.warn(`⚠️ Import error on ${model}:`, err.message)
    } finally {
      clearTimeout(timer)
    }
  }
  throw new Error('Gemini distillation failed on all models')
}

export async function POST(request: NextRequest) {
  console.log('=== 📥 /api/jobs/import ===')
  try {
    const contentType = request.headers.get('content-type') || ''
    let rawText = ''
    let inputType = 'text'
    let siteType = 'unknown'

    if (contentType.includes('multipart/form-data')) {
      inputType = 'file'
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })

      const parsed = await parseDocumentServerSide(file)
      if (!parsed.success || !parsed.text) {
        return NextResponse.json({ success: false, error: parsed.error || 'Failed to parse file' }, { status: 422 })
      }
      rawText = parsed.text
      console.log(`📄 File parsed: ${file.name}, ${rawText.length} chars`)

    } else {
      const body = await request.json()

      if (body.url) {
        inputType = 'url'
        const result = await fetchJobUrl(body.url)
        siteType = result.siteType

        if (result.blocked || !result.text) {
          return NextResponse.json({
            success: false,
            blocked: true,
            siteType,
            error: 'Link konnte nicht automatisch gelesen werden. Bitte kopiere den Text der Anzeige manuell hier hinein.',
          }, { status: 422 })
        }
        rawText = result.text
        console.log(`🌐 URL fetched: ${rawText.length} chars, type: ${siteType}`)

      } else if (body.text) {
        inputType = 'text'
        rawText = body.text

      } else {
        return NextResponse.json({ success: false, error: 'Provide url, file, or text' }, { status: 400 })
      }
    }

    if (rawText.trim().length < 20) {
      return NextResponse.json({ success: false, error: 'Insufficient content to parse' }, { status: 422 })
    }

    const parsed = await distillWithGemini(rawText)
    return NextResponse.json({ success: true, inputType, siteType, method: 'gemini', ...parsed })

  } catch (err: any) {
    console.error('❌ /api/jobs/import error:', err)
    return NextResponse.json({ success: false, error: err.message || 'Import failed' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 26

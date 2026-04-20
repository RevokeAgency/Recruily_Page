import { type NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { parseDocumentServerSide } from '@/lib/server-pdf-parser'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')

const PROMPT = `Du bist ein Expert Recruiting Scraper. Analysiere den folgenden Text einer Stellenanzeige.
Extrahiere die Daten und antworte AUSSCHLIESSLICH im folgenden JSON-Format ohne Markdown-Codeblöcke:
{
  "title": "String",
  "company": "String",
  "location": "String",
  "employment_type": "full-time | part-time | contract | freelance | internship",
  "salary_range": "String",
  "hard_skills": ["Array of Strings"],
  "soft_skills": ["Array of Strings"],
  "experience_level": "junior | mid | senior | lead | executive",
  "benefits": ["Array of Strings"],
  "requirements": ["Array of Strings"],
  "description": "2-3 Sätze Zusammenfassung als Plaintext",
  "description_html": "HTML String: Nutze <h3> für Sektionen, <ul> und <li> für Listen. Keine Markdowns wie ** oder #!"
}

Job-Inhalt:
`

async function distill(rawText: string): Promise<Record<string, any>> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const result = await model.generateContent(PROMPT + rawText.slice(0, 6000))
  const text = result.response.text().trim()

  // Strip optional markdown code fences
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  // Extract first JSON object
  const match = clean.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Gemini returned no valid JSON')
  return JSON.parse(match[0])
}

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
        'DNT': '1',
      },
      signal: controller.signal,
    })

    if (!res.ok) {
      if ([401, 403, 429].includes(res.status)) return { text: '', siteType, blocked: true }
      throw new Error(`HTTP ${res.status}`)
    }

    const html = await res.text()

    // Try JSON-LD first for cleaner structured content
    const jsonLd = extractJsonLd(html)

    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
      .replace(/\s{2,}/g, ' ')
      .trim()

    const combined = jsonLd ? `${jsonLd}\n\n${stripped}` : stripped
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
    } catch { /* invalid JSON */ }
  }
  return null
}

export async function POST(request: NextRequest) {
  console.log('=== 📥 /api/jobs/import ===')
  try {
    const contentType = request.headers.get('content-type') || ''
    let rawText = ''
    let inputType = 'text'
    let siteType = 'unknown'

    if (contentType.includes('multipart/form-data')) {
      // ── File upload ────────────────────────────────────────────────────────
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
        // ── URL fetch ──────────────────────────────────────────────────────
        inputType = 'url'
        const fetched = await fetchJobUrl(body.url)
        siteType = fetched.siteType

        if (fetched.blocked || !fetched.text) {
          return NextResponse.json({
            success: false,
            blocked: true,
            siteType,
            error: 'Link konnte nicht automatisch gelesen werden. Bitte kopiere den Text der Anzeige manuell hier hinein.',
          }, { status: 422 })
        }
        rawText = fetched.text
        console.log(`🌐 URL fetched: ${rawText.length} chars (${siteType})`)

      } else if (body.text) {
        // ── Raw text ───────────────────────────────────────────────────────
        inputType = 'text'
        rawText = body.text

      } else {
        return NextResponse.json({ success: false, error: 'Provide url, file, or text' }, { status: 400 })
      }
    }

    if (rawText.trim().length < 20) {
      return NextResponse.json({ success: false, error: 'Insufficient content to parse' }, { status: 422 })
    }

    console.log('🤖 Running Gemini distillation...')
    const data = await distill(rawText)
    console.log(`✅ Distilled: "${data.title}"`)

    return NextResponse.json({ success: true, inputType, siteType, method: 'gemini', ...data })

  } catch (err: any) {
    console.error('❌ /api/jobs/import error:', err)
    return NextResponse.json({ success: false, error: err.message || 'Import failed' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 26

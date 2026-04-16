import { NextResponse } from 'next/server'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com'

export async function GET() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY

  const result: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      GOOGLE_GENERATIVE_AI_API_KEY: apiKey
        ? `SET (${apiKey.length} chars, starts: ${apiKey.substring(0, 6)}...)`
        : 'NOT SET',
    },
  }

  if (!apiKey) {
    return NextResponse.json({
      ...result,
      success: false,
      error: 'No Gemini API key in environment variables',
      fix: 'Add GOOGLE_GENERATIVE_AI_API_KEY to Netlify → Site configuration → Environment variables',
    }, { status: 500 })
  }

  // ── List available models ───────────────────────────────────────────────────
  let availableModels: string[] = []
  let listError: string | null = null
  let usedApiVersion = 'v1beta'

  for (const apiVersion of ['v1beta', 'v1']) {
    try {
      const res = await fetch(
        `${GEMINI_BASE}/${apiVersion}/models?key=${apiKey}&pageSize=50`,
        { signal: AbortSignal.timeout(4000) }
      )
      const data = await res.json() as any
      if (!res.ok) {
        listError = `${res.status} ${res.statusText}: ${JSON.stringify(data).slice(0, 200)}`
        continue
      }
      availableModels = (data.models ?? [])
        .filter((m: any) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
        .map((m: any) => m.name.replace('models/', ''))
      usedApiVersion = apiVersion
      break
    } catch (err: any) {
      listError = err.message
    }
  }

  result.available_models = availableModels
  result.list_error = listError
  result.api_version = usedApiVersion

  if (availableModels.length === 0) {
    return NextResponse.json({
      ...result,
      success: false,
      error: listError ?? 'No generateContent models found for this API key',
    }, { status: 500 })
  }

  // ── Test the best available model ──────────────────────────────────────────
  const PREFER = [
    'gemini-2.5-flash', 'gemini-2.5-flash-preview-05-20',
    'gemini-2.5-flash-preview-04-17',
    'gemini-2.0-flash', 'gemini-2.0-flash-001', 'gemini-2.0-flash-exp',
    'gemini-2.0-flash-lite', 'gemini-1.5-flash-002', 'gemini-1.5-flash',
    'gemini-1.5-flash-latest', 'gemini-1.5-pro-002', 'gemini-1.5-pro',
  ]
  const testModel =
    PREFER.find(p => availableModels.includes(p)) ?? availableModels[0]

  result.selected_model = testModel

  try {
    const start = Date.now()
    const res = await fetch(
      `${GEMINI_BASE}/${usedApiVersion}/models/${testModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Say exactly: OK' }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
        signal: AbortSignal.timeout(8000),
      }
    )
    const elapsed = Date.now() - start
    const data = await res.json() as any

    if (!res.ok) {
      return NextResponse.json({
        ...result,
        success: false,
        error: `Generate call failed: ${res.status} ${res.statusText}`,
        response_body: data,
      }, { status: 500 })
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '(no text)'
    result.test_response = { text: text.trim(), elapsed_ms: elapsed }

    return NextResponse.json({ ...result, success: true })
  } catch (err: any) {
    return NextResponse.json({
      ...result,
      success: false,
      error: `Generate call threw: ${err.message}`,
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

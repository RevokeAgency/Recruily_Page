import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function GET() {
  const result: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY
        ? `SET (length: ${process.env.GOOGLE_GENERATIVE_AI_API_KEY.length}, starts: ${process.env.GOOGLE_GENERATIVE_AI_API_KEY.substring(0, 6)}...)`
        : "NOT SET",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY
        ? `SET (length: ${process.env.GEMINI_API_KEY.length}, starts: ${process.env.GEMINI_API_KEY.substring(0, 6)}...)`
        : "NOT SET",
    },
    gemini_test: null as any,
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY

  if (!apiKey) {
    return NextResponse.json({
      ...result,
      success: false,
      error: "No Gemini API key found in environment variables",
      fix: "Add GOOGLE_GENERATIVE_AI_API_KEY to Netlify environment variables",
    }, { status: 500 })
  }

  // Try gemini-1.5-flash with a minimal prompt
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const start = Date.now()
    const response = await model.generateContent("Say exactly: OK")
    const elapsed = Date.now() - start
    const text = response.response.text()

    result.gemini_test = {
      model: "gemini-1.5-flash",
      success: true,
      response: text.trim(),
      elapsed_ms: elapsed,
      note: elapsed < 5000 ? "Fast enough for Netlify (< 5s)" : "Slow — may time out on Netlify",
    }

    return NextResponse.json({ ...result, success: true })
  } catch (err: any) {
    result.gemini_test = {
      model: "gemini-1.5-flash",
      success: false,
      error: err.message,
      error_type: err.constructor?.name,
      status: err.status,
    }

    return NextResponse.json({
      ...result,
      success: false,
      error: `Gemini API call failed: ${err.message}`,
    }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

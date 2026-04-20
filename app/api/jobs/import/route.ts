import { NextRequest, NextResponse } from 'next/server';
import { GEMINI_MODEL_FAST } from '@/lib/gemini-ai';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { text, url } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "Key fehlt" }, { status: 500 });

    const model = GEMINI_MODEL_FAST;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const truncatedInput = text ? text.substring(0, 5000) : url;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Extrahiere Job-Daten als JSON. Kurz und knapp halten. Text: ${truncatedInput}` }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      }),
      signal: AbortSignal.timeout(25000)
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err.error?.message || "API Busy" }, { status: response.status });
    }

    const result = await response.json();
    const rawText = result.candidates[0].content.parts[0].text;

    return NextResponse.json(JSON.parse(rawText));

  } catch (error: any) {
    console.error('IMPORT ERROR:', error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

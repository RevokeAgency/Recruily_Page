import { NextRequest, NextResponse } from 'next/server';
import { GEMINI_MODEL_FAST } from '@/lib/gemini-ai';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { text, url } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('IMPORT EARLY EXIT: no API key configured');
      return NextResponse.json({ error: 'Kein Gemini API Key konfiguriert' }, { status: 500 });
    }

    const truncatedInput = text ? text.substring(0, 5000) : url;

    if (!truncatedInput) {
      console.error('IMPORT EARLY EXIT: no text or url in request body');
      return NextResponse.json({ error: 'Kein Text und keine URL übergeben' }, { status: 400 });
    }

    const model = GEMINI_MODEL_FAST;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log(`IMPORT: calling Gemini model=${model} inputLength=${truncatedInput.length}`);

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
      const errMsg = err.error?.message || 'Gemini API Busy';
      console.error(`IMPORT EARLY EXIT: Gemini HTTP ${response.status} — ${errMsg}`);
      return NextResponse.json({ error: errMsg }, { status: response.status });
    }

    const result = await response.json();
    const candidate = result.candidates?.[0];

    if (!candidate) {
      console.error('IMPORT EARLY EXIT: Gemini returned no candidates', JSON.stringify(result));
      return NextResponse.json({ error: 'Gemini returned no candidates' }, { status: 502 });
    }

    const rawText = candidate.content.parts[0].text;
    return NextResponse.json(JSON.parse(rawText));

  } catch (error: any) {
    console.error('IMPORT ERROR:', error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

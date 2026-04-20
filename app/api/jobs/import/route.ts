import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 26;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { text, url } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const promptText = `Analysiere den Job-Text und extrahiere Daten.
    Antworte NUR mit validem JSON (kein Markdown, keine Backticks):
    {
      "title": "Job Titel",
      "company": "Firmenname",
      "location": "Standort",
      "employment_type": "full-time",
      "salary_range": "Gehalt",
      "hard_skills": ["Skill1"],
      "soft_skills": ["Skill1"],
      "benefits": ["Benefit1"],
      "description_html": "HTML String mit <h3> und <ul>"
    }
    Text: ${text || url}`;

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    const result = await response.json();
    if (!response.ok) return NextResponse.json({ error: "Gemini API Error" }, { status: response.status });

    let rawText = result.candidates[0].content.parts[0].text;
    // Bereinigung von Markdown-Resten, falls Gemini sie doch mitschickt
    const cleanedJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

    return NextResponse.json(JSON.parse(cleanedJson));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { text, url } = await req.json();

    // 1. Key Check
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Konfigurationsfehler: API Key fehlt." }, { status: 500 });

    // 2. Prompt Definition
    const promptText = `Extrahiere Job-Daten aus folgendem Text/URL.
    Antworte ausschließlich im JSON-Format:
    {
      "title": "String",
      "company": "String",
      "location": "String",
      "employment_type": "full-time | part-time",
      "salary_range": "String",
      "hard_skills": ["Array"],
      "soft_skills": ["Array"],
      "benefits": ["Array"],
      "description_html": "HTML mit <h3> und <ul>"
    }
    Input: ${text || url}`;

    // 3. API Call (v1beta für maximale Modell-Kompatibilität)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || "Gemini API Error");

    // 4. Robustes Parsing
    const rawText = result.candidates[0].content.parts[0].text;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("KI hat kein gültiges JSON geliefert.");

    const jobData = JSON.parse(jsonMatch[0]);
    return NextResponse.json(jobData);

  } catch (error: any) {
    console.error("IMPORT_CRASH:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

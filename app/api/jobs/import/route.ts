import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 26;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { text, url } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "Key fehlt" }, { status: 500 });

    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const promptText = `Analysiere diesen Job-Text und extrahiere die Daten als JSON.
    WICHTIG: Antworte NUR im JSON-Format.
    {
      "title": "Job Titel",
      "company": "Firmenname",
      "location": "Standort",
      "employment_type": "full-time",
      "salary_range": "Gehalt",
      "hard_skills": ["Skill1"],
      "soft_skills": ["Skill1"],
      "benefits": ["Benefit1"],
      "description_html": "Strukturiertes HTML mit <h3> und <ul>"
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
    if (!response.ok) {
      console.error("Gemini Error Details:", JSON.stringify(result));
      return NextResponse.json({ error: result.error?.message || "Gemini API Error" }, { status: response.status });
    }

    const rawText = result.candidates[0].content.parts[0].text;

    // Extrahiere alles zwischen der ersten { und der letzten }
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Kein JSON im Gemini-Text gefunden:", rawText);
      throw new Error("Invalid AI response format");
    }

    const jobData = JSON.parse(jsonMatch[0]);
    return NextResponse.json(jobData);

  } catch (error: any) {
    console.error("IMPORT_ERROR:", error);
    return NextResponse.json({ error: "Parsing fehlgeschlagen: " + error.message }, { status: 500 });
  }
}

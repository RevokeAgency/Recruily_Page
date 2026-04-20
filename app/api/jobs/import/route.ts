import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 26;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function processGeminiResponse(result: any) {
  try {
    const rawText = result.candidates[0].content.parts[0].text;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Kein JSON im Text gefunden");
    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: "Parsing Error: " + e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { text, url } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "API Key fehlt" }, { status: 500 });

    const promptText = `Analysiere diesen Job-Text und extrahiere die Daten als JSON.
    Antworte NUR mit dem JSON-Objekt:
    {
      "title": "Job Titel",
      "company": "Firmenname",
      "location": "Standort",
      "employment_type": "full-time",
      "salary_range": "Gehalt",
      "hard_skills": ["Skill1"],
      "soft_skills": ["Skill1"],
      "benefits": ["Benefit1"],
      "description_html": "HTML String"
    }
    Text: ${text || url}`;

    // Erster Versuch mit v1beta
    const betaUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    let response = await fetch(betaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    });

    let result = await response.json();

    // Fallback auf v1 falls v1beta nicht verfügbar
    if (!response.ok && (response.status === 404 || response.status === 400)) {
      console.log(`v1beta failed (${response.status}), falling back to v1...`);
      const v1Url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      response = await fetch(v1Url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
      });
      result = await response.json();
    }

    if (!response.ok) {
      console.error("Gemini final error:", JSON.stringify(result));
      return NextResponse.json({ error: result.error?.message || "Gemini API Error" }, { status: response.status });
    }

    return processGeminiResponse(result);

  } catch (error: any) {
    console.error("IMPORT_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

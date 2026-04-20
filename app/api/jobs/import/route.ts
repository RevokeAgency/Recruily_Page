import { NextRequest, NextResponse } from 'next/server';

export const config = { maxDuration: 28 };

export async function POST(req: NextRequest) {
  const { text, url } = await req.json();
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) return NextResponse.json({ error: "Key fehlt" }, { status: 500 });

  // Die Liste der Modelle, die wir nacheinander testen
  const modelsToTry = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-pro"
  ];

  const prompt = `Analysiere diesen Job-Text und extrahiere NUR JSON:
  {
    "title": "String",
    "company": "String",
    "location": "String",
    "employment_type": "full-time",
    "salary_range": "String",
    "hard_skills": ["Array"],
    "soft_skills": ["Array"],
    "benefits": ["Array"],
    "description_html": "HTML"
  }
  Text: ${text || url}`;

  for (const modelName of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      if (response.ok) {
        const result = await response.json();
        const rawText = result.candidates[0].content.parts[0].text;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) return NextResponse.json(JSON.parse(jsonMatch[0]));
      }
      console.log(`Modell ${modelName} fehlgeschlagen, versuche nächstes...`);
    } catch (e) {
      continue;
    }
  }

  return NextResponse.json({ error: "Keines der Gemini-Modelle konnte erreicht werden. Bitte prüfe deinen API-Key im AI Studio." }, { status: 500 });
}

import { NextRequest, NextResponse } from 'next/server';

export const config = { maxDuration: 28 };

async function processGeminiResponse(result: any) {
  const rawText = result.candidates[0].content.parts[0].text;
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Kein JSON im KI-Output gefunden");
  return JSON.parse(jsonMatch[0]);
}

export async function POST(req: NextRequest) {
  try {
    const { text, url } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "API Key fehlt" }, { status: 500 });

    const modelsToTry = [
      "gemini-3.1-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash"
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
    Input: ${text || url}`;

    for (const modelName of modelsToTry) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (response.ok) {
          const result = await response.json();
          const jobData = await processGeminiResponse(result);
          return NextResponse.json(jobData);
        }
      } catch (e) {
        continue;
      }
    }

    return NextResponse.json({ error: "Alle Gemini Modelle (3.1/2.5) haben abgelehnt." }, { status: 500 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

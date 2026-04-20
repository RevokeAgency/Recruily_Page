import { NextRequest, NextResponse } from 'next/server';

export const config = { maxDuration: 28 };

export async function POST(req: NextRequest) {
  try {
    const { text, url } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "Key fehlt" }, { status: 500 });

    // Die AKTUELLEN 2026er Modelle aus deiner Recherche:
    const modelsToTry = [
      "gemini-3.1-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash" // Als stabiler Fallback
    ];

    const prompt = `Analysiere diesen Job-Text und extrahiere NUR JSON (kein Markdown):
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
        // Wir nutzen v1beta, da die 3.1er Modelle oft erst dort verfügbar sind
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
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
        console.log(`Modell ${modelName} nicht verfügbar (Status ${response.status}), versuche nächstes...`);
      } catch (e) {
        continue;
      }
    }

    return NextResponse.json({
      error: "Keines der modernen Gemini Modelle (3.1/2.5) konnte erreicht werden. Bitte prüfe die API-Aktivität im Studio."
    }, { status: 500 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
export async function GET() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    return NextResponse.json({
      status: response.status,
      hasKey: !!apiKey,
      keyPrefix: apiKey ? apiKey.substring(0, 6) : 'none',
      models: data
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}

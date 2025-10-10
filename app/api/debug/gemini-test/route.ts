import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Test Gemini API functionality
const getGeminiClient = () => {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || 
                process.env.GEMINI_API_KEY || 
                "AIzaSyDXJ1miQZF8wEc8ks4v7MyGI5dD4SWjRfY"
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING')
  }
  
  return new GoogleGenerativeAI(apiKey)
}

export async function GET(request: NextRequest) {
  console.log('🧪 Testing Gemini AI API connection...')
  
  try {
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 100,
      },
    })

    console.log('🤖 Sending simple test request to Gemini...')
    
    const result = await model.generateContent([
      'Test message: Please respond with a simple JSON object containing your name and status. Format: {"name": "Gemini", "status": "working", "timestamp": "current_time"}'
    ])
    
    const response = await result.response
    const text = response.text()

    console.log('✅ Gemini API test successful!')
    console.log('📤 Response:', text)

    return NextResponse.json({
      success: true,
      gemini_available: true,
      api_key_configured: true,
      response_preview: text.substring(0, 200),
      full_response: text,
      message: 'Gemini API is working correctly'
    })

  } catch (error: any) {
    console.error('❌ Gemini API test failed:', error)
    
    return NextResponse.json({
      success: false,
      gemini_available: false,
      api_key_configured: !!process.env.GEMINI_API_KEY || !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      error: error.message,
      error_type: error.constructor.name,
      message: 'Gemini API test failed'
    }, { status: 500 })
  }
}
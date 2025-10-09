import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function GET() {
  console.log('🧪 Testing Gemini API configuration...')
  
  try {
    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API key not found in environment variables',
        instructions: {
          message: 'Set up your Gemini API key',
          steps: [
            'Get key from https://aistudio.google.com/app/apikey',
            'Set GEMINI_API_KEY environment variable', 
            'Restart your application',
            'Try this test again'
          ]
        }
      }, { status: 400 })
    }

    console.log(`✅ API Key found (${apiKey.length} characters)`)
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 100,
      }
    })
    
    // Test API call
    const result = await model.generateContent([
      "Respond with exactly: 'API test successful! Ready for CV parsing.'"
    ])
    
    const response = await result.response
    const text = response.text()
    
    console.log('✅ Gemini API test successful!')
    
    return NextResponse.json({
      success: true,
      message: 'Gemini API is working correctly',
      response: text.trim(),
      apiKeyLength: apiKey.length,
      model: 'gemini-1.5-flash',
      status: 'ready_for_cv_parsing'
    })
    
  } catch (error: any) {
    console.error('❌ Gemini API test failed:', error)
    
    let errorMessage = error.message || 'Unknown error'
    let troubleshooting = []
    
    if (errorMessage.includes('API key not valid')) {
      troubleshooting = [
        'Verify your API key at https://aistudio.google.com/app/apikey',
        'Check that you copied the complete key (starts with AIza...)',
        'Ensure the key has not expired or been revoked',
        'Try generating a new API key if needed'
      ]
    } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
      troubleshooting = [
        'You may have exceeded the free tier limits',
        'Wait a few minutes and try again',
        'Check your usage at https://aistudio.google.com/app/apikey',
        'Consider upgrading if you need higher limits'
      ]
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      troubleshooting: troubleshooting.length > 0 ? troubleshooting : [
        'Check your internet connection',
        'Verify the API key is correctly set',
        'Try restarting your application'
      ]
    }, { status: 500 })
  }
}
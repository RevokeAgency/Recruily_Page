// Quick test script to verify Gemini API key works
// Run with: node test-api-key.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiAPI() {
  console.log('🚀 Testing Gemini API Key...\n');
  
  // Try to get API key from environment
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ ERROR: No API key found');
    console.log('Please ensure GEMINI_API_KEY environment variable is set\n');
    console.log('To set it:');
    console.log('Windows: set GEMINI_API_KEY=your_key_here');
    console.log('Linux/Mac: export GEMINI_API_KEY=your_key_here\n');
    process.exit(1);
  }
  
  console.log(`✅ API Key found (${apiKey.length} characters)`);
  console.log(`📝 Key starts with: ${apiKey.substring(0, 10)}...`);
  
  try {
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    console.log('\n🤖 Testing API connection...');
    
    // Simple test prompt
    const result = await model.generateContent([
      "Say 'Hello! The API key is working correctly.' in exactly those words."
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ SUCCESS! API is working');
    console.log(`📨 Response: ${text.trim()}`);
    console.log('\n🎉 Your Gemini API key is configured correctly!');
    console.log('💡 You can now use CV upload functionality in Recruily\n');
    
  } catch (error) {
    console.log('❌ ERROR: API test failed');
    console.error('Details:', error.message);
    
    if (error.message.includes('API key not valid')) {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Double-check your API key from https://aistudio.google.com/app/apikey');
      console.log('2. Make sure you copied the complete key (no spaces/truncation)');
      console.log('3. Verify the key has proper permissions');
    }
  }
}

testGeminiAPI();
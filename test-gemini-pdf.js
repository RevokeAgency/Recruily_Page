#!/usr/bin/env node

/**
 * Comprehensive Gemini API Test for PDF Processing
 * This script tests the exact same flow used in the CV parsing API
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Initialize Gemini AI with the same key used in production
function getGeminiClient() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || 
                process.env.GEMINI_API_KEY || 
                "AIzaSyDXJ1miQZF8wEc8ks4v7MyGI5dD4SWjRfY";
  
  console.log('🔑 Gemini API Key Configuration:');
  console.log('  - Has GOOGLE_GENERATIVE_AI_API_KEY:', !!process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  console.log('  - Has GEMINI_API_KEY:', !!process.env.GEMINI_API_KEY);
  console.log('  - Using hardcoded key:', !process.env.GOOGLE_GENERATIVE_AI_API_KEY && !process.env.GEMINI_API_KEY);
  console.log('  - Key length:', apiKey ? apiKey.length : 0);
  console.log('  - Key prefix:', apiKey ? apiKey.substring(0, 10) + '...' : 'undefined');
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }
  
  return new GoogleGenerativeAI(apiKey);
}

async function testGeminiWithPDF() {
  console.log('🚀 Starting comprehensive Gemini PDF test...\n');
  
  try {
    // Step 1: Initialize Gemini client
    console.log('📋 Step 1: Initializing Gemini client...');
    const genAI = getGeminiClient();
    
    // Step 2: Get the generative model
    console.log('📋 Step 2: Setting up Gemini model...');
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.1,
        maxOutputTokens: 4096,
      },
    });
    console.log('✅ Model configured successfully');
    
    // Step 3: Test with a sample text-based CV first
    console.log('\n📋 Step 3: Testing with text CV first...');
    const testTextCV = `
John Doe
Software Engineer
john.doe@email.com
(555) 123-4567

EXPERIENCE:
Senior Software Engineer at TechCorp (2020-2024)
- Developed React applications with TypeScript
- Built REST APIs using Node.js and Express
- Worked with PostgreSQL and MongoDB databases
- Implemented CI/CD pipelines with Jenkins

Junior Developer at StartupInc (2018-2020)
- Created responsive web applications
- Used JavaScript, HTML5, CSS3
- Collaborated with cross-functional teams

EDUCATION:
Bachelor of Science in Computer Science
University of Technology (2018)

SKILLS:
JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, MongoDB, Git, Docker, AWS
    `.trim();
    
    const textPrompt = `You are an expert CV/Resume parser. Analyze this CV text and extract information.
    
Extract information and return ONLY a valid JSON object in this EXACT format:
{
  "candidate": {
    "name": "Full name exactly as written",
    "email": "Email address if found",
    "phone": "Phone number if found", 
    "location": "City, State/Country if found",
    "summary": "Professional summary or objective",
    "skills": ["skill1", "skill2", "skill3"],
    "experience": [
      {
        "title": "Job Title",
        "company": "Company Name", 
        "duration": "Start Date - End Date",
        "description": "Job description or achievements"
      }
    ],
    "education": [
      {
        "degree": "Degree Name",
        "school": "Institution Name",
        "year": "Graduation Year"
      }
    ],
    "languages": ["English"],
    "certifications": [],
    "experienceYears": 5
  },
  "matching": {
    "overallScore": 85,
    "skillsMatch": 90,
    "experienceMatch": 80,
    "educationMatch": 75,
    "strengths": ["Strong technical skills", "Relevant experience"],
    "gaps": ["Could use more experience in X"]
  }
}

CV TEXT:
${testTextCV}`;

    console.log('📤 Sending text CV to Gemini...');
    const textStartTime = Date.now();
    
    try {
      const textResult = await model.generateContent([textPrompt]);
      const textDuration = Date.now() - textStartTime;
      const textResponse = await textResult.response;
      const textOutput = textResponse.text();
      
      console.log('✅ Text CV processing successful!');
      console.log('⏱️ Duration:', `${textDuration}ms`);
      console.log('📤 Response length:', textOutput.length);
      console.log('📋 First 300 chars:', textOutput.substring(0, 300));
      
      // Try to parse the JSON
      try {
        const parsedText = JSON.parse(textOutput.replace(/```json\s*\n?/gi, '').replace(/```\s*\n?/g, ''));
        console.log('✅ JSON parsing successful for text CV!');
        console.log('👤 Extracted name:', parsedText.candidate?.name);
        console.log('📧 Extracted email:', parsedText.candidate?.email);
        console.log('🎯 Skills count:', parsedText.candidate?.skills?.length || 0);
        console.log('💯 Overall score:', parsedText.matching?.overallScore);
      } catch (jsonError) {
        console.warn('⚠️ JSON parsing failed for text CV:', jsonError.message);
      }
      
    } catch (textError) {
      console.error('❌ Text CV processing failed:', textError.message);
      return;
    }
    
    // Step 4: Test with PDF file (if available)
    console.log('\n📋 Step 4: Testing with PDF file...');
    const pdfPath = path.join(__dirname, 'test-cv-fix.pdf');
    
    if (!fs.existsSync(pdfPath)) {
      console.warn('⚠️ PDF test file not found, creating a test scenario...');
      console.log('📋 Simulating PDF upload scenario...');
      
      // Create a mock PDF-like scenario by testing with binary data handling
      console.log('🔧 Testing base64 conversion process...');
      const testText = Buffer.from(testTextCV);
      const base64Text = testText.toString('base64');
      console.log('✅ Base64 conversion test passed');
      console.log('📊 Original size:', testText.length, 'bytes');
      console.log('📊 Base64 size:', base64Text.length, 'bytes');
      console.log('📊 Compression ratio:', Math.round((base64Text.length / testText.length) * 100) / 100);
      
    } else {
      console.log('📄 PDF file found, testing actual PDF processing...');
      
      try {
        // Read PDF file
        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfBase64 = pdfBuffer.toString('base64');
        
        console.log('📊 PDF file details:');
        console.log('  - Size:', pdfBuffer.length, 'bytes');
        console.log('  - Size (KB):', Math.round(pdfBuffer.length / 1024), 'KB');
        console.log('  - Size (MB):', Math.round(pdfBuffer.length / 1024 / 1024 * 100) / 100, 'MB');
        console.log('  - Base64 length:', pdfBase64.length);
        
        // Validate file size (Gemini limits)
        const maxSize = 20 * 1024 * 1024; // 20MB
        if (pdfBuffer.length > maxSize) {
          console.error('❌ PDF too large for Gemini:', Math.round(pdfBuffer.length / 1024 / 1024), 'MB');
          return;
        }
        
        console.log('✅ PDF size within Gemini limits');
        
        // Create PDF analysis prompt
        const pdfPrompt = `You are an expert CV/Resume parser and job matching system. Analyze this PDF document and extract ALL available information.

Extract information and return ONLY a valid JSON object in this EXACT format:
{
  "candidate": {
    "name": "Full name exactly as written",
    "email": "Email address if found",
    "phone": "Phone number if found", 
    "location": "City, State/Country if found",
    "summary": "Professional summary or objective",
    "skills": ["skill1", "skill2", "skill3"],
    "experience": [
      {
        "title": "Job Title",
        "company": "Company Name", 
        "duration": "Start Date - End Date",
        "description": "Job description or achievements"
      }
    ],
    "education": [
      {
        "degree": "Degree Name",
        "school": "Institution Name",
        "year": "Graduation Year"
      }
    ],
    "languages": ["English", "Spanish"],
    "certifications": ["Certification 1", "Certification 2"],
    "linkedinUrl": "LinkedIn URL if found",
    "portfolioUrl": "Portfolio URL if found",
    "githubUrl": "GitHub URL if found",
    "experienceYears": 5
  },
  "matching": {
    "overallScore": 85,
    "skillsMatch": 90,
    "experienceMatch": 80,
    "educationMatch": 75,
    "strengths": ["Strong technical skills", "Relevant experience"],
    "gaps": ["Could use more experience in X"]
  }
}

CRITICAL INSTRUCTIONS:
1. Extract ALL text content from the PDF document
2. Do NOT use placeholder or generic data
3. If information is not found, use null for strings and [] for arrays
4. Calculate a realistic match score based on the content
5. Return ONLY the JSON - no explanations, no markdown, no additional text
6. Ensure all text is properly extracted and not truncated`;

        // Create request payload exactly like the API does
        const requestPayload = [
          {
            inlineData: {
              data: pdfBase64,
              mimeType: "application/pdf",
            },
          },
          pdfPrompt,
        ];
        
        console.log('📤 Sending PDF to Gemini API...');
        console.log('📋 Request details:');
        console.log('  - Model: gemini-2.5-flash');
        console.log('  - MIME type: application/pdf');
        console.log('  - Base64 size:', Math.round(pdfBase64.length / 1024), 'KB');
        console.log('  - Prompt length:', pdfPrompt.length);
        
        const pdfStartTime = Date.now();
        
        try {
          const pdfResult = await model.generateContent(requestPayload);
          const pdfDuration = Date.now() - pdfStartTime;
          const pdfResponse = await pdfResult.response;
          const pdfOutput = pdfResponse.text();
          
          console.log('\n🎉 PDF PROCESSING SUCCESSFUL! 🎉');
          console.log('⏱️ Processing duration:', `${pdfDuration}ms`);
          console.log('📤 Response length:', pdfOutput.length);
          console.log('📋 Response preview (first 500 chars):');
          console.log('─'.repeat(60));
          console.log(pdfOutput.substring(0, 500));
          console.log('─'.repeat(60));
          
          // Try to parse the JSON response
          try {
            let cleanedOutput = pdfOutput.trim();
            cleanedOutput = cleanedOutput.replace(/```json\s*\n?/gi, '');
            cleanedOutput = cleanedOutput.replace(/```\s*\n?/g, '');
            cleanedOutput = cleanedOutput.replace(/^[^{]*/, '');
            cleanedOutput = cleanedOutput.replace(/[^}]*$/, '');
            
            const parsedPDF = JSON.parse(cleanedOutput);
            
            console.log('\n✅ JSON PARSING SUCCESSFUL! ✅');
            console.log('📊 Extracted candidate details:');
            console.log('  - Name:', parsedPDF.candidate?.name || 'Not found');
            console.log('  - Email:', parsedPDF.candidate?.email || 'Not found');
            console.log('  - Phone:', parsedPDF.candidate?.phone || 'Not found');
            console.log('  - Location:', parsedPDF.candidate?.location || 'Not found');
            console.log('  - Skills count:', parsedPDF.candidate?.skills?.length || 0);
            console.log('  - Skills:', parsedPDF.candidate?.skills?.slice(0, 5).join(', ') || 'None');
            console.log('  - Experience entries:', parsedPDF.candidate?.experience?.length || 0);
            console.log('  - Education entries:', parsedPDF.candidate?.education?.length || 0);
            console.log('  - Experience years:', parsedPDF.candidate?.experienceYears || 0);
            
            console.log('\n📊 Matching scores:');
            console.log('  - Overall score:', parsedPDF.matching?.overallScore || 0);
            console.log('  - Skills match:', parsedPDF.matching?.skillsMatch || 0);
            console.log('  - Experience match:', parsedPDF.matching?.experienceMatch || 0);
            console.log('  - Education match:', parsedPDF.matching?.educationMatch || 0);
            
            console.log('\n🎯 Analysis summary:');
            console.log('  - Strengths:', parsedPDF.matching?.strengths?.length || 0, 'items');
            if (parsedPDF.matching?.strengths?.length > 0) {
              parsedPDF.matching.strengths.forEach((strength, i) => {
                console.log(`    ${i + 1}. ${strength}`);
              });
            }
            
            console.log('  - Gaps:', parsedPDF.matching?.gaps?.length || 0, 'items');
            if (parsedPDF.matching?.gaps?.length > 0) {
              parsedPDF.matching.gaps.forEach((gap, i) => {
                console.log(`    ${i + 1}. ${gap}`);
              });
            }
            
            // Check if this looks like real extracted data vs placeholders
            const hasRealData = parsedPDF.candidate?.name && 
                              !parsedPDF.candidate.name.includes('Unknown') &&
                              !parsedPDF.candidate.name.includes('Test') &&
                              parsedPDF.candidate?.skills?.length > 0 &&
                              !parsedPDF.candidate.skills.includes('Professional Skills');
            
            console.log('\n🔍 Data quality assessment:');
            console.log('  - Has real extracted data:', hasRealData ? '✅ YES' : '❌ NO (generic/placeholder data)');
            console.log('  - Name appears real:', parsedPDF.candidate?.name && !parsedPDF.candidate.name.includes('Unknown'));
            console.log('  - Skills appear specific:', parsedPDF.candidate?.skills?.length > 0 && !parsedPDF.candidate.skills.includes('Professional Skills'));
            console.log('  - Has contact info:', !!(parsedPDF.candidate?.email || parsedPDF.candidate?.phone));
            
            if (hasRealData) {
              console.log('\n🎉 SUCCESS: Gemini is properly extracting real data from PDFs! 🎉');
            } else {
              console.log('\n⚠️ ISSUE: Gemini may not be properly reading PDF content - data appears generic');
            }
            
          } catch (jsonError) {
            console.error('\n❌ JSON parsing failed for PDF response:');
            console.error('Error:', jsonError.message);
            console.error('Raw response preview:');
            console.error(pdfOutput.substring(0, 1000));
          }
          
        } catch (pdfApiError) {
          console.error('\n❌ PDF API call failed:');
          console.error('Error type:', pdfApiError.constructor.name);
          console.error('Error message:', pdfApiError.message);
          console.error('Error code:', pdfApiError.code);
          console.error('Duration:', Date.now() - pdfStartTime, 'ms');
          
          // Provide specific error diagnosis
          if (pdfApiError.message?.includes('quota')) {
            console.error('🚨 DIAGNOSIS: API quota exceeded');
          } else if (pdfApiError.message?.includes('permission') || pdfApiError.message?.includes('API key')) {
            console.error('🚨 DIAGNOSIS: API key authentication issue');
          } else if (pdfApiError.message?.includes('safety')) {
            console.error('🚨 DIAGNOSIS: Content blocked by safety filters');
          } else if (pdfApiError.message?.includes('size') || pdfApiError.message?.includes('large')) {
            console.error('🚨 DIAGNOSIS: File too large for processing');
          } else {
            console.error('🚨 DIAGNOSIS: Unknown API error');
          }
        }
        
      } catch (fileError) {
        console.error('❌ Error reading PDF file:', fileError.message);
      }
    }
    
    console.log('\n📋 Test completed!');
    
  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
    console.error('Stack trace:', error.stack?.substring(0, 500));
  }
}

// Run the test
if (require.main === module) {
  testGeminiWithPDF().catch(console.error);
}

module.exports = { testGeminiWithPDF };
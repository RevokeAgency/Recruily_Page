#!/usr/bin/env node

/**
 * Test Gemini API with our real CV content
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Initialize Gemini AI
function getGeminiClient() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || 
                process.env.GEMINI_API_KEY || 
                "AIzaSyDXJ1miQZF8wEc8ks4v7MyGI5dD4SWjRfY";
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }
  
  return new GoogleGenerativeAI(apiKey);
}

async function testRealCV() {
  console.log('🚀 Testing Gemini with comprehensive CV content...\n');
  
  try {
    // Read our test CV
    const cvPath = path.join(__dirname, 'test-cv-john-smith.txt');
    if (!fs.existsSync(cvPath)) {
      console.error('❌ Test CV file not found. Run: node create-test-cv.js first');
      return;
    }
    
    const cvContent = fs.readFileSync(cvPath, 'utf8');
    console.log('📄 CV loaded successfully');
    console.log('📊 CV details:');
    console.log('  - Length:', cvContent.length, 'characters');
    console.log('  - Lines:', cvContent.split('\n').length);
    console.log('  - Size:', Math.round(cvContent.length / 1024 * 100) / 100, 'KB');
    
    // Initialize Gemini
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.1,
        maxOutputTokens: 4096,
      },
    });
    
    // Enhanced prompt for better extraction
    const prompt = `You are an expert CV/Resume parser. Analyze this CV document and extract ALL available information accurately.

IMPORTANT: Extract real data from the CV content below. Do NOT use placeholder data.

Extract information and return ONLY a valid JSON object in this EXACT format:
{
  "candidate": {
    "name": "Full name exactly as written",
    "email": "Email address if found",
    "phone": "Phone number if found", 
    "location": "City, State/Country if found",
    "summary": "Professional summary or objective (first paragraph)",
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
    "experienceYears": 8
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

CV CONTENT TO ANALYZE:
${cvContent}

EXTRACTION RULES:
1. Use ONLY information found in the CV above
2. Extract the exact name, email, phone as written
3. List ALL technical skills mentioned
4. Include ALL work experience with accurate details
5. Extract education information precisely
6. Calculate experience years based on dates mentioned
7. Return ONLY the JSON - no explanations or markdown`;

    console.log('\n📤 Sending comprehensive CV to Gemini...');
    const startTime = Date.now();
    
    const result = await model.generateContent([prompt]);
    const duration = Date.now() - startTime;
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Processing completed successfully!');
    console.log('⏱️ Duration:', `${duration}ms`);
    console.log('📤 Response length:', text.length);
    
    // Clean and parse JSON
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/```json\s*\n?/gi, '');
    cleanedText = cleanedText.replace(/```\s*\n?/g, '');
    cleanedText = cleanedText.replace(/^[^{]*/, '');
    cleanedText = cleanedText.replace(/[^}]*$/, '');
    
    console.log('\n📋 Raw response preview (first 800 chars):');
    console.log('─'.repeat(80));
    console.log(text.substring(0, 800));
    console.log('─'.repeat(80));
    
    try {
      const parsedData = JSON.parse(cleanedText);
      
      console.log('\n🎉 SUCCESSFUL EXTRACTION! 🎉');
      console.log('\n👤 CANDIDATE INFORMATION:');
      console.log('  📛 Name:', parsedData.candidate?.name || 'Not found');
      console.log('  📧 Email:', parsedData.candidate?.email || 'Not found');
      console.log('  📱 Phone:', parsedData.candidate?.phone || 'Not found');
      console.log('  📍 Location:', parsedData.candidate?.location || 'Not found');
      console.log('  📝 Summary:', parsedData.candidate?.summary ? 
        (parsedData.candidate.summary.length > 100 ? 
          parsedData.candidate.summary.substring(0, 100) + '...' : 
          parsedData.candidate.summary) : 'Not found');
      
      console.log('\n🛠️ TECHNICAL SKILLS (' + (parsedData.candidate?.skills?.length || 0) + ' total):');
      if (parsedData.candidate?.skills?.length > 0) {
        parsedData.candidate.skills.forEach((skill, i) => {
          if (i < 10) console.log(`    ${i + 1}. ${skill}`);
        });
        if (parsedData.candidate.skills.length > 10) {
          console.log(`    ... and ${parsedData.candidate.skills.length - 10} more`);
        }
      } else {
        console.log('    No skills extracted');
      }
      
      console.log('\n💼 WORK EXPERIENCE (' + (parsedData.candidate?.experience?.length || 0) + ' positions):');
      if (parsedData.candidate?.experience?.length > 0) {
        parsedData.candidate.experience.forEach((exp, i) => {
          console.log(`    ${i + 1}. ${exp.title || 'Title not found'} at ${exp.company || 'Company not found'}`);
          console.log(`       Duration: ${exp.duration || 'Duration not found'}`);
          console.log(`       Description: ${exp.description ? 
            (exp.description.length > 80 ? exp.description.substring(0, 80) + '...' : exp.description) : 
            'No description'}`);
        });
      } else {
        console.log('    No work experience extracted');
      }
      
      console.log('\n🎓 EDUCATION (' + (parsedData.candidate?.education?.length || 0) + ' entries):');
      if (parsedData.candidate?.education?.length > 0) {
        parsedData.candidate.education.forEach((edu, i) => {
          console.log(`    ${i + 1}. ${edu.degree || 'Degree not found'}`);
          console.log(`       School: ${edu.school || 'School not found'}`);
          console.log(`       Year: ${edu.year || 'Year not found'}`);
        });
      } else {
        console.log('    No education information extracted');
      }
      
      console.log('\n🏆 CERTIFICATIONS (' + (parsedData.candidate?.certifications?.length || 0) + ' total):');
      if (parsedData.candidate?.certifications?.length > 0) {
        parsedData.candidate.certifications.forEach((cert, i) => {
          console.log(`    ${i + 1}. ${cert}`);
        });
      } else {
        console.log('    No certifications extracted');
      }
      
      console.log('\n🌐 LANGUAGES (' + (parsedData.candidate?.languages?.length || 0) + ' total):');
      if (parsedData.candidate?.languages?.length > 0) {
        console.log('    ' + parsedData.candidate.languages.join(', '));
      } else {
        console.log('    No languages specified');
      }
      
      console.log('\n🔗 ONLINE PROFILES:');
      console.log('  LinkedIn:', parsedData.candidate?.linkedinUrl || 'Not found');
      console.log('  GitHub:', parsedData.candidate?.githubUrl || 'Not found');
      console.log('  Portfolio:', parsedData.candidate?.portfolioUrl || 'Not found');
      
      console.log('\n⏳ EXPERIENCE:');
      console.log('  Calculated years:', parsedData.candidate?.experienceYears || 0);
      
      console.log('\n📊 MATCHING ANALYSIS:');
      console.log('  🎯 Overall Score:', parsedData.matching?.overallScore || 0, '%');
      console.log('  🛠️ Skills Match:', parsedData.matching?.skillsMatch || 0, '%');
      console.log('  💼 Experience Match:', parsedData.matching?.experienceMatch || 0, '%');
      console.log('  🎓 Education Match:', parsedData.matching?.educationMatch || 0, '%');
      
      console.log('\n💪 STRENGTHS (' + (parsedData.matching?.strengths?.length || 0) + ' items):');
      if (parsedData.matching?.strengths?.length > 0) {
        parsedData.matching.strengths.forEach((strength, i) => {
          console.log(`    ${i + 1}. ${strength}`);
        });
      }
      
      console.log('\n📈 GAPS (' + (parsedData.matching?.gaps?.length || 0) + ' items):');
      if (parsedData.matching?.gaps?.length > 0) {
        parsedData.matching.gaps.forEach((gap, i) => {
          console.log(`    ${i + 1}. ${gap}`);
        });
      }
      
      // Quality assessment
      const hasRealName = parsedData.candidate?.name && 
                         parsedData.candidate.name !== 'Not found' &&
                         !parsedData.candidate.name.includes('Unknown') &&
                         parsedData.candidate.name.length > 3;
      
      const hasRealSkills = parsedData.candidate?.skills?.length > 0 &&
                           !parsedData.candidate.skills.includes('Professional Skills') &&
                           parsedData.candidate.skills.some(skill => skill.length > 2);
      
      const hasRealExperience = parsedData.candidate?.experience?.length > 0 &&
                               parsedData.candidate.experience.some(exp => 
                                 exp.company && !exp.company.includes('Company') &&
                                 exp.title && !exp.title.includes('Title'));
      
      console.log('\n🔍 DATA QUALITY ASSESSMENT:');
      console.log('  ✅ Real name extracted:', hasRealName ? '✅ YES' : '❌ NO');
      console.log('  ✅ Real skills extracted:', hasRealSkills ? '✅ YES' : '❌ NO');
      console.log('  ✅ Real experience extracted:', hasRealExperience ? '✅ YES' : '❌ NO');
      console.log('  ✅ Contact information:', !!(parsedData.candidate?.email && parsedData.candidate?.phone) ? '✅ YES' : '⚠️ PARTIAL');
      
      if (hasRealName && hasRealSkills && hasRealExperience) {
        console.log('\n🎉 SUCCESS: Gemini is correctly extracting real data from CV content! 🎉');
        console.log('📋 The parsing API should work properly with this configuration.');
        
        // Save successful result for comparison
        const resultPath = path.join(__dirname, 'successful-extraction-result.json');
        fs.writeFileSync(resultPath, JSON.stringify(parsedData, null, 2));
        console.log('💾 Successful result saved to:', resultPath);
      } else {
        console.log('\n⚠️ PARTIAL SUCCESS: Some data extracted but may need prompt improvement');
      }
      
    } catch (parseError) {
      console.error('\n❌ JSON parsing failed:', parseError.message);
      console.error('📋 Raw response was:', text.substring(0, 500) + '...');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack?.substring(0, 500));
  }
}

// Run the test
if (require.main === module) {
  testRealCV().catch(console.error);
}

module.exports = { testRealCV };
#!/usr/bin/env node

/**
 * Test the improved JSON parsing strategies
 */

// Mock the parsing functions from the API for testing
function tryEnhancedJsonParse(text) {
  console.log('🔧 Enhanced JSON parsing with comprehensive cleaning...')
  
  let cleanedText = text.trim()
  
  // Remove markdown code blocks more thoroughly
  cleanedText = cleanedText.replace(/```json\s*\n?/gi, '')
  cleanedText = cleanedText.replace(/```\s*\n?/g, '')
  cleanedText = cleanedText.replace(/^[^{]*\{/, '{')
  cleanedText = cleanedText.replace(/\}[^}]*$/g, '}')
  
  // Find proper JSON bounds
  const jsonStart = cleanedText.indexOf('{')
  let jsonEnd = -1
  
  if (jsonStart !== -1) {
    let braceCount = 0
    let inString = false
    let escapeNext = false
    
    for (let i = jsonStart; i < cleanedText.length; i++) {
      const char = cleanedText[i]
      
      if (escapeNext) {
        escapeNext = false
        continue
      }
      
      if (char === '\\') {
        escapeNext = true
        continue
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString
        continue
      }
      
      if (!inString) {
        if (char === '{') {
          braceCount++
        } else if (char === '}') {
          braceCount--
          if (braceCount === 0) {
            jsonEnd = i + 1
            break
          }
        }
      }
    }
  }
  
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('No valid JSON bounds found in enhanced parsing')
  }
  
  let jsonString = cleanedText.substring(jsonStart, jsonEnd)
  
  // Additional JSON repairs
  jsonString = jsonString.replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
  jsonString = jsonString.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":') // Quote unquoted keys
  jsonString = jsonString.replace(/:\s*'([^']*)'/g, ':"$1"') // Convert single quotes to double
  
  console.log('📋 Cleaned JSON preview:', jsonString.substring(0, 300) + '...')
  
  const parsedData = JSON.parse(jsonString)
  console.log('✅ Enhanced JSON parsing successful!')
  return parsedData
}

function tryIncrementalJsonRepair(text) {
  console.log('🔧 Attempting incremental JSON repair...')
  
  let workingText = text.trim()
  
  // Step 1: Remove markdown and excess content
  workingText = workingText.replace(/```json\s*\n?/gi, '')
  workingText = workingText.replace(/```\s*\n?/g, '')
  
  // Step 2: Find JSON boundaries more carefully
  const jsonMatch = workingText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON structure found')
  }
  
  let jsonString = jsonMatch[0]
  
  // Step 3: Incremental repairs
  const repairs = [
    // Fix trailing commas in arrays and objects
    { pattern: /,\s*([}\]])/g, replacement: '$1' },
    
    // Fix unquoted object keys
    { pattern: /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, replacement: '$1"$2":' },
    
    // Convert single quotes to double quotes (but not inside strings)
    { pattern: /:\s*'([^'\\\\\\r\\n]*(?:\\\\.[^'\\\\\\r\\n]*)*)'/g, replacement: ':"$1"' },
    
    // Fix missing quotes around string values that look like strings
    { pattern: /:\s*([A-Za-z][A-Za-z0-9\s]*[A-Za-z])\s*([,}])/g, replacement: ':"$1"$2' },
    
    // Fix incomplete arrays - if array doesn't end properly
    { pattern: /\[\s*([^\]]+)\s*$/, replacement: '[$1]' },
    
    // Fix incomplete objects - if object doesn't end properly  
    { pattern: /\{\s*([^}]+)\s*$/, replacement: '{$1}' }
  ]
  
  for (let i = 0; i < repairs.length; i++) {
    const beforeLength = jsonString.length
    jsonString = jsonString.replace(repairs[i].pattern, repairs[i].replacement)
    if (jsonString.length !== beforeLength) {
      console.log(`🔧 Applied repair ${i + 1}: pattern matched`)
    }
  }
  
  // Step 4: Handle truncated JSON by trying to close structures
  const openBraces = (jsonString.match(/\{/g) || []).length
  const closeBraces = (jsonString.match(/\}/g) || []).length
  const openBrackets = (jsonString.match(/\[/g) || []).length
  const closeBrackets = (jsonString.match(/\]/g) || []).length
  
  // Add missing closing braces/brackets
  if (openBraces > closeBraces) {
    jsonString += '}'.repeat(openBraces - closeBraces)
    console.log(`🔧 Added ${openBraces - closeBraces} missing closing braces`)
  }
  
  if (openBrackets > closeBrackets) {
    jsonString += ']'.repeat(openBrackets - closeBrackets)
    console.log(`🔧 Added ${openBrackets - closeBrackets} missing closing brackets`)
  }
  
  console.log('📋 Repaired JSON preview:', jsonString.substring(0, 300) + '...')
  
  const parsedData = JSON.parse(jsonString)
  console.log('✅ Incremental JSON repair successful!')
  return parsedData
}

async function testParsing() {
  // Test with the problematic response from our previous test
  const problematicResponse = `\`\`\`json
{
  "candidate": {
    "name": "John Smith",
    "email": "john.smith@email.com",
    "phone": "(555) 123-4567",
    "location": "San Francisco, CA",
    "summary": "Experienced software engineer with 8+ years of expertise in full-stack development, cloud architecture, and team leadership. Proven track record of delivering scalable applications and leading cross-functional teams to success.",
    "skills": [
      "JavaScript",
      "TypeScript", 
      "Python",
      "Java",
      "Go",
      "SQL",
      "React",
      "Vue.js",
      "Angular",
      "HTML5",
      "CSS3"
    ],
    "experience": [
      {
        "title": "Senior Software Engineer",
        "company": "TechCorp Inc.",
        "duration": "January 2020 - Present",
        "description": "Led development of microservices architecture serving 1M+ daily users"
      }
    ],
    "education": [
      {
        "degree": "Bachelor of Science in Computer Science",
        "school": "University of California, Berkeley", 
        "year": "2016"
      }
    ],
    "languages": ["English", "Spanish"],
    "certifications": ["AWS Certified Solutions Architect"],
    "experienceYears": 8
  },
  "matching": {
    "overallScore": 88,
    "skillsMatch": 92,
    "experienceMatch": 85,
    "educationMatch": 80,
    "strengths": ["Strong technical skills", "Leadership experience"],
    "gaps": []
  }
}`

  console.log('🚀 Testing improved JSON parsing strategies...\n')
  
  // Test Strategy 1: Enhanced JSON parsing
  try {
    console.log('📋 Testing Strategy 1: Enhanced JSON parsing')
    const result1 = tryEnhancedJsonParse(problematicResponse)
    console.log('✅ Strategy 1 Success! Extracted name:', result1.candidate?.name)
    console.log('📊 Skills extracted:', result1.candidate?.skills?.length || 0)
    return
  } catch (error) {
    console.log('❌ Strategy 1 failed:', error.message)
  }
  
  // Test Strategy 2: Incremental JSON repair
  try {
    console.log('\n📋 Testing Strategy 2: Incremental JSON repair')
    const result2 = tryIncrementalJsonRepair(problematicResponse)
    console.log('✅ Strategy 2 Success! Extracted name:', result2.candidate?.name)
    console.log('📊 Skills extracted:', result2.candidate?.skills?.length || 0)
    return
  } catch (error) {
    console.log('❌ Strategy 2 failed:', error.message)
  }
  
  console.log('\n❌ All strategies failed - this shouldn\'t happen with the test data')
}

if (require.main === module) {
  testParsing().catch(console.error)
}

module.exports = { testParsing };
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("=== 🔍 Enhanced Job Text Parsing API Called ===")

    const { text, structuredData } = await request.json()

    if (!text) {
      console.error("No text provided in request")
      return NextResponse.json(
        {
          success: false,
          error: "No text provided. Please provide job description text to parse.",
        },
        { status: 400 },
      )
    }

    console.log(`Processing job text: ${text.length} characters`)
    if (structuredData) {
      console.log('Using enhanced structured data from scraper:', {
        hasTitle: !!structuredData.title,
        hasCompany: !!structuredData.company,
        hasLocation: !!structuredData.location,
        hasDescription: !!structuredData.description
      })
    }

    // Check for API key availability
    const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY

    // Set the correct environment variable for AI SDK if needed
    if (process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY
    }

    let extractedData

    // Use structured data if available, otherwise extract with AI/regex
    if (structuredData && structuredData.title) {
      console.log("🎯 Using structured data from enhanced scraper")
      
      // Combine structured data with AI/regex extraction for completeness
      const additionalData = googleApiKey 
        ? await extractWithAI(text, googleApiKey, structuredData)
        : extractJobWithRegex(text)
      
      extractedData = {
        title: structuredData.title || additionalData.title,
        company: structuredData.company || additionalData.company,
        location: structuredData.location || additionalData.location,
        description: structuredData.description || additionalData.description,
        requirements: additionalData.requirements || [],
        skills: additionalData.skills || [],
        jobType: additionalData.jobType || 'full-time',
        salaryRange: additionalData.salaryRange || '',
        benefits: additionalData.benefits || [],
        applicationDeadline: additionalData.applicationDeadline || ''
      }
      
      console.log("✅ Enhanced extraction using structured data completed")
    } else {
      // Fallback to AI or regex extraction
      if (googleApiKey) {
        extractedData = await extractWithAI(text, googleApiKey)
      } else {
        console.log("📝 No API key found, using regex extraction for job text")
        extractedData = extractJobWithRegex(text)
      }
    }



    return NextResponse.json({
      success: true,
      ...extractedData,
      method: structuredData ? "enhanced-scraper" : (googleApiKey ? "ai" : "regex"),
    })
  } catch (error: any) {
    console.error("❌ Job parsing error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to parse job description",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

// Enhanced AI extraction function
async function extractWithAI(text: string, googleApiKey: string, structuredData?: any) {
  try {
    console.log("🤖 Using AI extraction for job text...")

    // Dynamic import to avoid loading AI SDK when not needed
    const { generateText } = await import("ai")
    const { google } = await import("@ai-sdk/google")

    // Enhanced prompt with structured data context
    const prompt = structuredData 
      ? `You are analyzing a job posting. I have already extracted some structured data: ${JSON.stringify(structuredData)}. 

Please enhance and complete this job information from the following content and return a JSON object:

${text}

Return JSON with this exact structure:
{
  "title": "job title",
  "company": "company name",
  "location": "job location", 
  "salaryRange": "salary range if mentioned",
  "jobType": "employment type (full-time, part-time, contract, etc.)",
  "description": "comprehensive job description (3-5 sentences)",
  "requirements": ["requirement1", "requirement2", "requirement3"],
  "skills": ["skill1", "skill2", "skill3"],
  "benefits": ["benefit1", "benefit2"],
  "applicationDeadline": "deadline if mentioned"
}

IMPORTANT: Return ONLY the JSON object, no additional text.`
      : `Extract comprehensive job information from this job posting and return a JSON object:

${text}

Return JSON with this exact structure:
{
  "title": "job title",
  "company": "company name",
  "location": "job location", 
  "salaryRange": "salary range if mentioned",
  "jobType": "employment type (full-time, part-time, contract, etc.)",
  "description": "comprehensive job description (3-5 sentences)",
  "requirements": ["requirement1", "requirement2", "requirement3"],
  "skills": ["skill1", "skill2", "skill3"],
  "benefits": ["benefit1", "benefit2"],
  "applicationDeadline": "deadline if mentioned"
}

IMPORTANT: Return ONLY the JSON object, no additional text.`

    const result = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: prompt,
    })

    try {
      // Clean the response text
      let jsonText = result.text.trim()
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/```json\s*/, "").replace(/```\s*$/, "")
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```\s*/, "").replace(/```\s*$/, "")
      }

      const extractedData = JSON.parse(jsonText)
      console.log("✅ AI extraction successful for job text")
      return extractedData
    } catch (parseError) {
      console.log("⚠️ AI response not valid JSON, falling back to regex")
      return extractJobWithRegex(text)
    }
  } catch (aiError: any) {
    console.log("❌ AI extraction failed, using regex fallback:", aiError.message)
    return extractJobWithRegex(text)
  }
}

// Enhanced regex-based extraction for job text
function extractJobWithRegex(text: string) {
  console.log("🔍 Starting regex extraction for job text...")

  const lines = text.split("\n").map((line) => line.trim())

  // Simple patterns for common job posting formats
  let title = ""
  let company = ""
  let location = ""
  let salary = ""
  let jobType = "full-time"

  // Enhanced title patterns for better extraction
  const titlePatterns = [
    /^(.*(?:developer|engineer|manager|analyst|specialist|coordinator|assistant|director|designer|architect|lead|senior|junior|intern|executive|consultant|administrator|technician|supervisor|officer).*)/i,
    /(?:job title|position|role|vacancy|opening)[:\s-]*(.+)/i,
    /(?:we're hiring|now hiring|join our team as)[:\s-]*(.+)/i,
    /^([A-Z][^.!?]*(?:developer|engineer|manager|analyst|specialist|coordinator|assistant|director|designer|architect|lead|senior|junior)[^.!?]*)/i,
    /job[:\s-]*(.+(?:developer|engineer|manager|analyst|specialist|coordinator|assistant|director|designer|architect|lead|senior|junior).+)/i
  ]

  // Check first 15 lines for title
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i].trim()
    if (line.length > 5 && line.length < 150 && !line.toLowerCase().includes('cookie') && !line.toLowerCase().includes('privacy')) {
      for (const pattern of titlePatterns) {
        const match = line.match(pattern)
        if (match && match[1]) {
          const potentialTitle = match[1].trim().replace(/[^\w\s&.-]/g, '')
          if (potentialTitle.length > 3 && potentialTitle.length < 100) {
            title = potentialTitle
            break
          }
        }
      }
      if (title) break
      
      // Fallback: if line contains job-related keywords and is reasonable length
      if (!title && line.length > 10 && line.length < 80 && 
          /\b(developer|engineer|manager|analyst|specialist|coordinator|assistant|director|designer|architect|lead|senior|junior)\b/i.test(line)) {
        title = line.replace(/[^\w\s&.-]/g, '').trim()
        break
      }
    }
  }

  // Enhanced extraction patterns
  const companyPatterns = [
    /(?:company|employer|organization|firm|corporation)[:\s]*([^\n\r]{1,80})/i,
    /(?:at|@)\s+([A-Z][^\n\r,]{2,50})/,
    /(?:join|work for|career at)\s+([A-Z][^\n\r,]{2,50})/i
  ]
  
  for (const pattern of companyPatterns) {
    const match = text.match(pattern)
    if (match && match[1] && !company) {
      company = match[1].trim().replace(/[^\w\s&.-]/g, '').trim()
      if (company.length > 1 && company.length < 80) break
    }
  }

  const locationPatterns = [
    /(?:location|city|based in|office|workplace)[:\s]*([^\n\r]{1,80})/i,
    /(?:remote|hybrid|on-site|in)\s+([A-Z][^\n\r,]{2,50})/,
    /\b([A-Z][a-zA-Z\s]+,\s*[A-Z]{2,})\b/ // City, State/Country format
  ]
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern)
    if (match && match[1] && !location) {
      location = match[1].trim().replace(/[^\w\s,.-]/g, '').trim()
      if (location.length > 2 && location.length < 80) break
    }
  }

  const salaryPatterns = [
    /(?:salary|compensation|pay|wage|income)[:\s]*([^\n\r]{1,100})/i,
    /\$[\d,]+\s*-?\s*\$?[\d,]*/,
    /€[\d,]+\s*-?\s*€?[\d,]*/,
    /£[\d,]+\s*-?\s*£?[\d,]*/,
    /\b\d{2,3}[,.]?\d{3}\s*(?:per year|annually|\/year|k)\b/i
  ]
  
  for (const pattern of salaryPatterns) {
    const match = text.match(pattern)
    if (match && match[0] && !salary) {
      salary = match[0].trim()
      if (salary.length > 3 && salary.length < 50) break
    }
  }

  const typePatterns = [
    /\b(full[.-]?time|part[.-]?time|contract|freelance|remote|hybrid|temporary|permanent|internship)\b/i,
    /(?:employment type|job type|position type)[:\s]*([^\n\r]{1,30})/i
  ]
  
  for (const pattern of typePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      jobType = match[1].replace(/[.-]/g, "-").toLowerCase().trim()
      break
    }
  }

  // Extract description (first substantial paragraph)
  const descriptionMatch = text.match(/(?:description|about|summary|overview)[:\s]*([^]{200,1000})/i)
  const description = descriptionMatch ? descriptionMatch[1].trim().substring(0, 500) : text.substring(0, 300).trim()

  // Extract requirements
  const requirementsMatch = text.match(/(?:requirements|qualifications|skills|must have)[:\s]*([^]{200,800})/i)
  const requirements = requirementsMatch
    ? requirementsMatch[1]
        .trim()
        .split(/[•\n\r-]/)
        .filter((req) => req.trim().length > 10)
        .slice(0, 8)
    : []

  // Extract skills
  const skillKeywords = [
    "JavaScript",
    "TypeScript",
    "React",
    "Vue",
    "Angular",
    "Node.js",
    "Python",
    "Java",
    "C++",
    "C#",
    "HTML",
    "CSS",
    "SQL",
    "MongoDB",
    "PostgreSQL",
    "MySQL",
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "Git",
    "Agile",
    "Scrum",
    "REST",
    "GraphQL",
    "Redux",
    "Express",
    "Spring",
    "Django",
    "Flask",
    "PHP",
    "Ruby",
    "Go",
    "Rust",
    "Swift",
    "Kotlin",
    "Machine Learning",
    "AI",
    "Data Science",
  ]

  const foundSkills = skillKeywords.filter((skill) => text.toLowerCase().includes(skill.toLowerCase())).slice(0, 10)

  // Extract benefits
  const benefitsMatch = text.match(/(?:benefits|perks|we offer)[:\s]*([^]{100,500})/i)
  const benefits = benefitsMatch
    ? benefitsMatch[1]
        .trim()
        .split(/[•\n\r-]/)
        .filter((benefit) => benefit.trim().length > 5)
        .slice(0, 5)
    : []

  const result = {
    title: title || "Job Position",
    company: company || "",
    location: location || "",
    salaryRange: salary || "",
    jobType: jobType,
    description: description || "Job description extracted from provided text.",
    requirements: requirements.length > 0 ? requirements : ["Professional experience required"],
    skills: foundSkills.length > 0 ? foundSkills : ["Professional Skills"],
    benefits: benefits.length > 0 ? benefits : [],
    applicationDeadline: "",
  }

  console.log("✅ Regex extraction completed for job text:", {
    title: !!result.title,
    company: !!result.company,
    location: !!result.location,
    skills: result.skills.length,
    requirements: result.requirements.length,
  })

  return result
}

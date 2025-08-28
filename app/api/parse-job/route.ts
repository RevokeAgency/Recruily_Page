import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("=== 🔍 Job Text Parsing API Called ===")

    const { text } = await request.json()

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

    // Check for API key availability
    const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY

    // Set the correct environment variable for AI SDK if needed
    if (process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY
    }

    let extractedData

    // Try AI extraction if API key is available
    if (googleApiKey) {
      try {
        console.log("🤖 Using AI extraction for job text...")

        // Dynamic import to avoid loading AI SDK when not needed
        const { generateText } = await import("ai")
        const { google } = await import("@ai-sdk/google")

        const result = await generateText({
          model: google("gemini-1.5-flash"),
          prompt: `Extract job information from this job posting content and return a JSON object with the following structure:
{
  "title": "job title",
  "company": "company name",
  "location": "job location", 
  "salaryRange": "salary range if mentioned",
  "jobType": "employment type (full-time, part-time, contract, etc.)",
  "description": "job description (2-3 sentences)",
  "requirements": ["requirement1", "requirement2"],
  "skills": ["skill1", "skill2"],
  "benefits": ["benefit1", "benefit2"],
  "applicationDeadline": "deadline if mentioned"
}

IMPORTANT: Return ONLY the JSON object, no additional text.

Job posting content:
${text}`,
        })

        try {
          // Clean the response text
          let jsonText = result.text.trim()
          if (jsonText.startsWith("```json")) {
            jsonText = jsonText.replace(/```json\s*/, "").replace(/```\s*$/, "")
          } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/```\s*/, "").replace(/```\s*$/, "")
          }

          extractedData = JSON.parse(jsonText)
          console.log("✅ AI extraction successful for job text")
        } catch (parseError) {
          console.log("⚠️ AI response not valid JSON, falling back to regex")
          extractedData = extractJobWithRegex(text)
        }
      } catch (aiError) {
        console.log("❌ AI extraction failed, using regex fallback:", aiError.message)
        extractedData = extractJobWithRegex(text)
      }
    } else {
      console.log("📝 No API key found, using regex extraction for job text")
      extractedData = extractJobWithRegex(text)
    }

    return NextResponse.json({
      success: true,
      ...extractedData,
      method: googleApiKey ? "ai" : "regex",
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

  // Look for title in first few lines or common patterns
  const titlePatterns = [
    /^(.*(?:developer|engineer|manager|analyst|specialist|coordinator|assistant|director|designer|architect|lead|senior|junior).*)/i,
    /(?:job title|position|role)[:\s]*(.+)/i,
    /(?:we're hiring|now hiring)[:\s]*(.+)/i,
  ]

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i]
    if (line.length > 5 && line.length < 100) {
      for (const pattern of titlePatterns) {
        const match = line.match(pattern)
        if (match && match[1]) {
          title = match[1].trim()
          break
        }
      }
      if (title) break
    }
  }

  // Extract other information
  const companyMatch = text.match(/(?:company|employer|organization)[:\s]*([^\n\r]{1,80})/i)
  company = companyMatch ? companyMatch[1].trim() : ""

  const locationMatch = text.match(/(?:location|city|based in|office)[:\s]*([^\n\r]{1,80})/i)
  location = locationMatch ? locationMatch[1].trim() : ""

  const salaryMatch = text.match(/(?:salary|compensation|pay)[:\s]*([^\n\r]{1,50})/i)
  salary = salaryMatch ? salaryMatch[1].trim() : ""

  const typeMatch = text.match(/\b(full.time|part.time|contract|freelance|remote|hybrid)\b/i)
  jobType = typeMatch ? typeMatch[1].replace(/[.-]/g, "-") : "full-time"

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

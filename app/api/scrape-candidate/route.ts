import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"
import { normalizeCandidateDataWithGemini } from "@/lib/gemini-ai"
import { getOrgId } from "@/lib/get-org-id"

interface CandidateData {
  name?: string
  email?: string
  phone?: string
  location?: string
  skills?: string[]
  experience_years?: number
  education?: string
  degree?: string
  university?: string
  graduation_year?: number
  summary?: string
  linkedin_url?: string
  portfolio_url?: string
  github_url?: string
  languages?: string[]
  certifications?: string[]
  salary_expectation_min?: number
  salary_expectation_max?: number
  visa_status?: string
  availability?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log("🌐 Scrape Candidate API - POST request received")

    const body = await request.json()
    const { url, jobId } = body

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      )
    }

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "Job ID is required" },
        { status: 400 }
      )
    }

    // Validate URL format
    if (!isValidUrl(url)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid URL" },
        { status: 400 }
      )
    }

    console.log(`🔍 Scraping candidate profile from: ${url}`)

    // Scrape the profile
    const scrapedData = await scrapeProfile(url)
    
    if (!scrapedData.success) {
      return NextResponse.json(
        { success: false, error: scrapedData.error },
        { status: 400 }
      )
    }

    console.log("🤖 Normalizing candidate data with Gemini AI...")
    
    // Normalize with Gemini AI
    let normalizedData = scrapedData.data
    try {
      const geminiResult = await normalizeCandidateDataWithGemini(scrapedData.data!, scrapedData.rawText!)
      if (geminiResult) {
        normalizedData = geminiResult
        console.log("✅ Gemini normalization successful")
      }
    } catch (error) {
      console.warn("⚠️ Gemini normalization failed, using scraped data:", error)
    }

    // Create candidate record
    const candidateId = crypto.randomUUID()
    const candidateRecord = {
      id: candidateId,
      name: normalizedData?.name || 'Unknown Candidate',
      email: normalizedData?.email || `candidate_${Date.now()}@temp.com`,
      phone: normalizedData?.phone || null,
      location: normalizedData?.location || null,
      skills: normalizedData?.skills || [],
      experience_years: normalizedData?.experience_years || 0,
      education: normalizedData?.education || null,
      degree: normalizedData?.degree || null,
      university: normalizedData?.university || null,
      graduation_year: normalizedData?.graduation_year || null,
      summary: normalizedData?.summary || null,
      linkedin_url: url.includes('linkedin.com') ? url : normalizedData?.linkedin_url || null,
      portfolio_url: normalizedData?.portfolio_url || null,
      github_url: normalizedData?.github_url || null,
      languages: normalizedData?.languages || ['English'],
      certifications: normalizedData?.certifications || [],
      salary_expectation_min: normalizedData?.salary_expectation_min || null,
      salary_expectation_max: normalizedData?.salary_expectation_max || null,
      visa_status: normalizedData?.visa_status || null,
      availability: normalizedData?.availability || 'available',
      status: 'active',
      source: 'url_scrape',
      tags: ['scraped', getSourceTag(url)],
      organisation_id: (await getOrgId()) || ""
    }

    // Save candidate to database
    const { data: candidate, error: candidateError } = await (supabase as any)
      .from('candidates')
      .insert([candidateRecord])
      .select()
      .single()

    if (candidateError) {
      console.error("❌ Failed to save candidate:", candidateError)
      return NextResponse.json(
        { success: false, error: "Failed to save candidate profile" },
        { status: 500 }
      )
    }

    console.log(`✅ Candidate saved: ${candidate.id}`)

    return NextResponse.json({
      success: true,
      candidate: candidate,
      message: "Profile scraped and processed successfully"
    })

  } catch (error: any) {
    console.error("❌ Scrape Candidate API Error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "An unexpected error occurred" 
      },
      { status: 500 }
    )
  }
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

function getSourceTag(url: string): string {
  if (url.includes('linkedin.com')) return 'linkedin'
  if (url.includes('github.com')) return 'github'
  if (url.includes('indeed.com')) return 'indeed'
  if (url.includes('glassdoor.com')) return 'glassdoor'
  return 'web'
}

async function scrapeProfile(url: string): Promise<{
  success: boolean
  data?: CandidateData
  rawText?: string
  error?: string
}> {
  try {
    console.log(`🌐 Fetching content from: ${url}`)

    // Fetch the page content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch URL: ${response.status} ${response.statusText}`
      }
    }

    const html = await response.text()
    
    if (!html || html.length < 100) {
      return {
        success: false,
        error: "No content found at the provided URL"
      }
    }

    // Extract text content from HTML
    const rawText = extractTextFromHtml(html)
    
    if (!rawText || rawText.length < 50) {
      return {
        success: false,
        error: "Insufficient content found on the page"
      }
    }

    console.log(`📄 Extracted ${rawText.length} characters from page`)

    // Parse candidate data from the extracted text
    let candidateData: CandidateData
    
    if (url.includes('linkedin.com')) {
      candidateData = parseLinkedInProfile(rawText, html)
    } else {
      candidateData = parseGenericProfile(rawText, url)
    }

    return {
      success: true,
      data: candidateData,
      rawText: rawText
    }

  } catch (error: any) {
    console.error("❌ Scraping error:", error)
    return {
      success: false,
      error: `Failed to scrape profile: ${error.message}`
    }
  }
}

function extractTextFromHtml(html: string): string {
  // Remove script and style content
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '')
  
  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, ' ')
  
  // Clean up whitespace and decode HTML entities
  text = text.replace(/\s+/g, ' ')
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  
  return text.trim()
}

function parseLinkedInProfile(text: string, html: string): CandidateData {
  const lowerText = text.toLowerCase()
  
  return {
    name: extractNameFromLinkedIn(text, html),
    location: extractLocationFromLinkedIn(text),
    skills: extractSkillsFromLinkedIn(lowerText),
    experience_years: extractExperienceFromLinkedIn(lowerText),
    education: extractEducationFromLinkedIn(text),
    summary: extractSummaryFromLinkedIn(text),
    linkedin_url: extractLinkedInUrl(html),
    languages: ['English'], // Default, could be enhanced
    availability: 'available'
  }
}

function parseGenericProfile(text: string, url: string): CandidateData {
  const lowerText = text.toLowerCase()
  
  return {
    name: extractGenericName(text),
    email: extractGenericEmail(text),
    location: extractGenericLocation(text),
    skills: extractGenericSkills(lowerText),
    experience_years: extractGenericExperience(lowerText),
    education: extractGenericEducation(text),
    summary: extractGenericSummary(text),
    portfolio_url: url,
    github_url: url.includes('github.com') ? url : undefined,
    languages: ['English'],
    availability: 'available'
  }
}

// LinkedIn-specific extraction functions
function extractNameFromLinkedIn(text: string, html: string): string {
  // Try to find name in HTML first (more reliable)
  const namePatterns = [
    /<title>([^|]*?)\s*\|\s*LinkedIn<\/title>/i,
    /property="og:title".*?content="([^"]*?)"/i,
    /class="[^"]*?name[^"]*?"[^>]*>([^<]{2,50})</i
  ]
  
  for (const pattern of namePatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const name = match[1].trim()
      if (name.length > 2 && name.length < 100 && !name.includes('LinkedIn')) {
        return name
      }
    }
  }
  
  // Fallback to text extraction
  return extractGenericName(text)
}

function extractLocationFromLinkedIn(text: string): string {
  const locationPatterns = [
    /([A-Z][a-zA-Z\s]+,\s*[A-Z][A-Z])/,
    /([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)/,
    /location[:\s]+([^\n]{5,50})/i
  ]
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  return ""
}

function extractSkillsFromLinkedIn(lowerText: string): string[] {
  const commonSkills = [
    'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue',
    'node.js', 'express', 'mongodb', 'sql', 'mysql', 'postgresql',
    'html', 'css', 'git', 'docker', 'kubernetes', 'aws', 'azure',
    'project management', 'leadership', 'communication', 'teamwork',
    'marketing', 'sales', 'design', 'analytics', 'strategy'
  ]
  
  const foundSkills: string[] = []
  
  // Look for skills section
  const skillsSection = lowerText.match(/skills[\s\S]{0,1000}?(?=\n\n|experience|education|$)/i)
  const searchText = skillsSection ? skillsSection[0] : lowerText
  
  for (const skill of commonSkills) {
    if (searchText.includes(skill)) {
      foundSkills.push(skill)
    }
  }
  
  return foundSkills
}

function extractExperienceFromLinkedIn(lowerText: string): number {
  // Look for years of experience or calculate from job history
  const yearPatterns = [
    /(\d+)\+?\s*years?\s*(?:of\s*)?experience/,
    /experience:\s*(\d+)\s*years?/
  ]
  
  for (const pattern of yearPatterns) {
    const match = lowerText.match(pattern)
    if (match && match[1]) {
      return parseInt(match[1], 10)
    }
  }
  
  // Try to calculate from job dates (simplified)
  const dateMatches = lowerText.match(/\d{4}/g)
  if (dateMatches && dateMatches.length >= 2) {
    const years = dateMatches.map(y => parseInt(y, 10))
    const minYear = Math.min(...years.filter(y => y >= 1990 && y <= new Date().getFullYear()))
    const currentYear = new Date().getFullYear()
    if (minYear && currentYear - minYear > 0) {
      return Math.min(currentYear - minYear, 50) // Cap at 50 years
    }
  }
  
  return 0
}

function extractEducationFromLinkedIn(text: string): string {
  const educationPatterns = [
    /(bachelor|master|phd|doctorate|ba|bs|ma|ms|mba).*?(?:in|of)\s*([^\n]{5,100})/i,
    /(university|college|institute).*?([^\n]{10,100})/i,
    /education[\s\S]{0,500}?(bachelor|master|university|college)[\s\S]{0,200}?([^\n]{10,100})/i
  ]
  
  for (const pattern of educationPatterns) {
    const match = text.match(pattern)
    if (match) {
      return match[0].trim().substring(0, 200)
    }
  }
  
  return ""
}

function extractSummaryFromLinkedIn(text: string): string {
  const summaryPatterns = [
    /about[\s\S]{0,50}?([\s\S]{50,1000}?)(?=\n\n|experience|education|skills|$)/i,
    /summary[\s\S]{0,50}?([\s\S]{50,800}?)(?=\n\n|experience|education|$)/i
  ]
  
  for (const pattern of summaryPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim().substring(0, 500)
    }
  }
  
  return ""
}

function extractLinkedInUrl(html: string): string {
  const urlPattern = /linkedin\.com\/in\/[A-Za-z0-9\-_]+/i
  const match = html.match(urlPattern)
  return match ? `https://${match[0]}` : ""
}

// Generic extraction functions (reuse from upload-cv)
function extractGenericName(text: string): string {
  const namePatterns = [
    /^([A-Z][a-zA-Z\s]{2,40})\n/,
    /<title>([^<]{2,50})/i,
    /name[:\s]+([A-Z][a-zA-Z\s]{2,40})/i,
    /^([A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+)/
  ]
  
  for (const pattern of namePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const name = match[1].trim()
      if (name.length >= 3 && name.length <= 50 && !/portfolio|resume|cv|website/i.test(name)) {
        return name
      }
    }
  }
  
  return ""
}

function extractGenericEmail(text: string): string {
  const emailPattern = /[\w\.-]+@[\w\.-]+\.\w+/
  const match = text.match(emailPattern)
  return match ? match[0] : ""
}

function extractGenericLocation(text: string): string {
  const locationPatterns = [
    /(?:location|based in|from):\s*([^\n]{5,50})/i,
    /\b([A-Z][a-zA-Z\s]{2,30},\s*[A-Z]{2,3})\b/,
    /\b([A-Z][a-zA-Z\s]{2,30})\s*,\s*([A-Z][a-zA-Z\s]{2,30})\b/
  ]
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  return ""
}

function extractGenericSkills(lowerText: string): string[] {
  const commonSkills = [
    'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue',
    'node.js', 'express', 'mongodb', 'sql', 'mysql', 'postgresql',
    'html', 'css', 'git', 'docker', 'kubernetes', 'aws', 'azure',
    'project management', 'leadership', 'communication', 'design'
  ]
  
  const foundSkills: string[] = []
  
  for (const skill of commonSkills) {
    if (lowerText.includes(skill)) {
      foundSkills.push(skill)
    }
  }
  
  return foundSkills
}

function extractGenericExperience(lowerText: string): number {
  const yearPatterns = [
    /(\d+)\+?\s*years?\s*(?:of\s*)?experience/,
    /experience:\s*(\d+)\s*years?/
  ]
  
  for (const pattern of yearPatterns) {
    const match = lowerText.match(pattern)
    if (match && match[1]) {
      return parseInt(match[1], 10)
    }
  }
  
  return 0
}

function extractGenericEducation(text: string): string {
  const educationPatterns = [
    /(bachelor|master|phd|doctorate).*?(?:in|of)\s*([^\n]{5,100})/i,
    /(university|college|institute).*?([^\n]{10,100})/i
  ]
  
  for (const pattern of educationPatterns) {
    const match = text.match(pattern)
    if (match) {
      return match[0].trim().substring(0, 200)
    }
  }
  
  return ""
}

function extractGenericSummary(text: string): string {
  const summaryPatterns = [
    /(?:about|summary|bio):\s*([\s\S]{50,500}?)(?:\n\n|$)/i,
    /^([\s\S]{50,300}?)(?:\n\n|skills|experience|education|$)/i
  ]
  
  for (const pattern of summaryPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim().substring(0, 500)
    }
  }
  
  return ""
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
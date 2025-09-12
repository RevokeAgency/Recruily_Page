/**
 * File parsing utility for job description files
 * Supports PDF, DOCX, and TXT file formats
 */

import { normalizeJobDataWithGemini } from '@/lib/gemini-ai'
import { 
  extractApplicationDeadline,
  extractJobType,
  extractExperienceLevel 
} from '@/lib/scraper'

// Types for extracted job data
export interface ParsedJobData {
  title?: string
  company?: string
  location?: string
  description?: string
  requirements?: string
  skills?: string[]
  employmentType?: string
  experienceLevel?: string
  salary?: string
  applicationDeadline?: string
}

export interface FileParseResult {
  success: boolean
  data?: ParsedJobData
  rawText?: string
  error?: string
}

/**
 * Main file parsing function
 * @param file - File object to parse
 * @returns Promise with parsing result
 */
export async function parseJobDescriptionFile(file: File): Promise<FileParseResult> {
  try {
    console.log(`📄 Parsing file: ${file.name} (${file.type})`)
    
    // Validate file type
    if (!isValidFileType(file)) {
      return {
        success: false,
        error: "Unsupported file type. Please upload a PDF, DOCX, or TXT file."
      }
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: "File too large. Please upload a file smaller than 10MB."
      }
    }

    let rawText: string = ""

    // Parse based on file type
    if (file.type === "text/plain" || file.name.endsWith('.txt')) {
      rawText = await parseTxtFile(file)
    } else if (file.type === "application/pdf" || file.name.endsWith('.pdf')) {
      rawText = await parsePdfFile(file)
    } else if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith('.docx')
    ) {
      rawText = await parseDocxFile(file)
    } else {
      return {
        success: false,
        error: "Unsupported file format. Please upload a PDF, DOCX, or TXT file."
      }
    }

    if (!rawText.trim()) {
      return {
        success: false,
        error: "No text content found in the file."
      }
    }

    console.log(`✅ Successfully extracted ${rawText.length} characters from file`)

    // Parse structured data from raw text
    let parsedData = parseJobDataFromText(rawText)

    // Apply Gemini normalization for consistency
    console.log("🤖 Normalizing parsed file data with Gemini AI...")
    try {
      const normalizedData = await normalizeJobDataWithGemini(parsedData, rawText)
      if (normalizedData) {
        parsedData = normalizedData
        console.log("✅ Gemini normalization applied to parsed file data")
      } else {
        console.log("⚠️ Using original parsed data (Gemini normalization failed)")
      }
    } catch (error) {
      console.warn("⚠️ Gemini normalization error, using original parsed data:", error)
    }

    return {
      success: true,
      data: parsedData,
      rawText: rawText
    }

  } catch (error: any) {
    console.error("❌ File parsing error:", error)
    return {
      success: false,
      error: `Failed to parse file: ${error.message}`
    }
  }
}

/**
 * Check if file type is supported
 */
function isValidFileType(file: File): boolean {
  const validTypes = [
    "text/plain",
    "application/pdf", 
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ]
  
  const validExtensions = ['.txt', '.pdf', '.docx']
  
  return validTypes.includes(file.type) || 
         validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
}

/**
 * Parse TXT file
 */
async function parseTxtFile(file: File): Promise<string> {
  const text = await file.text()
  return text
}

/**
 * Parse PDF file using PDF.js
 * For now, we'll use a simple approach that works in the browser
 */
async function parsePdfFile(file: File): Promise<string> {
  try {
    // Import PDF.js dynamically to avoid SSR issues
    const pdfjsLib = await import('pdfjs-dist')
    
    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
    
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise
    let fullText = ""
    
    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      fullText += pageText + ' '
    }
    
    return fullText.trim()
  } catch (error: any) {
    console.error("PDF parsing error:", error)
    throw new Error("Failed to parse PDF. Please ensure the file is not corrupted.")
  }
}

/**
 * Parse DOCX file using mammoth.js
 */
async function parseDocxFile(file: File): Promise<string> {
  try {
    // Import mammoth dynamically
    const mammoth = await import('mammoth')
    
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    
    return result.value
  } catch (error: any) {
    console.error("DOCX parsing error:", error)
    throw new Error("Failed to parse DOCX file. Please ensure the file is not corrupted.")
  }
}

/**
 * Parse structured job data from raw text
 * Uses pattern matching and NLP techniques to extract job information
 */
function parseJobDataFromText(text: string): ParsedJobData {
  const cleanText = text.replace(/\s+/g, ' ').trim()
  const lowerText = cleanText.toLowerCase()
  
  const parsedData: ParsedJobData = {}

  // Extract basic job information
  parsedData.title = extractJobTitle(cleanText)
  parsedData.company = extractCompanyName(cleanText)
  parsedData.location = extractLocation(cleanText)
  parsedData.employmentType = extractJobType(cleanText) || extractEmploymentType(lowerText)
  parsedData.experienceLevel = extractExperienceLevel(cleanText) || extractExperienceLevelLegacy(lowerText)
  parsedData.salary = extractSalary(cleanText)
  parsedData.skills = extractSkills(lowerText)
  
  // Extract enhanced job information using new extractors
  parsedData.applicationDeadline = extractApplicationDeadline(cleanText)
  
  // Split description and requirements
  const { description, requirements } = splitDescriptionAndRequirements(cleanText)
  parsedData.description = description
  parsedData.requirements = requirements

  return parsedData
}

/**
 * Extract job title from text
 */
function extractJobTitle(text: string): string {
  const titlePatterns = [
    /(?:job title|position|title|role):\s*([^\n\r.]{10,100})/i,
    /^([^\n\r]{10,80})(?:\n|\r|$)/m, // First line if reasonable length
    /hiring\s+(?:a|an)?\s*([^\n\r.]{10,80})/i,
    /seeking\s+(?:a|an)?\s*([^\n\r.]{10,80})/i,
  ]
  
  for (const pattern of titlePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const title = match[1].trim()
      // Validate title (should contain job-related keywords)
      if (title.length >= 10 && title.length <= 100 && 
          /\b(developer|engineer|manager|analyst|coordinator|specialist|director|lead|senior|junior)\b/i.test(title)) {
        return title
      }
    }
  }
  
  return ""
}

/**
 * Extract company name from text
 */
function extractCompanyName(text: string): string {
  const companyPatterns = [
    /(?:company|employer|organization):\s*([^\n\r.]{2,50})/i,
    /(?:at|with|join)\s+([A-Z][a-zA-Z\s&.,]{2,49})(?:\s+(?:inc|llc|ltd|corp|corporation|company)\.?)?/g,
    /([A-Z][a-zA-Z\s&.,]{2,49})\s+(?:inc|llc|ltd|corp|corporation|company)\.?/gi,
  ]
  
  for (const pattern of companyPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  return ""
}

/**
 * Extract location from text
 */
function extractLocation(text: string): string {
  const locationPatterns = [
    /(?:location|based in|office in):\s*([^\n\r.]{5,50})/i,
    /\b([A-Z][a-zA-Z\s]{2,30},\s*[A-Z]{2,3})\b/g, // City, State format
    /\b(remote|hybrid|on-site)\b/gi,
    /\b([A-Z][a-zA-Z\s]{2,30})\s+office\b/i,
  ]
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  return ""
}

/**
 * Extract employment type
 */
function extractEmploymentType(lowerText: string): string {
  if (lowerText.includes('full-time') || lowerText.includes('full time')) return 'full-time'
  if (lowerText.includes('part-time') || lowerText.includes('part time')) return 'part-time'
  if (lowerText.includes('contract') || lowerText.includes('contractor')) return 'contract'
  if (lowerText.includes('internship') || lowerText.includes('intern')) return 'internship'
  if (lowerText.includes('freelance') || lowerText.includes('freelancer')) return 'freelance'
  
  return 'full-time' // default
}

/**
 * Extract experience level (legacy function)
 */
function extractExperienceLevelLegacy(lowerText: string): string {
  if (lowerText.includes('senior') || lowerText.includes('sr.') || lowerText.includes('lead')) return 'senior-level'
  if (lowerText.includes('junior') || lowerText.includes('jr.') || lowerText.includes('entry')) return 'entry-level'
  if (lowerText.includes('mid') || lowerText.includes('intermediate')) return 'mid-level'
  if (lowerText.includes('executive') || lowerText.includes('director') || lowerText.includes('vp')) return 'executive'
  
  return 'mid-level' // default
}

/**
 * Extract salary information
 */
function extractSalary(text: string): string {
  const salaryPatterns = [
    /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:-|to)\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
    /salary:\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:-|to)?\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)?/i,
    /\$\s*(\d{1,3}(?:,\d{3})*)/g,
  ]
  
  for (const pattern of salaryPatterns) {
    const match = text.match(pattern)
    if (match) {
      return match[0].trim()
    }
  }
  
  return ""
}

/**
 * Extract skills from text
 */
function extractSkills(lowerText: string): string[] {
  const commonSkills = [
    'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue', 
    'node.js', 'nodejs', 'express', 'mongodb', 'sql', 'mysql', 'postgresql',
    'html', 'css', 'git', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
    'redux', 'graphql', 'rest api', 'microservices', 'agile', 'scrum',
    'figma', 'photoshop', 'illustrator', 'sketch', 'analytics', 'seo',
    'marketing', 'sales', 'project management', 'leadership', 'communication'
  ]
  
  const foundSkills: string[] = []
  
  for (const skill of commonSkills) {
    if (lowerText.includes(skill)) {
      foundSkills.push(skill)
    }
  }
  
  // Extract skills from common sections
  const skillSectionRegex = /(?:skills|technologies|tools|requirements)[\s\S]*?(?:\n\n|$)/gi
  const skillSections = lowerText.match(skillSectionRegex) || []
  
  for (const section of skillSections) {
    for (const skill of commonSkills) {
      if (section.includes(skill) && !foundSkills.includes(skill)) {
        foundSkills.push(skill)
      }
    }
  }
  
  return foundSkills
}

/**
 * Split text into description and requirements sections
 */
function splitDescriptionAndRequirements(text: string): { description: string; requirements: string } {
  const requirementsKeywords = [
    'requirements', 'qualifications', 'skills required', 'must have',
    'experience required', 'necessary skills', 'prerequisites'
  ]
  
  let splitPoint = -1
  
  // Find the first requirements section
  for (const keyword of requirementsKeywords) {
    const index = text.toLowerCase().indexOf(keyword)
    if (index !== -1 && (splitPoint === -1 || index < splitPoint)) {
      splitPoint = index
    }
  }
  
  if (splitPoint !== -1) {
    return {
      description: text.substring(0, splitPoint).trim(),
      requirements: text.substring(splitPoint).trim()
    }
  }
  
  // If no clear split, try to detect bullet points or numbered lists that might be requirements
  const bulletPointRegex = /\n\s*[•\-\*\d+\.]\s/
  const bulletMatch = text.search(bulletPointRegex)
  
  if (bulletMatch !== -1) {
    return {
      description: text.substring(0, bulletMatch).trim(),
      requirements: text.substring(bulletMatch).trim()
    }
  }
  
  // If no clear structure, put everything in description
  return {
    description: text.trim(),
    requirements: ""
  }
}
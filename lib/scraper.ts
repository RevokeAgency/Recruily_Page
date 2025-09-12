/**
 * Web scraping utility for job postings
 * Interfaces with the existing /api/scrape-url endpoint
 */

export interface ScrapedJobData {
  title?: string
  company?: string
  location?: string
  description?: string
  requirements?: string
  skills?: string[]
  employmentType?: string
  experienceLevel?: string
  salary?: string
  siteType?: string
}

export interface ScrapeResult {
  success: boolean
  data?: ScrapedJobData
  rawContent?: string
  error?: string
  siteType?: string
}

/**
 * Scrape job data from a URL
 * @param url - Job posting URL to scrape
 * @returns Promise with scraping result
 */
export async function scrapeJobFromUrl(url: string): Promise<ScrapeResult> {
  try {
    console.log(`🌐 Scraping job from URL: ${url}`)

    // Validate URL format
    if (!isValidUrl(url)) {
      return {
        success: false,
        error: "Please provide a valid URL (must start with http:// or https://)"
      }
    }

    // Call the existing scrape-url API
    const response = await fetch('/api/scrape-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: Failed to scrape URL`
      }
    }

    const result = await response.json()

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to scrape content from URL"
      }
    }

    console.log(`✅ Successfully scraped content (${result.length} characters)`)

    // Parse the scraped content into structured job data
    const jobData = parseScrapedContent(result.content, result.structuredData, result.siteType)

    return {
      success: true,
      data: jobData,
      rawContent: result.content,
      siteType: result.siteType
    }

  } catch (error: any) {
    console.error("❌ Scraping error:", error)
    return {
      success: false,
      error: `Failed to scrape URL: ${error.message}`
    }
  }
}

/**
 * Validate if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return ['http:', 'https:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}

/**
 * Parse scraped content into structured job data
 * Combines structured data from the scraper with additional parsing
 */
function parseScrapedContent(
  content: string, 
  structuredData: any, 
  siteType: string
): ScrapedJobData {
  const jobData: ScrapedJobData = {
    siteType
  }

  console.log("🔍 Processing scraped content for job data extraction")
  
  // Use structured data first (from site-specific selectors and JSON-LD)
  if (structuredData) {
    if (structuredData.title) {
      jobData.title = cleanText(structuredData.title)
      console.log("📝 Title from structured data:", jobData.title)
    }
    if (structuredData.company) {
      jobData.company = cleanText(structuredData.company)
      console.log("🏢 Company from structured data:", jobData.company)
    }
    if (structuredData.location) {
      jobData.location = cleanText(structuredData.location)
      console.log("📍 Location from structured data:", jobData.location)
    }
    if (structuredData.description) {
      jobData.description = cleanText(structuredData.description)
      console.log("📄 Description from structured data (length):", jobData.description.length)
    }
  }

  // If no structured data or missing fields, parse from content
  const contentLower = content.toLowerCase()

  // Extract title if not found - with enhanced patterns
  if (!jobData.title) {
    jobData.title = extractTitleFromContent(content)
    if (jobData.title) console.log("📝 Title from content extraction:", jobData.title)
  }

  // Extract company if not found - with enhanced patterns
  if (!jobData.company) {
    jobData.company = extractCompanyFromContent(content)
    if (jobData.company) console.log("🏢 Company from content extraction:", jobData.company)
  }

  // Extract location if not found - with enhanced patterns
  if (!jobData.location) {
    jobData.location = extractLocationFromContent(content)
    if (jobData.location) console.log("📍 Location from content extraction:", jobData.location)
  }

  // Extract employment type
  jobData.employmentType = extractEmploymentType(contentLower)

  // Extract experience level
  jobData.experienceLevel = extractExperienceLevel(contentLower)

  // Extract salary information
  jobData.salary = extractSalary(content)

  // Extract skills
  jobData.skills = extractSkills(contentLower)
  if (jobData.skills.length > 0) {
    console.log("🏷️ Extracted skills:", jobData.skills.join(', '))
  }

  // Enhanced description and requirements extraction
  if (jobData.description && jobData.description.length > 500) {
    const { description, requirements } = splitDescriptionAndRequirements(jobData.description)
    jobData.description = description
    jobData.requirements = requirements
    console.log("📄 Split long description into description + requirements")
  } else if (!jobData.description || jobData.description.length < 100) {
    // Extract description and requirements from content
    const { description, requirements } = extractDescriptionAndRequirements(content)
    if (description) {
      jobData.description = description
      console.log("📄 Extracted description from content (length):", description.length)
    }
    if (requirements) {
      jobData.requirements = requirements
      console.log("📋 Extracted requirements from content (length):", requirements.length)
    }
  }

  // Ensure we have some description
  if (!jobData.description || jobData.description.length < 50) {
    // Fallback: use first part of content as description
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20)
    if (sentences.length > 0) {
      jobData.description = sentences.slice(0, 3).join('. ').trim() + '.'
      console.log("📄 Used fallback description from content sentences")
    }
  }

  // Log final extraction summary
  console.log("✅ Job data extraction complete:", {
    title: !!jobData.title,
    company: !!jobData.company,
    location: !!jobData.location,
    description: jobData.description ? jobData.description.length : 0,
    requirements: jobData.requirements ? jobData.requirements.length : 0,
    salary: !!jobData.salary,
    employmentType: !!jobData.employmentType,
    experienceLevel: !!jobData.experienceLevel,
    skillsCount: jobData.skills ? jobData.skills.length : 0
  })

  return jobData
}

/**
 * Clean extracted text
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .substring(0, 500) // Limit length
}

/**
 * Extract job title from content
 */
function extractTitleFromContent(content: string): string {
  const titlePatterns = [
    /job\s+title[:\s]+([^\n\r]{10,80})/i,
    /position[:\s]+([^\n\r]{10,80})/i,
    /role[:\s]+([^\n\r]{10,80})/i,
    /hiring\s+(?:a|an)?\s*([^\n\r]{10,80})/i,
    /seeking\s+(?:a|an)?\s*([^\n\r]{10,80})/i,
  ]

  for (const pattern of titlePatterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      const title = cleanText(match[1])
      if (isValidJobTitle(title)) {
        return title
      }
    }
  }

  return ""
}

/**
 * Check if extracted text looks like a job title
 */
function isValidJobTitle(title: string): boolean {
  const jobKeywords = [
    'developer', 'engineer', 'manager', 'analyst', 'coordinator', 'specialist',
    'director', 'lead', 'senior', 'junior', 'associate', 'assistant', 'intern',
    'architect', 'designer', 'consultant', 'administrator', 'technician'
  ]

  return jobKeywords.some(keyword => 
    title.toLowerCase().includes(keyword)
  ) && title.length >= 10 && title.length <= 100
}

/**
 * Extract company from content
 */
function extractCompanyFromContent(content: string): string {
  const companyPatterns = [
    /company[:\s]+([^\n\r]{2,50})/i,
    /employer[:\s]+([^\n\r]{2,50})/i,
    /organization[:\s]+([^\n\r]{2,50})/i,
    /at\s+([A-Z][a-zA-Z\s&.,]{2,49})(?:\s+(?:inc|llc|ltd|corp|corporation|company)\.?)?/g,
    /([A-Z][a-zA-Z\s&.,]{2,49})\s+(?:inc|llc|ltd|corp|corporation|company)\.?/gi,
  ]

  for (const pattern of companyPatterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      return cleanText(match[1])
    }
  }

  return ""
}

/**
 * Extract location from content
 */
function extractLocationFromContent(content: string): string {
  const locationPatterns = [
    /location[:\s]+([^\n\r]{5,50})/i,
    /based\s+in[:\s]+([^\n\r]{5,50})/i,
    /office\s+in[:\s]+([^\n\r]{5,50})/i,
    /\b([A-Z][a-zA-Z\s]{2,30},\s*[A-Z]{2,3})\b/g, // City, State format
    /\b(remote|hybrid|on-site)\b/gi,
  ]

  for (const pattern of locationPatterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      return cleanText(match[1])
    }
  }

  return ""
}

/**
 * Extract employment type from content
 */
function extractEmploymentType(lowerContent: string): string {
  if (lowerContent.includes('full-time') || lowerContent.includes('full time')) return 'full-time'
  if (lowerContent.includes('part-time') || lowerContent.includes('part time')) return 'part-time'
  if (lowerContent.includes('contract') || lowerContent.includes('contractor')) return 'contract'
  if (lowerContent.includes('internship') || lowerContent.includes('intern')) return 'internship'
  if (lowerContent.includes('freelance') || lowerContent.includes('freelancer')) return 'freelance'
  
  return 'full-time' // default
}

/**
 * Extract experience level from content
 */
function extractExperienceLevel(lowerContent: string): string {
  if (lowerContent.includes('senior') || lowerContent.includes('sr.') || lowerContent.includes('lead')) return 'senior-level'
  if (lowerContent.includes('junior') || lowerContent.includes('jr.') || lowerContent.includes('entry')) return 'entry-level'
  if (lowerContent.includes('mid') || lowerContent.includes('intermediate')) return 'mid-level'
  if (lowerContent.includes('executive') || lowerContent.includes('director') || lowerContent.includes('vp')) return 'executive'
  
  return 'mid-level' // default
}

/**
 * Extract salary information from content
 */
function extractSalary(content: string): string {
  const salaryPatterns = [
    // Comprehensive salary patterns with k/K support
    /\$\s*(\d{1,3}(?:,?\d{3})*(?:k|K)?)\s*(?:-|to|–|—)\s*\$?\s*(\d{1,3}(?:,?\d{3})*(?:k|K)?)/g,
    /salary[:\s]*\$?\s*(\d{1,3}(?:,?\d{3})*(?:k|K)?)\s*(?:-|to|–|—)?\s*\$?\s*(\d{1,3}(?:,?\d{3})*(?:k|K)?)?/i,
    /compensation[:\s]*\$?\s*(\d{1,3}(?:,?\d{3})*(?:k|K)?)\s*(?:-|to|–|—)?\s*\$?\s*(\d{1,3}(?:,?\d{3})*(?:k|K)?)?/i,
    /pay[:\s]*\$?\s*(\d{1,3}(?:,?\d{3})*(?:k|K)?)\s*(?:-|to|–|—)?\s*\$?\s*(\d{1,3}(?:,?\d{3})*(?:k|K)?)?/i,
    /wage[:\s]*\$?\s*(\d{1,3}(?:,?\d{3})*(?:k|K)?)\s*(?:-|to|–|—)?\s*\$?\s*(\d{1,3}(?:,?\d{3})*(?:k|K)?)?/i,
    // Range without currency symbols
    /(\d{1,3}(?:,?\d{3})*(?:k|K)?)\s*(?:-|to|–|—)\s*(\d{1,3}(?:,?\d{3})*(?:k|K)?)/g,
    // Single salary with currency
    /\$\s*(\d{1,3}(?:,?\d{3})*(?:k|K)?)/g,
    // Annual salary patterns
    /(\d{1,3}(?:,?\d{3})*(?:k|K)?)\s*(?:per year|annually|\/year|pa)/gi,
  ]

  for (const pattern of salaryPatterns) {
    const matches = [...content.matchAll(pattern)]
    if (matches.length > 0) {
      const match = matches[0]
      const salaryText = cleanText(match[0])
      console.log("💰 Salary pattern matched:", salaryText)
      return salaryText
    }
  }

  console.log("⚠️ No salary information found in content")
  return ""
}

/**
 * Extract skills from content
 */
function extractSkills(lowerContent: string): string[] {
  const commonSkills = [
    'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue', 
    'node.js', 'nodejs', 'express', 'mongodb', 'sql', 'mysql', 'postgresql',
    'html', 'css', 'git', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
    'redux', 'graphql', 'rest api', 'microservices', 'agile', 'scrum',
    'figma', 'photoshop', 'illustrator', 'sketch', 'analytics', 'seo',
    'marketing', 'sales', 'project management', 'leadership', 'communication',
    'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'flutter',
    'django', 'flask', 'spring', 'laravel', 'rails', 'nextjs', 'nuxt',
    'tensorflow', 'pytorch', 'machine learning', 'ai', 'data science'
  ]

  const foundSkills: string[] = []

  for (const skill of commonSkills) {
    if (lowerContent.includes(skill)) {
      foundSkills.push(skill)
    }
  }

  return foundSkills
}

/**
 * Extract description and requirements from content
 */
function extractDescriptionAndRequirements(content: string): { description: string; requirements: string } {
  const sections = identifyJobSections(content)
  
  return {
    description: sections.description || content.substring(0, 1000).trim(),
    requirements: sections.requirements || ""
  }
}

/**
 * Split existing description into description and requirements
 */
function splitDescriptionAndRequirements(text: string): { description: string; requirements: string } {
  const requirementsKeywords = [
    'requirements', 'qualifications', 'skills required', 'must have',
    'experience required', 'necessary skills', 'prerequisites', 'what you need'
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

  // If no clear split, try to detect bullet points or numbered lists
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

/**
 * Identify different sections in job content
 */
function identifyJobSections(content: string): {
  description?: string
  requirements?: string
  benefits?: string
  responsibilities?: string
} {
  const sections: any = {}
  
  // Define section keywords
  const sectionPatterns = {
    description: [
      'job description', 'about the role', 'position overview', 'role description'
    ],
    requirements: [
      'requirements', 'qualifications', 'skills required', 'must have',
      'experience required', 'what you need', 'prerequisites'
    ],
    responsibilities: [
      'responsibilities', 'duties', 'what you will do', 'key responsibilities',
      'your role', 'day to day', 'tasks'
    ],
    benefits: [
      'benefits', 'what we offer', 'perks', 'compensation package',
      'why join us', 'what you get'
    ]
  }

  const lowerContent = content.toLowerCase()

  for (const [sectionName, keywords] of Object.entries(sectionPatterns)) {
    for (const keyword of keywords) {
      const index = lowerContent.indexOf(keyword)
      if (index !== -1) {
        // Find the end of this section (next section or end of content)
        let endIndex = content.length
        
        // Look for the start of the next section
        for (const [otherSection, otherKeywords] of Object.entries(sectionPatterns)) {
          if (otherSection !== sectionName) {
            for (const otherKeyword of otherKeywords) {
              const otherIndex = lowerContent.indexOf(otherKeyword, index + keyword.length)
              if (otherIndex !== -1 && otherIndex < endIndex) {
                endIndex = otherIndex
              }
            }
          }
        }

        sections[sectionName] = content.substring(index + keyword.length, endIndex)
          .replace(/^[:\-\s]+/, '') // Remove leading punctuation
          .trim()
        break
      }
    }
  }

  return sections
}

/**
 * Get popular job sites that are supported
 */
export function getSupportedJobSites(): string[] {
  return [
    'LinkedIn (linkedin.com)',
    'Indeed (indeed.com)',
    'Glassdoor (glassdoor.com)',
    'Company career pages',
    'Other job boards'
  ]
}

/**
 * Get site-specific tips for better scraping
 */
export function getScrapingTips(url: string): string[] {
  const hostname = new URL(url).hostname.toLowerCase()
  
  if (hostname.includes('linkedin')) {
    return [
      'Make sure you are logged into LinkedIn',
      'Use the direct job posting URL',
      'Some LinkedIn jobs may require premium access'
    ]
  }
  
  if (hostname.includes('indeed')) {
    return [
      'Use the full job posting URL (not search results)',
      'Indeed jobs work best with their direct links'
    ]
  }
  
  if (hostname.includes('glassdoor')) {
    return [
      'Glassdoor may require account login for full access',
      'Some job details might be behind authentication'
    ]
  }
  
  return [
    'Use the direct URL to the job posting',
    'Avoid search result pages or listing pages',
    'Make sure the page is publicly accessible'
  ]
}
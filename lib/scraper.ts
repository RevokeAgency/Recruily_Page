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

    // Parse the scraped content into structured job data with error handling
    try {
      const jobData = parseScrapedContent(result.content, result.structuredData, result.siteType)
      
      return {
        success: true,
        data: jobData,
        rawContent: result.content,
        siteType: result.siteType
      }
    } catch (parseError: any) {
      console.error("❌ Content parsing error:", parseError)
      return {
        success: false,
        error: `Failed to parse scraped content: ${parseError.message}. The URL content may have an unusual format.`
      }
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
      jobData.description = cleanHtmlContent(structuredData.description)
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

  // Enhanced description and requirements extraction with superior formatting
  const { description, requirements } = extractDescriptionAndRequirements(content, jobData.description)
  
  if (description) {
    jobData.description = cleanHtmlContent(description)
    console.log("📄 Processed description (length):", jobData.description.length)
  }
  
  if (requirements) {
    jobData.requirements = formatRequirementsList(requirements)
    console.log("📋 Extracted requirements (length):", jobData.requirements.length)
  }

  // Ensure we have some description - with better fallback
  if (!jobData.description || jobData.description.length < 50) {
    // Try to extract the main content/first substantial paragraph
    const cleanContent = cleanHtmlContent(content)
    const paragraphs = cleanContent.split(/\n\s*\n/).filter(p => p.trim().length > 100)
    
    if (paragraphs.length > 0) {
      jobData.description = paragraphs[0].trim()
      console.log("📄 Used first substantial paragraph as description")
    } else {
      // Last resort: use cleaned sentences
      const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 30)
      if (sentences.length > 0) {
        const fallbackText = sentences.slice(0, 4).join('. ').trim() + '.'
        jobData.description = cleanHtmlContent(fallbackText)
        console.log("📄 Used fallback description from content sentences")
      }
    }
  }
  
  // Ensure requirements are properly formatted if they exist
  if (jobData.requirements) {
    jobData.requirements = formatRequirementsList(jobData.requirements)
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
 * Clean extracted text and remove HTML tags
 */
function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .replace(/[\r\n]+/g, ' ') // Remove line breaks
    .trim()
    .substring(0, 500) // Limit length
}

/**
 * Clean HTML content and create well-structured, readable text
 */
function cleanHtmlContent(html: string): string {
  if (!html) return ''
  
  // Step 1: Clean HTML while preserving structure
  let cleaned = html
    // Remove script and style content completely
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    
    // Handle headers - convert to clean section breaks
    .replace(/<h[1-6][^>]*>([^<]*)<\/h[1-6]>/gi, '\n\n$1\n')
    
    // Handle paragraphs properly
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n')
    
    // Handle lists with proper spacing
    .replace(/<ul[^>]*>/gi, '\n\n')
    .replace(/<\/ul>/gi, '\n\n')
    .replace(/<ol[^>]*>/gi, '\n\n')
    .replace(/<\/ol>/gi, '\n\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (match, content) => {
      const cleanContent = content.replace(/<[^>]*>/g, '').trim()
      return cleanContent ? `\n• ${cleanContent}` : ''
    })
    
    // Handle other block elements
    .replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, '\n$1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<hr[^>]*>/gi, '\n\n---\n\n')
    
    // Remove all remaining HTML tags
    .replace(/<[^>]*>/g, '')
    
    // Clean HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&bull;/g, '•')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
  
  // Step 2: Normalize and structure the text
  return structureCleanText(cleaned)
}

/**
 * Structure clean text into well-organized, readable format
 */
function structureCleanText(text: string): string {
  if (!text) return ''
  
  // Step 1: Basic cleanup and normalization
  let structured = text
    // Remove excessive whitespace
    .replace(/[ \t]+/g, ' ') // Multiple spaces/tabs to single space
    .replace(/\n[ \t]+/g, '\n') // Remove spaces at line starts
    .replace(/[ \t]+\n/g, '\n') // Remove spaces at line ends
    
    // Normalize line breaks
    .replace(/\n{4,}/g, '\n\n\n') // Max 3 line breaks
    .replace(/\n\s*\n\s*\n\s*\n/g, '\n\n\n') // Clean multiple breaks
  
  // Step 2: Create proper paragraph structure
  const paragraphs = structured
    .split(/\n\s*\n\s*\n/) // Split on triple line breaks
    .map(section => section.trim())
    .filter(section => section.length > 0)
  
  // Step 3: Format each section properly
  const formattedSections = paragraphs.map(section => {
    return formatTextSection(section)
  })
  
  // Step 4: Join with proper spacing
  return formattedSections
    .filter(section => section.length > 0)
    .join('\n\n')
    .trim()
}

/**
 * Format individual text sections for optimal readability
 */
function formatTextSection(text: string): string {
  if (!text) return ''
  
  // Check if this section contains bullet points or lists
  const hasBullets = /^\s*[•\-\*\+]\s+/m.test(text)
  const hasNumbers = /^\s*\d+\.\s+/m.test(text)
  
  if (hasBullets || hasNumbers) {
    return formatListSection(text)
  } else {
    return formatParagraphSection(text)
  }
}

/**
 * Format paragraph sections with proper sentence structure
 */
function formatParagraphSection(text: string): string {
  return text
    // Fix sentence spacing
    .replace(/\.(?=[A-Z])/g, '. ')
    .replace(/\?(?=[A-Z])/g, '? ')
    .replace(/!(?=[A-Z])/g, '! ')
    
    // Handle line breaks within paragraphs
    .replace(/\n(?=[a-z])/g, ' ') // Join lines that don't start with capital
    .replace(/\n(?=[A-Z][^.])/g, ' ') // Join lines with capitals (not abbreviations)
    
    // Create proper sentences
    .replace(/([.!?])\s*(?=[A-Z])/g, '$1 ')
    
    // Clean up punctuation
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/([.!?])([A-Z])/g, '$1 $2')
    
    .trim()
}

/**
 * Format list sections with clean bullet points and proper spacing
 */
function formatListSection(text: string): string {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  const formattedLines: string[] = []
  
  for (const line of lines) {
    // Check if line is already a bullet point or number
    if (/^[•\-\*\+]\s+/.test(line)) {
      // Clean existing bullet
      const content = line.replace(/^[•\-\*\+]\s+/, '').trim()
      if (content) {
        formattedLines.push(`• ${capitalizeFirst(content)}`)
      }
    } else if (/^\d+\.\s+/.test(line)) {
      // Keep numbered items
      const match = line.match(/^(\d+)\.\s+(.+)$/)
      if (match) {
        formattedLines.push(`${match[1]}. ${capitalizeFirst(match[2].trim())}`)
      }
    } else if (line.length > 10) {
      // Convert regular lines to bullet points if they seem like list items
      if (isLikelyListItem(line)) {
        formattedLines.push(`• ${capitalizeFirst(line)}`)
      } else {
        // This might be a section header or paragraph
        formattedLines.push(capitalizeFirst(line))
      }
    }
  }
  
  return formattedLines.join('\n')
}

/**
 * Check if a line looks like a list item
 */
function isLikelyListItem(line: string): boolean {
  // Keywords that indicate list items
  const listKeywords = [
    /^(experience|knowledge|skill|ability|proficiency|familiar)/i,
    /^(bachelor|master|degree|certification|diploma)/i,
    /^(minimum|required|must|should|preferred)/i,
    /^(strong|excellent|good|solid|proven)/i,
    /\d+\+?\s*(years?|months?)\s+(of\s+)?(experience|exp)/i,
  ]
  
  return listKeywords.some(pattern => pattern.test(line.trim()))
}

/**
 * Capitalize first letter of text
 */
function capitalizeFirst(text: string): string {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Extract job title from content with enhanced patterns
 */
function extractTitleFromContent(content: string): string {
  const titlePatterns = [
    // Explicit title labels
    /job\s+title[:\s-]+([^\n\r<>{};]{10,100})/gi,
    /position\s+title[:\s-]+([^\n\r<>{};]{10,100})/gi,
    /role\s+title[:\s-]+([^\n\r<>{};]{10,100})/gi,
    /position[:\s-]+([^\n\r<>{};]{10,100})/gi,
    /role[:\s-]+([^\n\r<>{};]{10,100})/gi,
    
    // Hiring patterns
    /(?:hiring|seeking|looking\s+for)\s+(?:a|an)?\s*([^\n\r<>{};]{10,100})/gi,
    /we\s+are\s+(?:hiring|seeking|looking\s+for)\s+(?:a|an)?\s*([^\n\r<>{};]{10,100})/gi,
    /join\s+(?:us\s+)?as\s+(?:a|an)?\s*([^\n\r<>{};]{10,100})/gi,
    
    // Apply patterns
    /apply\s+(?:for\s+)?(?:the\s+)?(?:position\s+of\s+)?(?:a|an)?\s*([^\n\r<>{};]{10,100})/gi,
    
    // Title at beginning of content
    /^\s*([A-Z][^\n\r<>{};]{10,100})(?:\s*[-|:]|\n)/gm,
  ]

  const foundTitles: string[] = []

  for (const pattern of titlePatterns) {
    try {
      const matches = [...content.matchAll(pattern)]
      for (const match of matches) {
        if (match[1]) {
          const title = cleanText(match[1])
          if (isValidJobTitle(title) && !foundTitles.includes(title)) {
            foundTitles.push(title)
          }
        }
      }
    } catch (error) {
      continue
    }
  }

  // Return the best title found (prefer more specific job keywords)
  if (foundTitles.length > 0) {
    // Prioritize titles with job-specific keywords
    const specificTitles = foundTitles.filter(title => {
      const lower = title.toLowerCase()
      return ['engineer', 'developer', 'manager', 'analyst', 'designer', 'architect', 'specialist', 'coordinator', 'director', 'lead'].some(keyword => lower.includes(keyword))
    })
    
    if (specificTitles.length > 0) {
      return specificTitles[0]
    }
    
    return foundTitles[0]
  }

  return ""
}

/**
 * Check if extracted text looks like a job title
 */
function isValidJobTitle(title: string): boolean {
  if (!title || title.length < 5 || title.length > 120) return false
  
  const jobKeywords = [
    'developer', 'engineer', 'manager', 'analyst', 'coordinator', 'specialist',
    'director', 'lead', 'senior', 'junior', 'associate', 'assistant', 'intern',
    'architect', 'designer', 'consultant', 'administrator', 'technician',
    'officer', 'representative', 'executive', 'supervisor', 'operator',
    'programmer', 'scientist', 'researcher', 'professor', 'teacher', 'instructor',
    'clerk', 'agent', 'sales', 'marketing', 'finance', 'accountant',
    'nurse', 'doctor', 'therapist', 'counselor', 'coach', 'trainer'
  ]
  
  const jobTitlePatterns = [
    /\b(?:software|web|mobile|frontend|backend|full[\s-]?stack|data|devops|cloud|security|network|database|system)\b/i,
    /\b(?:ui|ux|product|project|program|operations|business|technical|customer|human\s+resources)\b/i,
    /\b(?:quality\s+assurance|qa|seo|digital|content|social\s+media)\b/i
  ]

  const lower = title.toLowerCase()
  
  // Check for job keywords
  const hasJobKeyword = jobKeywords.some(keyword => lower.includes(keyword))
  
  // Check for job title patterns
  const hasJobPattern = jobTitlePatterns.some(pattern => pattern.test(title))
  
  // Check if it starts with a capital letter (proper job title format)
  const properFormat = /^[A-Z]/.test(title)
  
  // Reject invalid patterns
  const invalidPatterns = [
    /^(and|or|the|is|are|was|were|will|can|could|should|would|must|may|might)\b/i,
    /\b(company|website|email|phone|address|location|salary|benefits|apply|application)\b/i,
    /^\d+$/, // Just numbers
    /^[^a-zA-Z]*$/, // No letters
  ]
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(title)) return false
  }
  
  return (hasJobKeyword || hasJobPattern) && properFormat
}

/**
 * Extract company from content with enhanced patterns
 */
function extractCompanyFromContent(content: string): string {
  const companyPatterns = [
    // Explicit company labels
    /company[:\s-]+([^\n\r<>{};]{2,60})/gi,
    /employer[:\s-]+([^\n\r<>{};]{2,60})/gi,
    /organization[:\s-]+([^\n\r<>{};]{2,60})/gi,
    /hiring\s+company[:\s-]+([^\n\r<>{};]{2,60})/gi,
    /about\s+(?:the\s+)?company[:\s-]+([^\n\r<>{};]{2,60})/gi,
    
    // Company name patterns
    /at\s+([A-Z][a-zA-Z\s&.,-]{2,49})(?:\s+(?:inc|llc|ltd|corp|corporation|company|group|solutions|technologies|systems)\.?)?\b/gi,
    /([A-Z][a-zA-Z\s&.,-]{2,49})\s+(?:inc|llc|ltd|corp|corporation|company|group|solutions|technologies|systems)\.?\b/gi,
    /([A-Z][a-zA-Z\s&.,-]{2,49})\s+(?:is\s+)?(?:seeking|looking\s+for|hiring)\b/gi,
    
    // Join patterns
    /join\s+(?:the\s+team\s+at\s+)?([A-Z][a-zA-Z\s&.,-]{2,49})\b/gi,
    /work\s+(?:at|for|with)\s+([A-Z][a-zA-Z\s&.,-]{2,49})\b/gi,
  ]

  const foundCompanies: string[] = []

  for (const pattern of companyPatterns) {
    try {
      const matches = [...content.matchAll(pattern)]
      for (const match of matches) {
        if (match[1]) {
          const company = cleanText(match[1])
          if (isValidCompany(company) && !foundCompanies.includes(company)) {
            foundCompanies.push(company)
          }
        }
      }
    } catch (error) {
      console.warn("⚠️ Company pattern error:", error.message)
      continue
    }
  }

  // Return the best company name found
  if (foundCompanies.length > 0) {
    // Prefer shorter, cleaner names
    return foundCompanies.reduce((best, current) => 
      current.length < best.length && current.length > 2 ? current : best
    )
  }

  return ""
}

/**
 * Validate if extracted text looks like a valid company name
 */
function isValidCompany(company: string): boolean {
  if (!company || company.length < 2 || company.length > 80) return false
  
  // Must start with a capital letter or number
  if (!/^[A-Z0-9]/.test(company)) return false
  
  // Reject obviously invalid strings
  const invalidPatterns = [
    /^\d+$/, // Just numbers
    /^(and|or|the|is|are|was|were|will|can|should|would|must|may|might|have|has|had)$/i,
    /\b(job|position|role|candidate|application|resume|cv|salary|benefits)\b/i,
    /^(http|https|www|email|phone|fax|address)\b/i,
  ]
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(company)) return false
  }
  
  return true
}

/**
 * Extract location from content with enhanced patterns
 */
function extractLocationFromContent(content: string): string {
  const locationPatterns = [
    // Explicit location labels
    /location[:\s-]+([^\n\r<>{};]{5,80})/gi,
    /job\s+location[:\s-]+([^\n\r<>{};]{5,80})/gi,
    /work\s+location[:\s-]+([^\n\r<>{};]{5,80})/gi,
    /office\s+location[:\s-]+([^\n\r<>{};]{5,80})/gi,
    /based\s+in[:\s-]+([^\n\r<>{};]{5,80})/gi,
    /office\s+in[:\s-]+([^\n\r<>{};]{5,80})/gi,
    /located\s+in[:\s-]+([^\n\r<>{};]{5,80})/gi,
    
    // City, State/Country patterns (more comprehensive)
    /\b([A-Z][a-zA-Z\s\.]{2,35},\s*[A-Z]{2,4})\b/g, // City, State/Country
    /\b([A-Z][a-zA-Z\s\.]{2,35},\s*[A-Z][a-zA-Z\s]{2,25})\b/g, // City, Full State/Country name
    
    // Work arrangement patterns
    /\b(remote|hybrid|on-site|onsite|work\s+from\s+home|wfh)\b/gi,
    
    // Major cities (common job locations)
    /\b(San Francisco|Los Angeles|New York|Chicago|Seattle|Boston|Austin|Denver|Portland|Atlanta|Miami|Dallas|Houston|Phoenix|Philadelphia|San Diego|Washington DC|Washington,\s*DC)\b/gi,
    
    // International cities
    /\b(London|Berlin|Paris|Toronto|Vancouver|Sydney|Melbourne|Tokyo|Singapore|Amsterdam|Barcelona|Dublin|Zurich)\b/gi,
    
    // Remote work indicators
    /\b(fully\s+remote|100%\s+remote|remote\s+work|work\s+remotely|telecommute|distributed\s+team)\b/gi
  ]

  const foundLocations: string[] = []

  for (const pattern of locationPatterns) {
    try {
      const matches = [...content.matchAll(pattern)]
      for (const match of matches) {
        if (match[1]) {
          const location = cleanText(match[1])
          if (isValidLocation(location) && !foundLocations.includes(location)) {
            foundLocations.push(location)
          }
        } else if (match[0]) {
          // For patterns without capture groups (like city names)
          const location = cleanText(match[0])
          if (isValidLocation(location) && !foundLocations.includes(location)) {
            foundLocations.push(location)
          }
        }
      }
    } catch (error) {
      console.warn("⚠️ Location pattern error:", error.message)
      continue
    }
  }

  // Return the best location found (prefer specific over generic)
  if (foundLocations.length > 0) {
    // Prioritize specific locations over generic terms
    const specificLocations = foundLocations.filter(loc => 
      !['remote', 'hybrid', 'on-site', 'onsite'].includes(loc.toLowerCase())
    )
    
    if (specificLocations.length > 0) {
      return specificLocations[0]
    }
    
    return foundLocations[0]
  }

  return ""
}

/**
 * Validate if extracted text looks like a valid location
 */
function isValidLocation(location: string): boolean {
  if (!location || location.length < 2 || location.length > 100) return false
  
  // Reject obviously non-location strings
  const invalidPatterns = [
    /^\d+$/, // Just numbers
    /^[^a-zA-Z]*$/, // No letters
    /\b(and|or|the|is|are|was|were|will|can|could|should|would|must|may|might)\b/i, // Common words that aren't locations
    /^(http|https|www|email|phone|fax)\b/i, // URLs/contact info
  ]
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(location)) return false
  }
  
  return true
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
 * Extract and normalize salary information from content
 */
function extractSalary(content: string): string {
  const salaryPatterns = [
    // Range patterns with various formats
    /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:k|K)?\s*(?:-|to|–|—|through)\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:k|K)?/gi,
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:k|K)\s*(?:-|to|–|—|through)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:k|K)/gi,
    
    // Labeled salary ranges
    /(?:salary|compensation|pay|wage)[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:k|K)?\s*(?:-|to|–|—|through)\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:k|K)?/gi,
    
    // Annual salary patterns
    /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:k|K)?\s*(?:per year|annually|\/year|\/yr|p\.?a\.?)/gi,
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:k|K)\s*(?:per year|annually|\/year|\/yr|p\.?a\.?)/gi,
    
    // Hourly rates
    /\$\s*(\d{1,3}(?:\.\d{2})?)\s*(?:-|to|–|—)\s*\$?\s*(\d{1,3}(?:\.\d{2})?)\s*(?:per hour|\/hour|\/hr|hourly)/gi,
    /\$\s*(\d{1,3}(?:\.\d{2})?)\s*(?:per hour|\/hour|\/hr|hourly)/gi,
    
    // Simple ranges without labels
    /(\d{1,3})(?:,\d{3})*\s*(?:k|K)\s*(?:-|to|–|—)\s*(\d{1,3})(?:,\d{3})*\s*(?:k|K)/gi,
    
    // Single salary values with currency
    /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:k|K)?(?![\d\.])/gi,
  ]

  const foundSalaries: string[] = []

  for (const pattern of salaryPatterns) {
    try {
      const matches = [...content.matchAll(pattern)]
      for (const match of matches) {
        const salaryText = normalizeSalaryText(match[0], match[1], match[2])
        if (salaryText && isValidSalary(salaryText) && !foundSalaries.includes(salaryText)) {
          foundSalaries.push(salaryText)
          console.log("💰 Salary extracted:", salaryText)
        }
      }
    } catch (error) {
      console.warn("⚠️ Salary pattern error:", error.message)
      continue
    }
  }

  // Return the best salary found (prefer ranges over single values)
  if (foundSalaries.length > 0) {
    // Prioritize ranges over single values
    const ranges = foundSalaries.filter(s => s.includes('-') || s.includes('to'))
    if (ranges.length > 0) {
      return ranges[0]
    }
    return foundSalaries[0]
  }

  console.log("⚠️ No salary information found in content")
  return ""
}

/**
 * Normalize salary text for consistent formatting
 */
function normalizeSalaryText(fullMatch: string, value1?: string, value2?: string): string {
  if (!fullMatch) return ''
  
  let normalized = fullMatch.trim()
  
  // Convert k notation to full numbers for clarity
  normalized = normalized.replace(/(\d+)k\b/gi, (match, num) => {
    const number = parseInt(num)
    if (number < 1000) {
      return `${number * 1000}`
    }
    return match
  })
  
  // Standardize range separators
  normalized = normalized.replace(/\s*(?:–|—|through)\s*/g, ' - ')
  normalized = normalized.replace(/\s+to\s+/gi, ' - ')
  
  // Clean up spacing around currency
  normalized = normalized.replace(/\$\s+/g, '$')
  
  // Ensure proper formatting for ranges
  if (value1 && value2) {
    const num1 = normalizeNumber(value1)
    const num2 = normalizeNumber(value2)
    if (num1 && num2) {
      return `$${num1} - $${num2}`
    }
  } else if (value1) {
    const num1 = normalizeNumber(value1)
    if (num1) {
      // Check if it's an hourly rate
      if (fullMatch.toLowerCase().includes('hour')) {
        return `$${num1}/hour`
      }
      return `$${num1}`
    }
  }
  
  return normalized
}

/**
 * Normalize a number string (handle k notation, commas, etc.)
 */
function normalizeNumber(numStr: string): string {
  if (!numStr) return ''
  
  let num = numStr.replace(/,/g, '')
  
  // Handle k notation
  if (num.toLowerCase().includes('k')) {
    const value = parseFloat(num.replace(/k/gi, ''))
    if (!isNaN(value)) {
      return (value * 1000).toLocaleString()
    }
  }
  
  const value = parseFloat(num)
  if (!isNaN(value)) {
    return value.toLocaleString()
  }
  
  return numStr
}

/**
 * Validate if extracted text looks like a valid salary
 */
function isValidSalary(salary: string): boolean {
  if (!salary || salary.length < 3) return false
  
  // Must contain numbers
  if (!/\d/.test(salary)) return false
  
  // Reasonable salary ranges (very loose validation)
  const numbers = salary.match(/\d+/g)
  if (numbers) {
    const values = numbers.map(n => parseInt(n.replace(/,/g, '')))
    // Check if any number looks like a reasonable salary (15k - 1M)
    return values.some(v => v >= 15000 && v <= 1000000) || 
           values.some(v => v >= 15 && v <= 500) // For k notation like "80k"
  }
  
  return true // Allow through if we can't determine
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
 * Extract description and requirements from content with enhanced parsing
 */
function extractDescriptionAndRequirements(
  content: string, 
  existingDescription?: string
): { description: string; requirements: string } {
  // First try to identify clear sections
  const sections = identifyJobSections(content)
  
  let description = existingDescription || sections.description || ''
  let requirements = sections.requirements || ''
  
  // If we have existing description but no requirements, try to split it
  if (description && description.length > 300 && !requirements) {
    const split = splitDescriptionAndRequirements(description)
    description = split.description
    requirements = split.requirements
  }
  
  // If still no description, extract from content
  if (!description || description.length < 50) {
    description = extractBestDescription(content)
  }
  
  // If still no requirements, try more aggressive extraction
  if (!requirements || requirements.length < 20) {
    requirements = extractRequirementsFromContent(content)
  }
  
  return {
    description: description || content.substring(0, 1000).trim(),
    requirements: requirements || ""
  }
}

/**
 * Extract the best description from content
 */
function extractBestDescription(content: string): string {
  const descriptionPatterns = [
    // Look for job description sections
    /job\s+description[:\s-]*([\s\S]{100,2000}?)(?=\n\s*(?:requirements|qualifications|skills|responsibilities|what\s+you|we\s+are\s+looking)|$)/gi,
    /about\s+(?:the\s+)?(?:role|position|job)[:\s-]*([\s\S]{100,2000}?)(?=\n\s*(?:requirements|qualifications|skills|responsibilities|what\s+you|we\s+are\s+looking)|$)/gi,
    /role\s+overview[:\s-]*([\s\S]{100,2000}?)(?=\n\s*(?:requirements|qualifications|skills|responsibilities|what\s+you|we\s+are\s+looking)|$)/gi,
    
    // Look for descriptive paragraphs
    /we\s+are\s+(?:looking|seeking)[\s\S]{20,100}?([\s\S]{100,1500}?)(?=\n\s*(?:requirements|qualifications|skills|responsibilities|what\s+you)|$)/gi,
  ]
  
  for (const pattern of descriptionPatterns) {
    try {
      const matches = [...content.matchAll(pattern)]
      if (matches.length > 0 && matches[0][1]) {
        const desc = matches[0][1].trim()
        if (desc.length > 50) {
          return desc
        }
      }
    } catch (error) {
      continue
    }
  }
  
  // Fallback: take first substantial paragraph
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 100)
  if (paragraphs.length > 0) {
    return paragraphs[0].trim()
  }
  
  return content.substring(0, 800).trim()
}

/**
 * Extract requirements from content with multiple strategies
 */
function extractRequirementsFromContent(content: string): string {
  const requirementsPatterns = [
    // Direct requirements sections
    /(?:requirements|qualifications)[:\s-]*([\s\S]{50,2000}?)(?=\n\s*(?:responsibilities|benefits|what\s+we\s+offer|about\s+us|company|why\s+join)|$)/gi,
    /(?:required\s+(?:skills|qualifications|experience))[:\s-]*([\s\S]{50,2000}?)(?=\n\s*(?:responsibilities|benefits|what\s+we\s+offer|about\s+us|company)|$)/gi,
    /(?:what\s+(?:you|we)\s+(?:need|require|are\s+looking\s+for))[:\s-]*([\s\S]{50,2000}?)(?=\n\s*(?:responsibilities|benefits|what\s+we\s+offer|about\s+us|company)|$)/gi,
    /(?:must\s+have)[:\s-]*([\s\S]{50,2000}?)(?=\n\s*(?:responsibilities|benefits|what\s+we\s+offer|about\s+us|company)|$)/gi,
    /(?:skills\s+(?:required|needed))[:\s-]*([\s\S]{50,2000}?)(?=\n\s*(?:responsibilities|benefits|what\s+we\s+offer|about\s+us|company)|$)/gi,
    
    // Experience requirements
    /(?:experience)[:\s-]*([\s\S]{30,1000}?)(?=\n\s*(?:responsibilities|benefits|what\s+we\s+offer|about\s+us|company|education)|$)/gi,
    /(?:minimum\s+(?:qualifications|requirements))[:\s-]*([\s\S]{50,1500}?)(?=\n\s*(?:responsibilities|benefits|what\s+we\s+offer|about\s+us|company)|$)/gi,
  ]
  
  const foundRequirements: string[] = []
  
  for (const pattern of requirementsPatterns) {
    try {
      const matches = [...content.matchAll(pattern)]
      for (const match of matches) {
        if (match[1]) {
          const req = match[1].trim()
          if (req.length > 30 && req.length < 2500) {
            foundRequirements.push(req)
          }
        }
      }
    } catch (error) {
      continue
    }
  }
  
  // Also look for bullet point lists (common for requirements)
  const bulletRequirements = extractBulletPointLists(content)
  if (bulletRequirements) {
    foundRequirements.push(bulletRequirements)
  }
  
  // Return the longest/best requirements section
  if (foundRequirements.length > 0) {
    return foundRequirements.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    )
  }
  
  return ''
}

/**
 * Extract bullet point lists that likely contain requirements
 */
function extractBulletPointLists(content: string): string {
  const bulletPatterns = [
    // HTML lists
    /<ul[^>]*>([\s\S]*?)<\/ul>/gi,
    /<ol[^>]*>([\s\S]*?)<\/ol>/gi,
    
    // Text bullet points
    /((?:^|\n)\s*[\u2022\-\*]\s+[^\n]{20,200}(?:\n\s*[\u2022\-\*]\s+[^\n]{20,200}){2,})/gm,
    /((?:^|\n)\s*\d+\.\s+[^\n]{20,200}(?:\n\s*\d+\.\s+[^\n]{20,200}){2,})/gm,
  ]
  
  for (const pattern of bulletPatterns) {
    try {
      const matches = [...content.matchAll(pattern)]
      for (const match of matches) {
        if (match[1] && match[1].length > 100) {
          return match[1].trim()
        }
      }
    } catch (error) {
      continue
    }
  }
  
  return ''
}

/**
 * Split existing description into description and requirements with enhanced logic
 */
function splitDescriptionAndRequirements(text: string): { description: string; requirements: string } {
  if (!text || text.length < 100) {
    return { description: text || '', requirements: '' }
  }

  const requirementsKeywords = [
    'requirements', 'qualifications', 'skills required', 'must have',
    'experience required', 'necessary skills', 'prerequisites', 'what you need',
    'required skills', 'minimum qualifications', 'ideal candidate',
    'you should have', 'we are looking for', 'what we\'re looking for'
  ]

  let bestSplitPoint = -1
  let bestKeyword = ''

  // Find the best requirements section (prefer earlier, more explicit keywords)
  for (let i = 0; i < requirementsKeywords.length; i++) {
    const keyword = requirementsKeywords[i]
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    const match = text.search(regex)
    
    if (match !== -1) {
      // Prefer earlier keywords and earlier positions
      const score = (requirementsKeywords.length - i) * 1000 - match
      if (bestSplitPoint === -1 || score > (requirementsKeywords.length - requirementsKeywords.indexOf(bestKeyword)) * 1000 - bestSplitPoint) {
        bestSplitPoint = match
        bestKeyword = keyword
      }
    }
  }

  if (bestSplitPoint !== -1) {
    const description = text.substring(0, bestSplitPoint).trim()
    const requirements = text.substring(bestSplitPoint).trim()
    
    // Only split if both parts are substantial
    if (description.length > 50 && requirements.length > 30) {
      return { description, requirements }
    }
  }

  // Try to detect structural splits (bullet points, numbered lists)
  const structuralPatterns = [
    /\n\s*(?:requirements|qualifications)[:\s-]*\n/gi,
    /\n\s*[•\-\*]\s+[A-Z]/g, // Bullet points starting with capital letters
    /\n\s*\d+\.\s+[A-Z]/g, // Numbered lists starting with capital letters
    /\n\s*•/g, // Unicode bullet points
  ]

  for (const pattern of structuralPatterns) {
    try {
      const matches = [...text.matchAll(pattern)]
      if (matches.length >= 2) { // At least 2 items in list
        const splitPoint = matches[0].index || 0
        const description = text.substring(0, splitPoint).trim()
        const requirements = text.substring(splitPoint).trim()
        
        if (description.length > 50 && requirements.length > 50) {
          return { description, requirements }
        }
      }
    } catch (error) {
      continue
    }
  }

  // Look for paragraph breaks that might indicate section changes
  const paragraphs = text.split(/\n\s*\n/)
  if (paragraphs.length >= 2) {
    // Check if later paragraphs look like requirements
    for (let i = 1; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].toLowerCase()
      if (requirementsKeywords.some(kw => paragraph.includes(kw)) || 
          /(?:experience|skills|knowledge)\s+(?:with|in|of)/.test(paragraph) ||
          /\d+\+?\s+years?/.test(paragraph)) {
        
        const description = paragraphs.slice(0, i).join('\n\n').trim()
        const requirements = paragraphs.slice(i).join('\n\n').trim()
        
        if (description.length > 50 && requirements.length > 30) {
          return { description, requirements }
        }
      }
    }
  }

  // If no good split found, keep everything in description
  return {
    description: text.trim(),
    requirements: ""
  }
}

/**
 * Identify different sections in job content with enhanced parsing
 */
function identifyJobSections(content: string): {
  description?: string
  requirements?: string
  benefits?: string
  responsibilities?: string
} {
  const sections: any = {}
  
  // Enhanced section patterns with more variations
  const sectionPatterns = {
    description: [
      'job description', 'about the role', 'position overview', 'role description',
      'about this position', 'position summary', 'role summary', 'job summary',
      'what you\'ll be doing', 'the role', 'about the job', 'job details'
    ],
    requirements: [
      'requirements', 'qualifications', 'skills required', 'must have',
      'experience required', 'what you need', 'prerequisites', 'required skills',
      'minimum qualifications', 'required qualifications', 'what we\'re looking for',
      'ideal candidate', 'you should have', 'required experience', 'skills and qualifications'
    ],
    responsibilities: [
      'responsibilities', 'duties', 'what you will do', 'key responsibilities',
      'your role', 'day to day', 'tasks', 'job responsibilities', 'primary responsibilities',
      'what you\'ll do', 'role responsibilities', 'key duties', 'main responsibilities'
    ],
    benefits: [
      'benefits', 'what we offer', 'perks', 'compensation package',
      'why join us', 'what you get', 'employee benefits', 'package includes',
      'our benefits', 'compensation and benefits', 'what\'s in it for you'
    ]
  }

  // Use regex patterns to find section headers more reliably
  for (const [sectionName, keywords] of Object.entries(sectionPatterns)) {
    for (const keyword of keywords) {
      // Create a more flexible regex pattern
      const pattern = new RegExp(
        `(?:^|\n)\s*(?:<[^>]*>)?\s*${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\s*(?:<[^>]*>)?\s*[:\-\s]*\n?([\s\S]{50,3000}?)(?=\n\s*(?:${Object.values(sectionPatterns).flat().map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})|$)`,
        'gi'
      )
      
      try {
        const matches = [...content.matchAll(pattern)]
        if (matches.length > 0 && matches[0][1]) {
          const sectionContent = matches[0][1]
            .replace(/^[:\-\s<>]+/, '') // Remove leading punctuation and HTML
            .replace(/<\/?[^>]+>/g, '') // Remove HTML tags
            .trim()
          
          if (sectionContent.length > 30) {
            sections[sectionName] = sectionContent
            console.log(`📋 Found ${sectionName} section (${sectionContent.length} chars)`)
            break
          }
        }
      } catch (error) {
        continue
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

/**
 * Format requirements with intelligent structure detection and clean organization
 */
function formatRequirementsList(requirements: string): string {
  if (!requirements) return ''
  
  // First clean the HTML and structure the text
  const cleaned = structureCleanText(requirements)
  
  // Split into sections and identify requirement patterns
  const sections = cleaned.split(/\n\s*\n/).filter(s => s.trim().length > 0)
  const formattedSections: string[] = []
  
  for (const section of sections) {
    const formatted = formatRequirementSection(section)
    if (formatted) {
      formattedSections.push(formatted)
    }
  }
  
  // If we didn't get good sections, try to create structure from the whole text
  if (formattedSections.length === 0) {
    const structured = createRequirementStructure(cleaned)
    return structured
  }
  
  return formattedSections.join('\n\n')
}

/**
 * Format individual requirement sections
 */
function formatRequirementSection(text: string): string {
  if (!text || text.trim().length < 10) return ''
  
  // Check if this is already a well-formatted list
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  
  if (lines.length === 1) {
    // Single line - might be a paragraph that needs to be broken down
    return createRequirementStructure(text)
  }
  
  // Multiple lines - format as list
  const formattedLines: string[] = []
  let hasHeader = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Check if this looks like a section header
    if (i === 0 && !line.match(/^[•\-\*\+\d+\.]/) && line.length < 60 && !line.endsWith('.')) {
      formattedLines.push(line + ':')
      hasHeader = true
      continue
    }
    
    // Format as list item
    if (line.match(/^[•\-\*\+]/)) {
      const content = line.replace(/^[•\-\*\+]\s*/, '').trim()
      formattedLines.push(`• ${capitalizeFirst(content)}`)
    } else if (line.match(/^\d+\./)) {
      formattedLines.push(line)
    } else if (line.length > 5) {
      formattedLines.push(`• ${capitalizeFirst(line)}`)
    }
  }
  
  return formattedLines.join('\n')
}

/**
 * Create structured requirements from unstructured text
 */
function createRequirementStructure(text: string): string {
  if (!text) return ''
  
  // Try to identify and separate different types of requirements
  const requirements: string[] = []
  
  // Split by sentences and common separators
  const parts = text
    .split(/[.!]\s*(?=[A-Z])/) // Split on sentence boundaries
    .map(part => part.trim())
    .filter(part => part.length > 10)
  
  for (const part of parts) {
    // Clean up the part
    const cleaned = part
      .replace(/^[\s\-\*\+•]+/, '') // Remove leading bullets
      .replace(/[.!]*$/, '') // Remove trailing punctuation
      .trim()
    
    if (cleaned.length > 5) {
      requirements.push(`• ${capitalizeFirst(cleaned)}`)
    }
  }
  
  // If we didn't get good requirements, try splitting by common keywords
  if (requirements.length <= 1) {
    const keywordSplit = text.split(/\b(?:and|with|including|plus|also|additionally)\b/gi)
    requirements.length = 0
    
    for (const part of keywordSplit) {
      const cleaned = part
        .replace(/^[\s\-\*\+•,;]+/, '')
        .replace(/[.!,;]*$/, '')
        .trim()
      
      if (cleaned.length > 10) {
        requirements.push(`• ${capitalizeFirst(cleaned)}`)
      }
    }
  }
  
  return requirements.join('\n')
}
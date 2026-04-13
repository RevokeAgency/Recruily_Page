import { type NextRequest, NextResponse } from "next/server"

// Common job posting selectors for different sites
const JOB_SITE_SELECTORS = {
  linkedin: {
    title: '.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1',
    company: '.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name, .job-details-jobs-unified-top-card__primary-description-container a',
    location: '.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet',
    description: '.job-details-jobs-unified-top-card__job-description, .jobs-description-content__text, .job-view-layout .description'
  },
  indeed: {
    title: '[data-testid="jobsearch-JobInfoHeader-title"], .jobsearch-JobInfoHeader-title, h1',
    company: '[data-testid="inlineHeader-companyName"], .icl-u-lg-mr--sm, .jobsearch-InlineCompanyRating .icl-u-lg-mr--sm',
    location: '[data-testid="job-location"], .jobsearch-JobMetadataHeader-iconLabel',
    description: '.jobsearch-jobDescriptionText, .jobsearch-JobComponent-description, #jobDescriptionText'
  },
  glassdoor: {
    title: '.e1tk4kwz4, [data-test="job-title"], h1',
    company: '.e1tk4kwz5, [data-test="employer-name"]',
    location: '.e1tk4kwz6, [data-test="location"]',
    description: '.jobDescriptionContent, [data-test="job-description"]'
  },
  generic: {
    title: 'h1, .job-title, .position-title, .title, [class*="title"]',
    company: '.company, .company-name, .employer, [class*="company"]',
    location: '.location, .job-location, [class*="location"]',
    description: '.description, .job-description, .content, [class*="description"]'
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== 🌐 Enhanced URL Scraping API Called ===")

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ success: false, error: "URL is required" }, { status: 400 })
    }

    console.log(`🔗 Scraping URL: ${url}`)

    // Validate URL format
    let validUrl: URL
    try {
      validUrl = new URL(url)
      if (!["http:", "https:"].includes(validUrl.protocol)) {
        throw new Error("Invalid protocol")
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid URL format. Please provide a valid HTTP/HTTPS URL." },
        { status: 400 },
      )
    }

    // Detect job site type
    const hostname = validUrl.hostname.toLowerCase()
    let siteType = 'generic'
    if (hostname.includes('linkedin')) siteType = 'linkedin'
    else if (hostname.includes('indeed')) siteType = 'indeed'
    else if (hostname.includes('glassdoor')) siteType = 'glassdoor'
    
    console.log(`🎯 Detected site type: ${siteType}`)

    // Fetch the webpage with enhanced headers — 4s hard timeout, no retries
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "DNT": "1",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Cache-Control": "max-age=0",
          "Referer": "https://www.google.com/"
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      console.log(`✅ Successfully fetched ${html.length} characters from URL`)

      // Enhanced content extraction
      const extractedContent = enhancedContentExtraction(html, siteType, url)
      
      console.log(`📝 Enhanced extraction completed:`, {
        contentLength: extractedContent.content.length,
        structuredData: {
          title: !!extractedContent.structuredData?.title,
          company: !!extractedContent.structuredData?.company,
          location: !!extractedContent.structuredData?.location,
          description: !!extractedContent.structuredData?.description
        }
      })

      // Return raw scraped data immediately — no Gemini normalization
      const sd = extractedContent.structuredData
      const rawDesc = sd.description || extractedContent.content.slice(0, 3000)
      return NextResponse.json({
        success: true,
        content: extractedContent.content,
        structuredData: {
          title: sd.title || "",
          company: sd.company || "",
          description: formatDescription(rawDesc),
          location: sd.location || "",
          salary: extractSalary(rawDesc),
          skills: [],
          employment_type: "full-time",
          source: "url_scraping",
        },
        url: url,
        siteType: siteType,
        length: extractedContent.content.length,
        normalized: false,
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          { success: false, error: "Request timeout. The website took too long to respond." },
          { status: 408 },
        )
      }

      console.error("❌ Fetch error:", fetchError.message)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch URL: ${fetchError.message}. Please check if the URL is accessible.`,
        },
        { status: 400 },
      )
    }
  } catch (error: any) {
    console.error("=== ❌ URL Scraping Error ===")
    console.error("Error:", error.message)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error occurred while scraping URL. Please try again.",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

// Enhanced content extraction function
function enhancedContentExtraction(html: string, siteType: string, url: string) {
  console.log(`🔍 Starting enhanced extraction for ${siteType} site`)
  
  // Remove scripts and styles first
  let cleanHtml = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")

  // Try to extract structured data using site-specific selectors
  const selectors = JOB_SITE_SELECTORS[siteType as keyof typeof JOB_SITE_SELECTORS] || JOB_SITE_SELECTORS.generic
  
  const structuredData = {
    title: extractBySelector(cleanHtml, selectors.title),
    company: extractBySelector(cleanHtml, selectors.company),
    location: extractBySelector(cleanHtml, selectors.location),
    description: extractBySelector(cleanHtml, selectors.description, true) // Keep longer text for description
  }

  // Extract JSON-LD structured data if available
  const jsonLdData = extractJsonLd(html)
  if (jsonLdData) {
    if (jsonLdData.title && !structuredData.title) structuredData.title = jsonLdData.title
    if (jsonLdData.company && !structuredData.company) structuredData.company = jsonLdData.company
    if (jsonLdData.location && !structuredData.location) structuredData.location = jsonLdData.location
    if (jsonLdData.description && !structuredData.description) structuredData.description = jsonLdData.description
  }

  // Extract meta tags
  const metaData = extractMetaTags(html)
  if (metaData.title && !structuredData.title) structuredData.title = metaData.title
  if (metaData.description && !structuredData.description) structuredData.description = metaData.description

  // Clean and extract text content
  let textContent = cleanHtml
    .replace(/<[^>]+>/g, " ") // Remove HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/[\r\n]+/g, " ") // Remove line breaks
    .trim()

  // Enhanced text cleaning for better parsing
  textContent = cleanExtractedText(textContent, structuredData)

  return {
    content: textContent,
    structuredData: structuredData
  }
}

// Extract content using CSS-like selectors (basic implementation)
function extractBySelector(html: string, selectorString: string, keepLong = false): string {
  const selectors = selectorString.split(', ')
  
  for (const selector of selectors) {
    let match
    
    // Handle different selector types
    if (selector.startsWith('.')) {
      const className = selector.substring(1)
      const regex = new RegExp(`class=["'][^"']*\\b${className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b[^"']*["'][^>]*>([^<]+|[\s\S]*?(?=<\/))`,'i')
      match = html.match(regex)
    } else if (selector.startsWith('[')) {
      const attrMatch = selector.match(/\[([^=]+)="([^"]+)"\]/) 
      if (attrMatch) {
        const [, attrName, attrValue] = attrMatch
        const regex = new RegExp(`${attrName}=["']${attrValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>([^<]+|[\s\S]*?(?=<\/))`,'i')
        match = html.match(regex)
      }
    } else if (selector === 'h1') {
      match = html.match(/<h1[^>]*>([^<]+)</i)
    } else {
      // Generic class/id matching
      const regex = new RegExp(`class=["'][^"']*\\b${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b[^"']*["'][^>]*>([^<]+|[\s\S]*?(?=<\/))`,'i')
      match = html.match(regex)
    }
    
    if (match && match[1]) {
      let text = match[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      if (text.length > 3 && (keepLong || text.length < 200)) {
        return text
      }
    }
  }
  
  return ''
}

// Extract JSON-LD structured data
function extractJsonLd(html: string) {
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match
  
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const jsonData = JSON.parse(match[1])
      
      if (jsonData['@type'] === 'JobPosting') {
        return {
          title: jsonData.title,
          company: jsonData.hiringOrganization?.name,
          location: typeof jsonData.jobLocation === 'string' ? jsonData.jobLocation : jsonData.jobLocation?.address?.addressLocality,
          description: jsonData.description
        }
      }
    } catch (e) {
      // Invalid JSON, continue
    }
  }
  
  return null
}

// Extract meta tags
function extractMetaTags(html: string) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)</i)
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                   html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i)
  
  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    description: descMatch ? descMatch[1].trim() : ''
  }
}

// Clean and enhance extracted text
function cleanExtractedText(text: string, structuredData: any): string {
  // Remove common website noise
  text = text
    .replace(/\b(cookies?|privacy policy|terms of service|subscribe|newsletter)\b/gi, '')
    .replace(/\b(sign in|log in|register|create account)\b/gi, '')
    .replace(/\b(follow us|social media|facebook|twitter|linkedin|instagram)\b/gi, '')
    .replace(/\b(advertisement|ad|sponsored)\b/gi, '')
    .replace(/\b(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})\b/g, '[DATE]') // Replace dates
    .replace(/\b\d{10,}\b/g, '[ID]') // Replace long numbers
    .trim()

  // Prioritize job-related content
  const jobKeywords = [
    'responsibilities', 'requirements', 'qualifications', 'skills', 'experience',
    'salary', 'benefits', 'position', 'role', 'job', 'career', 'employment',
    'candidate', 'applicant', 'hire', 'work', 'team', 'company', 'department'
  ]
  
  // Split into sentences and prioritize those with job keywords
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20)
  const jobRelevantSentences = sentences.filter(sentence => 
    jobKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
  )
  
  // Combine structured data with most relevant sentences
  const combinedText = [
    structuredData.title,
    structuredData.company,
    structuredData.location,
    structuredData.description,
    ...jobRelevantSentences.slice(0, 20), // Top 20 relevant sentences
    ...sentences.slice(0, 10) // Top 10 general sentences as fallback
  ].filter(Boolean).join(' ')
  
  return combinedText.substring(0, 8000) // Limit to reasonable size
}

// Format raw scraped description into clean readable text
function formatDescription(raw: string): string {
  let text = raw
    // Decode common HTML entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    // Remove any residual HTML tags
    .replace(/<[^>]+>/g, " ")
    // Normalize bullet characters into newline bullets
    .replace(/[•·▪▸◦‣]\s*/g, "\n• ")
    .replace(/^\s*[-–]\s+/gm, "\n• ")
    // Split on 2+ spaces or tab-like gaps (common in scraped text)
    .replace(/\s{3,}/g, "\n")
    // Collapse multiple blank lines to one
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  // If no newlines, try to split on sentence-ending patterns to create paragraphs
  if (!text.includes("\n")) {
    text = text
      .replace(/\.\s{2,}/g, ".\n\n")
      .replace(/([.!?])\s+([A-Z])/g, "$1\n$2")
  }

  return text.slice(0, 4000)
}

// Extract salary info using common patterns (€, £, $, k ranges)
function extractSalary(text: string): string {
  const patterns = [
    /(?:€|EUR)\s*[\d.,]+(?:\s*[-–]\s*[\d.,]+)?(?:\s*[kK])?/,
    /(?:£|GBP)\s*[\d.,]+(?:\s*[-–]\s*[\d.,]+)?(?:\s*[kK])?/,
    /(?:\$|USD)\s*[\d.,]+(?:\s*[-–]\s*[\d.,]+)?(?:\s*[kK])?/,
    /[\d.,]+\s*[-–]\s*[\d.,]+\s*(?:€|£|\$|EUR|USD|GBP)/,
    /\b\d{2,3}[.,]\d{3}\b(?:\s*[-–]\s*\d{2,3}[.,]\d{3}\b)?/,
  ]
  for (const pattern of patterns) {
    const m = text.match(pattern)
    if (m) return m[0].trim()
  }
  return ""
}

// App Router configuration exports
export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

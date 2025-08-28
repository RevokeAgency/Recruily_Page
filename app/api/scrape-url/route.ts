import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("=== 🌐 URL Scraping API Called ===")

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

    // Fetch the webpage with proper headers and timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          DNT: "1",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      console.log(`✅ Successfully fetched ${html.length} characters from URL`)

      // Extract text content from HTML
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "") // Remove scripts
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "") // Remove styles
        .replace(/<[^>]+>/g, " ") // Remove HTML tags
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim()

      console.log(`📝 Extracted ${textContent.length} characters of text content`)

      return NextResponse.json({
        success: true,
        content: textContent,
        url: url,
        length: textContent.length,
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

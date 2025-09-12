import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Test Upload API - POST request received")

    const formData = await request.formData()
    const file = formData.get("file") as File
    const jobId = formData.get("jobId") as string

    console.log("📋 Request details:", {
      hasFile: !!file,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      jobId: jobId
    })

    if (!file) {
      console.log("❌ No file provided")
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      )
    }

    if (!jobId) {
      console.log("❌ No job ID provided")
      return NextResponse.json(
        { success: false, error: "Job ID is required" },
        { status: 400 }
      )
    }

    // Test text file parsing
    let fileContent = ""
    if (file.type === "text/plain" || file.name.endsWith('.txt')) {
      fileContent = await file.text()
      console.log(`📄 File content length: ${fileContent.length}`)
    }

    // Simple candidate data extraction for test
    const candidateData = {
      id: `test-candidate-${Date.now()}`,
      name: extractName(fileContent) || "Test Candidate",
      email: extractEmail(fileContent) || "test@example.com",
      skills: extractSkills(fileContent),
      source: "test_upload",
      file_name: file.name,
      file_size: file.size,
      raw_text: fileContent.substring(0, 500) // First 500 chars for preview
    }

    console.log("✅ Test candidate data:", candidateData)

    return NextResponse.json({
      success: true,
      candidate: candidateData,
      message: "Test upload successful"
    })

  } catch (error: any) {
    console.error("❌ Test Upload API Error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Test upload failed" 
      },
      { status: 500 }
    )
  }
}

// Simple extraction functions for testing
function extractName(text: string): string {
  const lines = text.split('\n')
  const firstLine = lines[0]?.trim()
  if (firstLine && firstLine.length > 2 && firstLine.length < 50) {
    return firstLine
  }
  return "Unknown Name"
}

function extractEmail(text: string): string {
  const emailPattern = /[\w\.-]+@[\w\.-]+\.\w+/
  const match = text.match(emailPattern)
  return match ? match[0] : ""
}

function extractSkills(text: string): string[] {
  const lowerText = text.toLowerCase()
  const commonSkills = [
    'javascript', 'typescript', 'python', 'java', 'react', 'node.js',
    'html', 'css', 'git', 'docker', 'aws', 'sql'
  ]
  
  return commonSkills.filter(skill => lowerText.includes(skill))
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
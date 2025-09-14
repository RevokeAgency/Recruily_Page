/**
 * Server-side PDF parsing utilities
 * This module should only be used on the server side
 */

import { NextRequest } from 'next/server'

// Interface for parsed PDF result
export interface PDFParseResult {
  success: boolean
  text?: string
  error?: string
  pages?: number
  info?: any
}

/**
 * Parse PDF file server-side using pdf-parse
 * This function uses dynamic imports to ensure it only runs on the server
 */
export async function parsePDFServerSide(file: File): Promise<PDFParseResult> {
  try {
    // Ensure we're on the server side
    if (typeof window !== 'undefined') {
      throw new Error('PDF parsing must be done server-side only')
    }

    // Dynamic import to avoid client-side bundling
    const pdfParse = await import('pdf-parse').then(mod => mod.default)
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    console.log(`📄 Parsing PDF: ${file.name} (${buffer.length} bytes)`)
    
    // Parse PDF with pdf-parse
    const pdfData = await pdfParse(buffer, {
      // Parsing options
      max: 0, // Parse all pages
      version: 'v1.10.100' // Use stable version
    })
    
    if (!pdfData.text || pdfData.text.trim().length === 0) {
      return {
        success: false,
        error: 'No text content found in PDF'
      }
    }
    
    console.log(`✅ PDF parsed successfully: ${pdfData.text.length} characters, ${pdfData.numpages} pages`)
    
    return {
      success: true,
      text: pdfData.text,
      pages: pdfData.numpages,
      info: pdfData.info
    }
    
  } catch (error: any) {
    console.error('❌ PDF parsing failed:', error.message)
    
    return {
      success: false,
      error: `Failed to parse PDF: ${error.message}`
    }
  }
}

/**
 * Parse DOCX file server-side using mammoth
 */
export async function parseDocxServerSide(file: File): Promise<PDFParseResult> {
  try {
    // Ensure we're on the server side
    if (typeof window !== 'undefined') {
      throw new Error('DOCX parsing must be done server-side only')
    }

    // Dynamic import to avoid client-side bundling
    const mammoth = await import('mammoth').then(mod => mod.default)
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    console.log(`📄 Parsing DOCX: ${file.name} (${buffer.length} bytes)`)
    
    // Parse DOCX with mammoth
    const result = await mammoth.extractRawText({ buffer })
    
    if (!result.value || result.value.trim().length === 0) {
      return {
        success: false,
        error: 'No text content found in DOCX'
      }
    }
    
    console.log(`✅ DOCX parsed successfully: ${result.value.length} characters`)
    
    return {
      success: true,
      text: result.value
    }
    
  } catch (error: any) {
    console.error('❌ DOCX parsing failed:', error.message)
    
    return {
      success: false,
      error: `Failed to parse DOCX: ${error.message}`
    }
  }
}

/**
 * Parse any supported document type
 */
export async function parseDocumentServerSide(file: File): Promise<PDFParseResult> {
  const fileType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()
  
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return parsePDFServerSide(file)
  } else if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx')
  ) {
    return parseDocxServerSide(file)
  } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
    try {
      const text = await file.text()
      return {
        success: true,
        text: text
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to parse text file: ${error.message}`
      }
    }
  } else {
    return {
      success: false,
      error: `Unsupported file type: ${fileType}. Please upload PDF, DOCX, or TXT files.`
    }
  }
}
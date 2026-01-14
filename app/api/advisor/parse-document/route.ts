export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { ParsedDocument } from '@/lib/advisor/resume-schema'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/advisor/parse-document
 * Parse uploaded PDF, DOCX, or TXT file and extract structured text
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    const fileName = file.name.toLowerCase()
    let result: ParsedDocument

    // Handle different file types
    if (fileName.endsWith('.txt')) {
      result = await parseTxtFile(file)
    } 
    else if (fileName.endsWith('.pdf')) {
      result = await parsePdfFile(file)
    }
    else if (fileName.endsWith('.docx')) {
      result = await parseDocxFile(file)
    }
    else if (fileName.endsWith('.doc')) {
      result = await parseLegacyDocFile(file)
    }
    else {
      return NextResponse.json({ 
        error: 'Unsupported file type. Please upload PDF, DOCX, or TXT.' 
      }, { status: 400 })
    }

    // Add warning for poor quality extraction
    if (result.meta.parseQuality === 'poor') {
      return NextResponse.json({
        ...result,
        text: result.rawText,
        warning: result.meta.isScannedLikely 
          ? 'This file appears to be scanned. Please upload a text-based PDF or DOCX for better results.'
          : 'Could not extract much text from this file. Please try a different format.'
      })
    }

    return NextResponse.json({
      ...result,
      text: result.rawText
    })

  } catch (error) {
    console.error('Document parse error:', error)
    return NextResponse.json({ error: 'Failed to parse document' }, { status: 500 })
  }
}

/**
 * Parse TXT file - straightforward text extraction
 */
async function parseTxtFile(file: File): Promise<ParsedDocument> {
  const text = await file.text()
  const cleanedText = cleanText(text)
  
  return {
    rawText: cleanedText,
    sectionsGuess: extractSections(cleanedText),
    meta: {
      fileType: 'txt',
      charCount: cleanedText.length,
      isScannedLikely: false,
      parseQuality: cleanedText.length > 100 ? 'good' : 'partial'
    }
  }
}

/**
 * Parse PDF file using pdf-parse v2.x
 */
async function parsePdfFile(file: File): Promise<ParsedDocument> {
  try {
    const mod = require('pdf-parse')
    const PDFParse = mod.PDFParse
    
    if (!PDFParse) {
      throw new Error('PDFParse class not found')
    }
    
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    const parser = new PDFParse(uint8Array)
    
    let rawText: unknown = ''
    let numPages = 1
    
    if (typeof parser.loadPDF === 'function') {
      const data = await parser.loadPDF()
      rawText = data?.text || parser.text || ''
      numPages = data?.numpages || parser.numPages || 1
    } else if (typeof parser.getText === 'function') {
      rawText = await parser.getText()
      numPages = parser.numPages || 1
    } else if (typeof parser.render === 'function') {
      await parser.render()
      rawText = parser.text || ''
      numPages = parser.numPages || 1
    } else {
      rawText = parser.text || ''
      numPages = parser.numPages || 1
    }
    
    // Ensure text is a string
    let text = ''
    if (typeof rawText === 'string') {
      text = rawText
    } else if (Array.isArray(rawText)) {
      text = rawText.join('\n')
    } else if (rawText && typeof rawText === 'object') {
      // Try to extract text from object
      const obj = rawText as Record<string, unknown>
      text = String(obj.text || obj.content || obj.data || JSON.stringify(rawText))
    } else {
      text = String(rawText || '')
    }
    
    const cleanedText = cleanText(text)
    const charCount = cleanedText.length
    
    const expectedMinChars = numPages * 200
    const isScannedLikely = charCount < 200 || (numPages > 0 && charCount < expectedMinChars * 0.3)
    
    let parseQuality: 'good' | 'partial' | 'poor' = 'good'
    if (charCount < 100) {
      parseQuality = 'poor'
    } else if (charCount < 500 || isScannedLikely) {
      parseQuality = 'partial'
    }

    console.log(`PDF parsed: ${charCount} chars from ${numPages} pages, quality: ${parseQuality}`)

    return {
      rawText: cleanedText,
      sectionsGuess: extractSections(cleanedText),
      meta: {
        fileType: 'pdf',
        charCount,
        isScannedLikely,
        parseQuality
      }
    }
  } catch (error) {
    console.error('PDF parse error:', error)
    
    return {
      rawText: '',
      meta: {
        fileType: 'pdf',
        charCount: 0,
        isScannedLikely: true,
        parseQuality: 'poor'
      }
    }
  }
}

/**
 * Parse DOCX file using mammoth library
 */
async function parseDocxFile(file: File): Promise<ParsedDocument> {
  try {
    const mammoth = await import('mammoth')
    
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const result = await mammoth.extractRawText({ buffer })
    
    const text = result.value || ''
    const cleanedText = cleanText(text)
    const charCount = cleanedText.length

    if (result.messages && result.messages.length > 0) {
      console.log('Mammoth warnings:', result.messages)
    }

    let parseQuality: 'good' | 'partial' | 'poor' = 'good'
    if (charCount < 100) {
      parseQuality = 'poor'
    } else if (charCount < 500) {
      parseQuality = 'partial'
    }

    console.log(`DOCX parsed: ${charCount} chars, quality: ${parseQuality}`)

    return {
      rawText: cleanedText,
      sectionsGuess: extractSections(cleanedText),
      meta: {
        fileType: 'docx',
        charCount,
        isScannedLikely: false,
        parseQuality
      }
    }
  } catch (error) {
    console.error('DOCX parse error:', error)
    
    return {
      rawText: '',
      meta: {
        fileType: 'docx',
        charCount: 0,
        isScannedLikely: false,
        parseQuality: 'poor'
      }
    }
  }
}

/**
 * Parse legacy .doc file - basic extraction attempt
 */
async function parseLegacyDocFile(file: File): Promise<ParsedDocument> {
  try {
    const mammoth = await import('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value || ''
    const cleanedText = cleanText(text)
    
    if (cleanedText.length > 100) {
      return {
        rawText: cleanedText,
        sectionsGuess: extractSections(cleanedText),
        meta: {
          fileType: 'docx',
          charCount: cleanedText.length,
          isScannedLikely: false,
          parseQuality: cleanedText.length > 500 ? 'good' : 'partial'
        }
      }
    }
  } catch (error) {
    console.log('Legacy .doc mammoth extraction failed, trying fallback')
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
    
    const readableText = text
      .replace(/[^\x20-\x7E\n\r]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    return {
      rawText: readableText.substring(0, 10000),
      meta: {
        fileType: 'docx',
        charCount: readableText.length,
        isScannedLikely: false,
        parseQuality: 'partial'
      }
    }
  } catch {
    return {
      rawText: '',
      meta: {
        fileType: 'docx',
        charCount: 0,
        isScannedLikely: false,
        parseQuality: 'poor'
      }
    }
  }
}

/**
 * Extract structured sections from CV text
 */
function extractSections(text: string): ParsedDocument['sectionsGuess'] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const emails = text.match(emailRegex) || []

  const phoneRegex = /(?:\+?(\d{1,3}))?[-.\s]?\(?(\d{2,4})\)?[-.\s]?(\d{3,4})[-.\s]?(\d{3,4})/g
  const phones = text.match(phoneRegex) || []

  const urlRegex = /(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/in\/[a-zA-Z0-9-]+|github\.com\/[a-zA-Z0-9-]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi
  const links = text.match(urlRegex) || []

  const headingPatterns = [
    /^([A-Z][A-Z\s&]{2,})$/gm,
    /^((?:Professional\s+)?(?:Summary|Experience|Education|Skills|Projects|Certifications?|Awards?|Languages?|References?|Objective|Profile|Work\s+History|Employment|Technical\s+Skills|Core\s+Competencies))[\s:]*$/gim
  ]
  
  const headings: string[] = []
  for (const pattern of headingPatterns) {
    const matches = text.match(pattern) || []
    headings.push(...matches.map(h => h.trim()))
  }

  return {
    headings: [...new Set(headings)].slice(0, 20),
    emails: [...new Set(emails)].slice(0, 5),
    phones: [...new Set(phones.map(p => p.replace(/\s+/g, ' ').trim()))].slice(0, 5),
    links: [...new Set(links)].slice(0, 10),
    potentialSkills: []
  }
}

/**
 * Clean extracted text
 */
function cleanText(text: unknown): string {
  // Ensure we have a string
  let str = ''
  if (typeof text === 'string') {
    str = text
  } else if (Array.isArray(text)) {
    str = text.map(item => String(item || '')).join('\n')
  } else if (text && typeof text === 'object') {
    str = JSON.stringify(text)
  } else {
    str = String(text || '')
  }
  
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/^\s+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim()
}
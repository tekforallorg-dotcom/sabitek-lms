// lib/sabiquiz/extract-text.ts
import mammoth from 'mammoth'

/**
 * Extract text from PDF or DOCX file
 * Returns plain text for question generation
 */
export async function extractText(file: File): Promise<string> {
  const fileType = file.type

  try {
    // DOCX files
    if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.endsWith('.docx')
    ) {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      return cleanText(result.value)
    }

    // TXT files
    if (fileType === 'text/plain' || file.name.endsWith('.txt')) {
      const text = await file.text()
      return cleanText(text)
    }

    // PDF files - we'll use pdf-parse in browser
    if (fileType === 'application/pdf' || file.name.endsWith('.pdf')) {
      // For now, return a placeholder - we'll implement PDF parsing next
      return '[PDF parsing will be implemented - for now, please use DOCX or TXT files]'
    }

    throw new Error('Unsupported file type. Please use PDF, DOCX, or TXT files.')
  } catch (error) {
    console.error('Text extraction error:', error)
    throw new Error('Failed to extract text from file')
  }
}

/**
 * Clean extracted text
 * - Remove excessive whitespace
 * - Fix line breaks
 * - Remove page numbers, headers, footers
 */
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line breaks
    .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
    .replace(/[ \t]+/g, ' ') // Normalize spaces
    .replace(/^\s+|\s+$/gm, '') // Trim lines
    .replace(/^Page \d+$/gm, '') // Remove page numbers
    .replace(/^\d+\s*$/gm, '') // Remove standalone numbers
    .trim()
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ]

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 10MB.',
    }
  }

  if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(pdf|docx|txt)$/i)) {
    return {
      valid: false,
      error: 'Invalid file type. Please use PDF, DOCX, or TXT files.',
    }
  }

  return { valid: true }
}
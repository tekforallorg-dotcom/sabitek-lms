import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/csv': 'csv'
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const sessionId = formData.get('sessionId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      }, { status: 400 })
    }

    // Validate file type
    const fileType = ALLOWED_TYPES[file.type]
    if (!fileType) {
      return NextResponse.json({ 
        error: 'Unsupported file type. Allowed: PDF, DOCX, PPTX, TXT' 
      }, { status: 400 })
    }

    // Extract text based on file type
    let extractedText = ''
    
    if (fileType === 'txt' || fileType === 'md' || fileType === 'csv') {
      extractedText = await file.text()
    } else if (fileType === 'pdf') {
      // For PDF, we'll use a simple extraction
      // In production, use pdf-parse or similar
      extractedText = await extractPdfText(file)
    } else if (fileType === 'docx') {
      extractedText = await extractDocxText(file)
    } else if (fileType === 'pptx') {
      extractedText = await extractPptxText(file)
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ 
        error: 'Could not extract text from file. File may be empty or corrupted.' 
      }, { status: 400 })
    }

    // Estimate tokens
    const estimatedTokens = Math.ceil(extractedText.length / 4)

    // Create file record
    const { data: fileRecord, error: insertError } = await supabase
      .from('sabiwrite_files')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        original_name: file.name,
        file_type: fileType,
        mime_type: file.type,
        file_size_bytes: file.size,
        extracted_text: extractedText,
        extracted_chars: extractedText.length,
        extracted_tokens: estimatedTokens,
        extraction_status: 'completed'
      })
      .select('id, original_name, file_type, extracted_chars, extracted_tokens')
      .single()

    if (insertError) {
      console.error('File insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save file' }, { status: 500 })
    }

    return NextResponse.json({
      file: fileRecord,
      extractedText: extractedText.slice(0, 500) + (extractedText.length > 500 ? '...' : ''),
      fullText: extractedText,
      estimatedTokens,
      requiresChunking: estimatedTokens > 4000,
      chunkCount: Math.ceil(estimatedTokens / 4000)
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// Simple PDF text extraction (placeholder - use pdf-parse in production)
async function extractPdfText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // Basic text extraction from PDF
    // This is a simplified version - use pdf-parse for production
    let text = ''
    const decoder = new TextDecoder('utf-8', { fatal: false })
    const content = decoder.decode(uint8Array)
    
    // Extract text between stream markers (very basic)
    const streamMatches = content.match(/stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g)
    if (streamMatches) {
      for (const match of streamMatches) {
        const cleaned = match
          .replace(/stream[\r\n]+/, '')
          .replace(/[\r\n]+endstream/, '')
          .replace(/[^\x20-\x7E\r\n]/g, ' ')
          .trim()
        if (cleaned.length > 20) {
          text += cleaned + '\n'
        }
      }
    }
    
    // Fallback: extract any readable text
    if (!text.trim()) {
      text = content.replace(/[^\x20-\x7E\r\n]/g, ' ').replace(/\s+/g, ' ').trim()
    }
    
    return text.slice(0, 50000) // Limit to ~50k chars
  } catch (error) {
    console.error('PDF extraction error:', error)
    return ''
  }
}

// Simple DOCX text extraction
async function extractDocxText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // DOCX is a ZIP file - look for document.xml content
    const decoder = new TextDecoder('utf-8', { fatal: false })
    const content = decoder.decode(uint8Array)
    
    // Extract text from XML tags
    const textMatches = content.match(/<w:t[^>]*>([^<]*)<\/w:t>/g)
    if (textMatches) {
      const text = textMatches
        .map(match => match.replace(/<[^>]+>/g, ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      return text
    }
    
    return ''
  } catch (error) {
    console.error('DOCX extraction error:', error)
    return ''
  }
}

// Simple PPTX text extraction
async function extractPptxText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    const decoder = new TextDecoder('utf-8', { fatal: false })
    const content = decoder.decode(uint8Array)
    
    // Extract text from XML tags
    const textMatches = content.match(/<a:t>([^<]*)<\/a:t>/g)
    if (textMatches) {
      const text = textMatches
        .map(match => match.replace(/<[^>]+>/g, ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      return text
    }
    
    return ''
  } catch (error) {
    console.error('PPTX extraction error:', error)
    return ''
  }
}
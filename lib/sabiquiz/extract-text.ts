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
      console.log('📄 Extracting DOCX...')
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      const cleanedText = cleanText(result.value)
      console.log(`✅ DOCX extracted: ${cleanedText.length} characters`)
      return cleanedText
    }

    // TXT files
    if (fileType === 'text/plain' || file.name.endsWith('.txt')) {
      console.log('📄 Extracting TXT...')
      const text = await file.text()
      const cleanedText = cleanText(text)
      console.log(`✅ TXT extracted: ${cleanedText.length} characters`)
      return cleanedText
    }

    // PDF files
    if (fileType === 'application/pdf' || file.name.endsWith('.pdf')) {
      console.log('📄 Extracting PDF...')
      const text = await extractPDFText(file)
      const cleanedText = cleanText(text)
      console.log(`✅ PDF extracted: ${cleanedText.length} characters`)
      return cleanedText
    }

    throw new Error('Unsupported file type. Please use PDF, DOCX, or TXT files.')
  } catch (error) {
    console.error('Text extraction error:', error)
    throw new Error(`Failed to extract text from file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text from PDF using PDF.js
 */
async function extractPDFText(file: File): Promise<string> {
  try {
    const pdfjsLib = await import('pdfjs-dist')
    
    // Use worker from public directory (works in both dev and production)
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.mjs'

    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    console.log(`📄 PDF has ${pdf.numPages} pages`)

    let fullText = ''

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      
      fullText += pageText + '\n\n'
      
      console.log(`📄 Page ${pageNum}/${pdf.numPages}: ${pageText.length} characters`)
    }

    if (fullText.trim().length === 0) {
      throw new Error('No text found in PDF. The PDF might be scanned images.')
    }

    return fullText
  } catch (error) {
    console.error('PDF extraction error:', error)
    throw new Error('Failed to extract text from PDF. Make sure it contains selectable text (not scanned images).')
  }
}

/**
 * Clean extracted text
 */
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/^\s+|\s+$/gm, '')
    .replace(/^Page \d+$/gm, '')
    .replace(/^\d+\s*$/gm, '')
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
    return { valid: false, error: 'File too large. Maximum size is 10MB.' }
  }

  if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(pdf|docx|txt)$/i)) {
    return { valid: false, error: 'Invalid file type. Please use PDF, DOCX, or TXT files.' }
  }

  return { valid: true }
}
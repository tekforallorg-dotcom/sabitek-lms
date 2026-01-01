import mammoth from 'mammoth'

// ============================================================================
// CONFIGURATION - Tunable thresholds
// ============================================================================
const CONFIG = {
  // Line detection: items within this Y-distance are same line
  LINE_THRESHOLD_FACTOR: 0.8, // multiplier of median font size
  MIN_LINE_THRESHOLD: 2,
  
  // Space detection: gap larger than this inserts space
  SPACE_THRESHOLD_FACTOR: 0.4, // multiplier of median font size
  
  // Paragraph detection: vertical gap larger than this starts new paragraph
  PARAGRAPH_GAP_FACTOR: 1.8, // multiplier of median line height
  
  // Multi-column detection: gap between columns must be this much of page width
  COLUMN_GAP_MIN_RATIO: 0.1,
  
  // Header/footer removal: line must repeat on this % of pages
  HEADER_FOOTER_REPEAT_THRESHOLD: 0.6,
  HEADER_FOOTER_MAX_LENGTH: 120,
  HEADER_FOOTER_LINES_TO_CHECK: 3,
  
  // Scanned PDF detection
  MIN_CHARS_FOR_TEXT_PDF: 200,
  MIN_AVG_CHARS_PER_PAGE: 20,
  SCANNED_PAGE_THRESHOLD: 0.7, // 70% of pages must be empty
  
  // Performance limits
  MAX_PAGES_DEFAULT: 150,
  MAX_PAGES_EXTRACT: 100,
  YIELD_EVERY_N_PAGES: 5,
  
  // PDF.js scale for rendering (OCR)
  OCR_RENDER_SCALE: 2.0,
}

// ============================================================================
// TYPES
// ============================================================================
interface TextItem {
  str: string
  x: number
  y: number
  width: number
  height: number
  fontName: string
  fontSize: number
}

interface TextLine {
  items: TextItem[]
  y: number
  text: string
}

interface PageText {
  pageNum: number
  lines: TextLine[]
  rawText: string
  firstLines: string[]
  lastLines: string[]
}

interface ExtractionResult {
  text: string
  isScanned: boolean
  pageCount: number
  charCount: number
}

// ============================================================================
// MAIN PUBLIC FUNCTION
// ============================================================================

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
      console.log('[Extract] Processing DOCX...')
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      const cleanedText = cleanText(result.value)
      console.log(`[Extract] DOCX complete: ${cleanedText.length} characters`)
      return cleanedText
    }

    // TXT files
    if (fileType === 'text/plain' || file.name.endsWith('.txt')) {
      console.log('[Extract] Processing TXT...')
      const text = await file.text()
      const cleanedText = cleanText(text)
      console.log(`[Extract] TXT complete: ${cleanedText.length} characters`)
      return cleanedText
    }

    // PDF files
    if (fileType === 'application/pdf' || file.name.endsWith('.pdf')) {
      console.log('[Extract] Processing PDF...')
      const result = await extractPDFText(file)
      console.log(`[Extract] PDF complete: ${result.charCount} characters, ${result.pageCount} pages, scanned: ${result.isScanned}`)
      return result.text
    }

    throw new Error('Unsupported file type. Please use PDF, DOCX, or TXT files.')
  } catch (error) {
    console.error('[Extract] Error:', error)
    throw new Error(`Failed to extract text from file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text from PDF with layout awareness
 */
export async function extractPDFText(file: File): Promise<ExtractionResult> {
  try {
    const pdfjsLib = await import('pdfjs-dist')
    
    // Get the installed version and use matching CDN worker
    const version = (pdfjsLib as any).version || '4.4.168'
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`
    
    console.log(`[PDF] Using pdfjs-dist version: ${version}`)

    const arrayBuffer = await file.arrayBuffer()
    
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useSystemFonts: true
    })
    
    const pdf = await loadingTask.promise
    const numPages = pdf.numPages

    console.log(`[PDF] Document has ${numPages} pages`)

    // Check page limit
    const pagesToExtract = Math.min(numPages, CONFIG.MAX_PAGES_EXTRACT)
    if (numPages > CONFIG.MAX_PAGES_EXTRACT) {
      console.log(`[PDF] Limiting extraction to first ${pagesToExtract} pages`)
    }

    // Extract all pages
    const pagesText: PageText[] = []
    let totalChars = 0
    let emptyPages = 0

    for (let pageNum = 1; pageNum <= pagesToExtract; pageNum++) {
      // Yield to prevent UI freeze
      if (pageNum % CONFIG.YIELD_EVERY_N_PAGES === 0) {
        await yieldToMain()
      }

      const page = await pdf.getPage(pageNum)
      const pageText = await extractPageText(page, pageNum)
      pagesText.push(pageText)

      const pageChars = pageText.rawText.length
      totalChars += pageChars

      if (pageChars < CONFIG.MIN_AVG_CHARS_PER_PAGE) {
        emptyPages++
      }

      console.log(`[PDF] Page ${pageNum}/${pagesToExtract}: ${pageChars} characters`)
    }

    // Detect if scanned
    const isScanned = detectScannedPDF(totalChars, emptyPages, pagesToExtract)

    if (isScanned) {
      console.log('[PDF] Detected scanned/image PDF - attempting OCR fallback')
      return await extractPDFTextWithOCR(pdf, pagesToExtract)
    }

    // Remove repeated headers/footers
    const cleanedPages = removeRepeatedHeadersFooters(pagesText)

    // Combine all pages
    let fullText = cleanedPages
      .map(p => p.rawText)
      .join('\n\n')

    // Fix hyphenation
    fullText = fixHyphenation(fullText)

    // Final cleanup
    fullText = cleanText(fullText)

    return {
      text: fullText,
      isScanned: false,
      pageCount: pagesToExtract,
      charCount: fullText.length
    }

  } catch (error) {
    console.error('[PDF] Extraction error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    throw new Error(`PDF extraction failed: ${msg}`)
  }
}

// ============================================================================
// PAGE TEXT EXTRACTION WITH LAYOUT AWARENESS
// ============================================================================

/**
 * Extract text from a single page with layout awareness
 */
async function extractPageText(page: any, pageNum: number): Promise<PageText> {
  const textContent = await page.getTextContent({ includeMarkedContent: true })
  const viewport = page.getViewport({ scale: 1.0 })
  
  // Parse items with positions
  const items: TextItem[] = textContent.items
    .filter((item: any) => item.str && item.str.trim())
    .map((item: any) => ({
      str: item.str,
      x: item.transform[4],
      y: viewport.height - item.transform[5], // Flip Y for top-to-bottom
      width: item.width || estimateWidth(item.str, item.transform),
      height: item.height || Math.abs(item.transform[3]) || 12,
      fontName: item.fontName || '',
      fontSize: Math.abs(item.transform[0]) || Math.abs(item.transform[3]) || 12
    }))

  if (items.length === 0) {
    return {
      pageNum,
      lines: [],
      rawText: '',
      firstLines: [],
      lastLines: []
    }
  }

  // Detect multi-column layout
  const isMultiColumn = detectMultiColumn(items, viewport.width)
  
  let processedItems: TextItem[]
  if (isMultiColumn) {
    // Split into columns and process separately
    processedItems = reorderMultiColumn(items, viewport.width)
  } else {
    processedItems = items
  }

  // Sort for reading order: top to bottom, left to right
  processedItems.sort((a, b) => {
    const yDiff = a.y - b.y
    if (Math.abs(yDiff) > 3) return yDiff
    return a.x - b.x
  })

  // Group into lines
  const lines = groupIntoLines(processedItems)

  // Build raw text with paragraph detection
  const rawText = buildParagraphText(lines)

  // Get first/last lines for header/footer detection
  const lineTexts = lines.map(l => l.text)
  const firstLines = lineTexts.slice(0, CONFIG.HEADER_FOOTER_LINES_TO_CHECK)
  const lastLines = lineTexts.slice(-CONFIG.HEADER_FOOTER_LINES_TO_CHECK)

  return {
    pageNum,
    lines,
    rawText,
    firstLines,
    lastLines
  }
}

/**
 * Estimate text width when not provided
 */
function estimateWidth(str: string, transform: number[]): number {
  const fontSize = Math.abs(transform[0]) || Math.abs(transform[3]) || 12
  return str.length * fontSize * 0.5 // Rough estimate
}

/**
 * Detect multi-column layout by analyzing X distribution
 */
function detectMultiColumn(items: TextItem[], pageWidth: number): boolean {
  if (items.length < 20) return false

  // Get X positions
  const xPositions = items.map(item => item.x)
  const midX = pageWidth / 2
  const gapThreshold = pageWidth * CONFIG.COLUMN_GAP_MIN_RATIO

  // Count items in left and right halves
  let leftCount = 0
  let rightCount = 0
  let gapItems = 0

  for (const x of xPositions) {
    if (x < midX - gapThreshold) leftCount++
    else if (x > midX + gapThreshold) rightCount++
    else gapItems++
  }

  // Multi-column if both sides have significant content and gap is mostly empty
  const total = items.length
  const hasLeftContent = leftCount > total * 0.2
  const hasRightContent = rightCount > total * 0.2
  const gapIsEmpty = gapItems < total * 0.1

  return hasLeftContent && hasRightContent && gapIsEmpty
}

/**
 * Reorder items for multi-column reading (left column first, then right)
 */
function reorderMultiColumn(items: TextItem[], pageWidth: number): TextItem[] {
  const midX = pageWidth / 2
  
  const leftItems = items.filter(item => item.x < midX)
  const rightItems = items.filter(item => item.x >= midX)

  // Sort each column
  leftItems.sort((a, b) => a.y - b.y || a.x - b.x)
  rightItems.sort((a, b) => a.y - b.y || a.x - b.x)

  // Combine: left column first, then right
  return [...leftItems, ...rightItems]
}

/**
 * Group text items into lines based on Y position
 */
function groupIntoLines(items: TextItem[]): TextLine[] {
  if (items.length === 0) return []

  // Calculate median font size for thresholds
  const fontSizes = items.map(item => item.fontSize).sort((a, b) => a - b)
  const medianFontSize = fontSizes[Math.floor(fontSizes.length / 2)] || 12
  const lineThreshold = Math.max(CONFIG.MIN_LINE_THRESHOLD, medianFontSize * CONFIG.LINE_THRESHOLD_FACTOR)
  const spaceThreshold = medianFontSize * CONFIG.SPACE_THRESHOLD_FACTOR

  const lines: TextLine[] = []
  let currentLine: TextItem[] = [items[0]]
  let currentY = items[0].y

  for (let i = 1; i < items.length; i++) {
    const item = items[i]
    
    if (Math.abs(item.y - currentY) > lineThreshold) {
      // Start new line
      lines.push(createLine(currentLine, spaceThreshold))
      currentLine = [item]
      currentY = item.y
    } else {
      currentLine.push(item)
    }
  }

  // Add last line
  if (currentLine.length > 0) {
    lines.push(createLine(currentLine, spaceThreshold))
  }

  return lines
}

/**
 * Create a line from items with proper spacing
 */
function createLine(items: TextItem[], spaceThreshold: number): TextLine {
  // Sort items by X position
  items.sort((a, b) => a.x - b.x)

  let text = ''
  let prevItem: TextItem | null = null

  for (const item of items) {
    if (prevItem) {
      const gap = item.x - (prevItem.x + prevItem.width)
      
      // Add space if gap is significant
      if (gap > spaceThreshold) {
        text += ' '
      } else if (gap > 0 && prevItem.str.match(/[.!?:;,]$/)) {
        // Add space after punctuation
        text += ' '
      }
    }
    
    text += item.str
    prevItem = item
  }

  return {
    items,
    y: items[0].y,
    text: text.trim()
  }
}

/**
 * Build paragraph text with proper spacing
 */
function buildParagraphText(lines: TextLine[]): string {
  if (lines.length === 0) return ''

  // Calculate median line height for paragraph detection
  const lineGaps: number[] = []
  for (let i = 1; i < lines.length; i++) {
    lineGaps.push(Math.abs(lines[i].y - lines[i - 1].y))
  }
  const medianGap = lineGaps.length > 0 
    ? lineGaps.sort((a, b) => a - b)[Math.floor(lineGaps.length / 2)]
    : 15
  const paragraphThreshold = medianGap * CONFIG.PARAGRAPH_GAP_FACTOR

  const paragraphs: string[] = []
  let currentParagraph: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const prevLine = i > 0 ? lines[i - 1] : null

    const shouldBreak = shouldStartNewParagraph(
      line,
      prevLine,
      paragraphThreshold
    )

    if (shouldBreak && currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.join(' '))
      currentParagraph = []
    }

    // Check if it's a list item - keep on its own line
    if (isListItem(line.text)) {
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(' '))
        currentParagraph = []
      }
      paragraphs.push(line.text)
    } else {
      currentParagraph.push(line.text)
    }
  }

  // Add remaining paragraph
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(' '))
  }

  return paragraphs.join('\n\n')
}

/**
 * Determine if a new paragraph should start
 */
function shouldStartNewParagraph(
  line: TextLine,
  prevLine: TextLine | null,
  paragraphThreshold: number
): boolean {
  if (!prevLine) return false

  const gap = Math.abs(line.y - prevLine.y)
  
  // Large vertical gap
  if (gap > paragraphThreshold) return true

  // Previous line looks like a heading
  if (isHeading(prevLine.text)) return true

  // Current line is a list item and previous wasn't
  if (isListItem(line.text) && !isListItem(prevLine.text)) return true

  return false
}

/**
 * Check if text looks like a heading
 */
function isHeading(text: string): boolean {
  const trimmed = text.trim()
  
  // Short line
  if (trimmed.length > 100) return false
  
  // Mostly uppercase
  const upperRatio = (trimmed.match(/[A-Z]/g) || []).length / trimmed.length
  if (upperRatio > 0.6 && trimmed.length < 60) return true

  // Numbered heading pattern
  if (trimmed.match(/^(Chapter|Section|Part|Unit)\s+\d/i)) return true
  if (trimmed.match(/^\d+\.\s+[A-Z]/)) return true

  // Doesn't end with period and is short
  if (!trimmed.match(/[.!?]$/) && trimmed.length < 50) return true

  return false
}

/**
 * Check if text is a list item
 */
function isListItem(text: string): boolean {
  const trimmed = text.trim()
  
  // Bullet patterns
  if (trimmed.match(/^[•●○◦▪▸►-]\s/)) return true
  
  // Numbered patterns
  if (trimmed.match(/^\d+[.)]\s/)) return true
  if (trimmed.match(/^[a-zA-Z][.)]\s/)) return true
  if (trimmed.match(/^\([a-zA-Z0-9]+\)\s/)) return true
  if (trimmed.match(/^[ivxIVX]+[.)]\s/)) return true

  return false
}

// ============================================================================
// HEADER/FOOTER REMOVAL
// ============================================================================

/**
 * Remove repeated headers and footers across pages
 */
function removeRepeatedHeadersFooters(pages: PageText[]): PageText[] {
  if (pages.length < 3) return pages

  // Collect all first and last lines
  const firstLineCounts = new Map<string, number>()
  const lastLineCounts = new Map<string, number>()

  for (const page of pages) {
    for (const line of page.firstLines) {
      const normalized = normalizeForComparison(line)
      if (normalized && normalized.length < CONFIG.HEADER_FOOTER_MAX_LENGTH) {
        firstLineCounts.set(normalized, (firstLineCounts.get(normalized) || 0) + 1)
      }
    }
    for (const line of page.lastLines) {
      const normalized = normalizeForComparison(line)
      if (normalized && normalized.length < CONFIG.HEADER_FOOTER_MAX_LENGTH) {
        lastLineCounts.set(normalized, (lastLineCounts.get(normalized) || 0) + 1)
      }
    }
  }

  // Find lines that repeat on most pages
  const threshold = pages.length * CONFIG.HEADER_FOOTER_REPEAT_THRESHOLD
  const headersToRemove = new Set<string>()
  const footersToRemove = new Set<string>()

  for (const [line, count] of firstLineCounts) {
    if (count >= threshold) headersToRemove.add(line)
  }
  for (const [line, count] of lastLineCounts) {
    if (count >= threshold) footersToRemove.add(line)
  }

  // Also remove common patterns
  const commonPatterns = [
    /^page\s*\d+$/i,
    /^\d+\s*of\s*\d+$/i,
    /^\d+$/,
    /^-\s*\d+\s*-$/,
  ]

  // Filter pages
  return pages.map(page => {
    const filteredLines = page.lines.filter(line => {
      const normalized = normalizeForComparison(line.text)
      
      // Remove if matches repeated header/footer
      if (headersToRemove.has(normalized) || footersToRemove.has(normalized)) {
        return false
      }

      // Remove if matches common pattern
      for (const pattern of commonPatterns) {
        if (pattern.test(line.text.trim())) {
          return false
        }
      }

      return true
    })

    return {
      ...page,
      lines: filteredLines,
      rawText: buildParagraphText(filteredLines)
    }
  })
}

/**
 * Normalize text for comparison (remove numbers, lowercase)
 */
function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/\d+/g, '#')
    .replace(/\s+/g, ' ')
    .trim()
}

// ============================================================================
// HYPHENATION FIX
// ============================================================================

/**
 * Fix hyphenated words split across lines
 */
function fixHyphenation(text: string): string {
  // Fix end-of-line hyphenation
  let result = text.replace(/-\n([a-z])/g, '$1')
  
  // Fix common split patterns (careful - only obvious ones)
  result = result.replace(/\b(\w{2,})\s+(\w{1,2})\b/g, (match, p1, p2) => {
    // Only merge if it creates a real word pattern
    if (p2.length === 1 && p2.match(/[aeiou]/i)) {
      return p1 + p2
    }
    return match
  })

  return result
}

// ============================================================================
// SCANNED PDF DETECTION AND OCR
// ============================================================================

/**
 * Detect if PDF is scanned/image-based
 */
function detectScannedPDF(totalChars: number, emptyPages: number, totalPages: number): boolean {
  // Very few characters overall
  if (totalChars < CONFIG.MIN_CHARS_FOR_TEXT_PDF) {
    return true
  }

  // Most pages are empty
  const emptyRatio = emptyPages / totalPages
  if (emptyRatio > CONFIG.SCANNED_PAGE_THRESHOLD) {
    return true
  }

  return false
}

/**
 * Extract text from scanned PDF using OCR
 * This is a placeholder - implement with Tesseract.js or server-side OCR
 */
async function extractPDFTextWithOCR(pdf: any, maxPages: number): Promise<ExtractionResult> {
  console.log('[OCR] Starting OCR extraction...')
  
  // For now, attempt basic extraction and inform user
  // Full OCR implementation would use tesseract.js or server-side processing
  
  let fullText = ''
  
  for (let pageNum = 1; pageNum <= Math.min(maxPages, 30); pageNum++) {
    await yieldToMain()
    
    try {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .filter((str: string) => str.trim())
        .join(' ')
      
      if (pageText.trim()) {
        fullText += pageText + '\n\n'
      }
    } catch (error) {
      console.error(`[OCR] Error on page ${pageNum}:`, error)
    }
  }

  // If still no text, throw informative error
  if (fullText.trim().length < 50) {
    throw new Error(
      'This PDF appears to be scanned images without selectable text. ' +
      'OCR extraction is not yet available. Please try a text-based PDF or convert to text first.'
    )
  }

  return {
    text: cleanText(fullText),
    isScanned: true,
    pageCount: Math.min(maxPages, 30),
    charCount: fullText.length
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Yield to main thread to prevent UI freeze
 */
async function yieldToMain(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * Clean extracted text
 */
function cleanText(text: string): string {
  return text
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    // Remove excessive blank lines
    .replace(/\n{4,}/g, '\n\n\n')
    // Normalize spaces
    .replace(/[ \t]+/g, ' ')
    // Remove leading/trailing whitespace from lines
    .replace(/^[ \t]+|[ \t]+$/gm, '')
    // Remove standalone page numbers
    .replace(/^Page\s+\d+\s*$/gm, '')
    .replace(/^\d+\s*$/gm, '')
    // Final trim
    .trim()
}

// ============================================================================
// FILE VALIDATION
// ============================================================================

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
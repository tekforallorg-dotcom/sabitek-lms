/**
 * Cover Letter Export - PDF and DOCX generation
 * 
 * PDF: Uses jsPDF with professional styling
 * DOCX: Uses docx library with clean formatting
 */

import jsPDF from 'jspdf'
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  AlignmentType,
} from 'docx'

// ============================================
// TYPES
// ============================================

export interface CoverLetterExportData {
  fullName: string
  email: string
  phone: string
  location: string
  targetRole: string
  companyName?: string
  letterText: string
  sections?: {
    header?: string
    opening?: string
    value?: string
    fit?: string
    closing?: string
    signature?: string
  }
}

// ============================================
// SPECIFICATIONS
// ============================================

const LETTER_SPEC = {
  page: {
    marginTop: 25,
    marginRight: 25,
    marginBottom: 25,
    marginLeft: 25,
  },
  font: {
    body: 'helvetica',
  },
  size: {
    name: 14,
    contact: 10,
    date: 10,
    body: 11,
    signature: 11,
  },
  lineHeight: 1.5,
  colors: {
    primary: [0, 0, 0] as [number, number, number],
    secondary: [51, 51, 51] as [number, number, number],
    muted: [102, 102, 102] as [number, number, number],
  },
}

// ============================================
// PDF EXPORT
// ============================================

export async function generateCoverLetterPDF(data: CoverLetterExportData): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const { page, font, size, colors } = LETTER_SPEC
  const pageWidth = 210
  const contentWidth = pageWidth - page.marginLeft - page.marginRight
  let y = page.marginTop

  // Helper: Add text with word wrap
  const addText = (
    text: string,
    fontSize: number,
    color: [number, number, number] = colors.primary,
    align: 'left' | 'center' | 'right' = 'left',
    bold: boolean = false
  ): number => {
    pdf.setFont(font.body, bold ? 'bold' : 'normal')
    pdf.setFontSize(fontSize)
    pdf.setTextColor(...color)
    
    const lines = pdf.splitTextToSize(text, contentWidth)
    const lineHeight = fontSize * 0.4
    
    lines.forEach((line: string) => {
      let x = page.marginLeft
      if (align === 'center') {
        x = pageWidth / 2
      } else if (align === 'right') {
        x = pageWidth - page.marginRight
      }
      
      pdf.text(line, x, y, { align })
      y += lineHeight
    })
    
    return y
  }

  // Helper: Add spacing
  const addSpace = (mm: number) => {
    y += mm
  }

  // ========================================
  // HEADER - Sender Info
  // ========================================
  
  // Name
  addText(data.fullName || 'Your Name', size.name, colors.primary, 'left', true)
  addSpace(2)
  
  // Contact info
  const contactParts = [data.email, data.phone, data.location].filter(Boolean)
  if (contactParts.length > 0) {
    addText(contactParts.join(' • '), size.contact, colors.secondary)
  }
  addSpace(8)

  // ========================================
  // DATE
  // ========================================
  
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  addText(today, size.date, colors.muted)
  addSpace(6)

  // ========================================
  // RECIPIENT (if company provided)
  // ========================================
  
  if (data.companyName) {
    addText(data.companyName, size.body, colors.primary, 'left', true)
    addSpace(2)
    addText(`Re: ${data.targetRole} Position`, size.body, colors.secondary)
    addSpace(8)
  }

  // ========================================
  // SALUTATION
  // ========================================
  
  addText('Dear Hiring Manager,', size.body, colors.primary)
  addSpace(6)

  // ========================================
  // LETTER BODY
  // ========================================
  
  // Split letter into paragraphs
  const paragraphs = data.letterText
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0 && !p.startsWith('Sincerely'))

  for (const paragraph of paragraphs) {
    // Check if we need a new page
    if (y > 260) {
      pdf.addPage()
      y = page.marginTop
    }
    
    addText(paragraph, size.body, colors.primary)
    addSpace(5)
  }

  // ========================================
  // CLOSING & SIGNATURE
  // ========================================
  
  addSpace(4)
  addText('Sincerely,', size.signature, colors.primary)
  addSpace(10)
  addText(data.fullName || 'Your Name', size.signature, colors.primary, 'left', true)

  return pdf.output('blob')
}

// ============================================
// DOCX EXPORT
// ============================================

export async function generateCoverLetterDOCX(data: CoverLetterExportData): Promise<Blob> {
  const children: Paragraph[] = []

  // Helper: Create paragraph
  const createParagraph = (
    text: string,
    options: {
      bold?: boolean
      size?: number
      spacing?: { after?: number; before?: number }
      alignment?: typeof AlignmentType[keyof typeof AlignmentType]
      color?: string
    } = {}
  ): Paragraph => {
    return new Paragraph({
      children: [
        new TextRun({
          text,
          bold: options.bold || false,
          size: (options.size || 22) * 2, // docx uses half-points
          color: options.color || '000000',
          font: 'Arial',
        }),
      ],
      spacing: options.spacing || { after: 200 },
      alignment: options.alignment || AlignmentType.LEFT,
    })
  }

  // ========================================
  // HEADER - Sender Info
  // ========================================

  // Name
  children.push(createParagraph(data.fullName || 'Your Name', {
    bold: true,
    size: 28,
    spacing: { after: 100 },
  }))

  // Contact info
  const contactParts = [data.email, data.phone, data.location].filter(Boolean)
  if (contactParts.length > 0) {
    children.push(createParagraph(contactParts.join(' • '), {
      size: 20,
      color: '666666',
      spacing: { after: 400 },
    }))
  }

  // ========================================
  // DATE
  // ========================================

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  children.push(createParagraph(today, {
    size: 22,
    color: '666666',
    spacing: { after: 300 },
  }))

  // ========================================
  // RECIPIENT
  // ========================================

  if (data.companyName) {
    children.push(createParagraph(data.companyName, {
      bold: true,
      size: 22,
      spacing: { after: 100 },
    }))
    children.push(createParagraph(`Re: ${data.targetRole} Position`, {
      size: 22,
      color: '333333',
      spacing: { after: 400 },
    }))
  }

  // ========================================
  // SALUTATION
  // ========================================

  children.push(createParagraph('Dear Hiring Manager,', {
    size: 22,
    spacing: { after: 300 },
  }))

  // ========================================
  // LETTER BODY
  // ========================================

  const paragraphs = data.letterText
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0 && !p.startsWith('Sincerely'))

  for (const paragraph of paragraphs) {
    children.push(createParagraph(paragraph, {
      size: 22,
      spacing: { after: 250 },
    }))
  }

  // ========================================
  // CLOSING & SIGNATURE
  // ========================================

  children.push(createParagraph('Sincerely,', {
    size: 22,
    spacing: { before: 200, after: 400 },
  }))

  children.push(createParagraph(data.fullName || 'Your Name', {
    bold: true,
    size: 22,
  }))

  // ========================================
  // CREATE DOCUMENT
  // ========================================

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,    // 1 inch in twips
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children,
    }],
  })

  return await Packer.toBlob(doc)
}

// ============================================
// PLAIN TEXT EXPORT (Bonus)
// ============================================

export function generateCoverLetterText(data: CoverLetterExportData): string {
  const lines: string[] = []

  // Header
  lines.push(data.fullName || 'Your Name')
  const contactParts = [data.email, data.phone, data.location].filter(Boolean)
  if (contactParts.length > 0) {
    lines.push(contactParts.join(' • '))
  }
  lines.push('')

  // Date
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  lines.push(today)
  lines.push('')

  // Recipient
  if (data.companyName) {
    lines.push(data.companyName)
    lines.push(`Re: ${data.targetRole} Position`)
    lines.push('')
  }

  // Salutation
  lines.push('Dear Hiring Manager,')
  lines.push('')

  // Body
  lines.push(data.letterText)
  lines.push('')

  // Signature (if not already in letterText)
  if (!data.letterText.includes('Sincerely')) {
    lines.push('Sincerely,')
    lines.push('')
    lines.push(data.fullName || 'Your Name')
  }

  return lines.join('\n')
}
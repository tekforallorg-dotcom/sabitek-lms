/**
 * CV Export v2 - ATS-Optimized PDF and DOCX generation
 * 
 * PDF: Uses jsPDF with ATS-friendly styling (no colors, single column)
 * DOCX: Uses docx library with professional formatting
 */

import jsPDF from 'jspdf'
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  AlignmentType,
  BorderStyle,
  TabStopPosition,
  TabStopType,
} from 'docx'

// Support both old CVData format (from page.tsx) and new format (from lib/cv)
export interface CVData {
  fullName: string
  email: string
  phone: string
  location: string
  targetRole: string
  sections: {
    summary?: string
    skills?: string[] | Array<{ label: string; items: string[] }>
    experience?: Array<{
      company: string
      title: string
      duration: string
      location?: string
      bullets: string[] | Array<{ text: string }>
    }>
    projects?: Array<{
      name: string
      description: string
      technologies?: string[]
    }>
    education?: Array<{
      institution: string
      degree: string
      year: string
    }>
    certifications?: Array<{
      name: string
      issuer: string
      year?: string
    }>
  }
}

// ATS-friendly specification
const ATS_SPEC = {
  page: {
    marginTop: 15,
    marginRight: 15,
    marginBottom: 15,
    marginLeft: 15,
  },
  font: {
    body: 'helvetica',
  },
  size: {
    name: 18,
    sectionHeading: 11,
    jobTitle: 11,
    body: 10,
    small: 9,
  },
  colors: {
    primary: [0, 0, 0] as [number, number, number],      // Black
    secondary: [51, 51, 51] as [number, number, number], // Dark gray
    muted: [102, 102, 102] as [number, number, number],  // Gray
    line: [180, 180, 180] as [number, number, number],   // Light gray
  },
}

/**
 * Normalize skills to string array
 */
function normalizeSkills(skills: CVData['sections']['skills']): string[] {
  if (!skills || skills.length === 0) return []
  
  // Check if it's the new grouped format
  if (typeof skills[0] === 'object' && 'label' in skills[0]) {
    return (skills as Array<{ label: string; items: string[] }>)
      .flatMap(group => group.items)
  }
  
  return skills as string[]
}

/**
 * Normalize bullets to string array
 */
function normalizeBullets(bullets: string[] | Array<{ text: string }>): string[] {
  if (!bullets || bullets.length === 0) return []
  
  if (typeof bullets[0] === 'object' && 'text' in bullets[0]) {
    return (bullets as Array<{ text: string }>).map(b => b.text)
  }
  
  return bullets as string[]
}

/**
 * Generate ATS-Optimized CV as PDF
 * 
 * Features:
 * - Single column layout
 * - Black/gray colors only (ATS-safe)
 * - Standard Helvetica font
 * - Clear section headings with underlines
 * - Proper spacing and margins
 */
export async function generateCVPDF(data: CVData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = ATS_SPEC.page.marginLeft
  const contentWidth = pageWidth - 2 * margin
  let y = margin

  const { colors, size, font } = ATS_SPEC

  // Helper: Check and handle page break
  const checkPageBreak = (neededSpace: number): void => {
    if (y + neededSpace > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
  }

  // Helper: Add text with word wrap
  const addText = (
    text: string,
    fontSize: number,
    color: [number, number, number] = colors.primary,
    fontStyle: 'normal' | 'bold' | 'italic' = 'normal',
    align: 'left' | 'center' | 'right' = 'left'
  ): void => {
    doc.setFontSize(fontSize)
    doc.setTextColor(...color)
    doc.setFont(font.body, fontStyle)
    
    const lines = doc.splitTextToSize(text, contentWidth)
    const lineHeight = fontSize * 0.45
    
    for (const line of lines) {
      checkPageBreak(lineHeight)
      
      let x = margin
      if (align === 'center') {
        x = pageWidth / 2
      } else if (align === 'right') {
        x = pageWidth - margin
      }
      
      doc.text(line, x, y, { align })
      y += lineHeight
    }
  }

  // Helper: Add section heading with underline
  const addSectionHeading = (title: string): void => {
    checkPageBreak(12)
    y += 4
    
    doc.setFontSize(size.sectionHeading)
    doc.setTextColor(...colors.primary)
    doc.setFont(font.body, 'bold')
    doc.text(title.toUpperCase(), margin, y)
    
    y += 1.5
    doc.setDrawColor(...colors.line)
    doc.setLineWidth(0.3)
    doc.line(margin, y, pageWidth - margin, y)
    y += 4
  }

  // ===== HEADER =====
  // Name (centered, bold)
  doc.setFontSize(size.name)
  doc.setTextColor(...colors.primary)
  doc.setFont(font.body, 'bold')
  doc.text(data.fullName.toUpperCase(), pageWidth / 2, y, { align: 'center' })
  y += 6

  // Target role/headline (centered)
  if (data.targetRole) {
    doc.setFontSize(size.body)
    doc.setTextColor(...colors.secondary)
    doc.setFont(font.body, 'normal')
    doc.text(data.targetRole, pageWidth / 2, y, { align: 'center' })
    y += 5
  }

  // Contact info (centered, single line)
  const contactParts = [data.location, data.email, data.phone].filter(Boolean)
  if (contactParts.length > 0) {
    doc.setFontSize(size.small)
    doc.setTextColor(...colors.muted)
    doc.setFont(font.body, 'normal')
    doc.text(contactParts.join('  •  '), pageWidth / 2, y, { align: 'center' })
    y += 6
  }

  // ===== PROFESSIONAL SUMMARY =====
  if (data.sections.summary) {
    addSectionHeading('Professional Summary')
    addText(data.sections.summary, size.body, colors.secondary)
    y += 2
  }

  // ===== SKILLS =====
  const skills = normalizeSkills(data.sections.skills)
  if (skills.length > 0) {
    addSectionHeading('Skills')
    
    // Check if we have grouped skills (new format)
    if (data.sections.skills && typeof data.sections.skills[0] === 'object' && 'label' in data.sections.skills[0]) {
      const grouped = data.sections.skills as Array<{ label: string; items: string[] }>
      for (const group of grouped) {
        checkPageBreak(6)
        doc.setFontSize(size.body)
        doc.setTextColor(...colors.primary)
        doc.setFont(font.body, 'bold')
        doc.text(`${group.label}: `, margin, y)
        
        const labelWidth = doc.getTextWidth(`${group.label}: `)
        doc.setFont(font.body, 'normal')
        doc.setTextColor(...colors.secondary)
        
        const itemsText = group.items.join(', ')
        const itemsLines = doc.splitTextToSize(itemsText, contentWidth - labelWidth - 2)
        
        for (let i = 0; i < itemsLines.length; i++) {
          if (i === 0) {
            doc.text(itemsLines[i], margin + labelWidth, y)
          } else {
            y += size.body * 0.45
            checkPageBreak(size.body * 0.45)
            doc.text(itemsLines[i], margin, y)
          }
        }
        y += size.body * 0.5
      }
    } else {
      // Flat list
      addText(skills.join('  •  '), size.body, colors.secondary)
    }
    y += 2
  }

  // ===== PROFESSIONAL EXPERIENCE =====
  if (data.sections.experience && data.sections.experience.length > 0) {
    addSectionHeading('Professional Experience')
    
    for (const exp of data.sections.experience) {
      checkPageBreak(20)
      
      // Job title and duration on same line
      doc.setFontSize(size.jobTitle)
      doc.setTextColor(...colors.primary)
      doc.setFont(font.body, 'bold')
      doc.text(exp.title, margin, y)
      
      doc.setFontSize(size.small)
      doc.setTextColor(...colors.muted)
      doc.setFont(font.body, 'normal')
      doc.text(exp.duration, pageWidth - margin, y, { align: 'right' })
      y += 4

      // Company and location
      doc.setFontSize(size.body)
      doc.setTextColor(...colors.secondary)
      doc.setFont(font.body, 'italic')
      const companyText = exp.location ? `${exp.company}, ${exp.location}` : exp.company
      doc.text(companyText, margin, y)
      y += 4

      // Bullets
      const bullets = normalizeBullets(exp.bullets)
      for (const bullet of bullets.filter(b => b && b.trim())) {
        checkPageBreak(8)
        doc.setFontSize(size.body)
        doc.setTextColor(...colors.secondary)
        doc.setFont(font.body, 'normal')
        
        const bulletText = `•  ${bullet}`
        const lines = doc.splitTextToSize(bulletText, contentWidth - 3)
        
        for (let i = 0; i < lines.length; i++) {
          checkPageBreak(size.body * 0.45)
          doc.text(lines[i], margin + (i === 0 ? 0 : 4), y)
          y += size.body * 0.45
        }
        y += 1
      }
      
      y += 3
    }
  }

  // ===== EDUCATION =====
  if (data.sections.education && data.sections.education.length > 0) {
    addSectionHeading('Education')
    
    for (const edu of data.sections.education) {
      checkPageBreak(10)
      
      // Degree and year
      doc.setFontSize(size.body)
      doc.setTextColor(...colors.primary)
      doc.setFont(font.body, 'bold')
      doc.text(edu.degree, margin, y)
      
      if (edu.year) {
        doc.setFontSize(size.small)
        doc.setTextColor(...colors.muted)
        doc.setFont(font.body, 'normal')
        doc.text(edu.year, pageWidth - margin, y, { align: 'right' })
      }
      y += 4

      // Institution
      doc.setFontSize(size.body)
      doc.setTextColor(...colors.secondary)
      doc.setFont(font.body, 'normal')
      doc.text(edu.institution, margin, y)
      y += 5
    }
  }

  // ===== CERTIFICATIONS =====
  if (data.sections.certifications && data.sections.certifications.length > 0) {
    addSectionHeading('Certifications')
    
    for (const cert of data.sections.certifications) {
      checkPageBreak(6)
      
      doc.setFontSize(size.body)
      doc.setTextColor(...colors.secondary)
      doc.setFont(font.body, 'normal')
      
      let certText = cert.name
      if (cert.issuer) certText += ` — ${cert.issuer}`
      if (cert.year) certText += ` (${cert.year})`
      
      doc.text(certText, margin, y)
      y += 4
    }
  }

  // ===== PROJECTS =====
  if (data.sections.projects && data.sections.projects.length > 0) {
    addSectionHeading('Projects')
    
    for (const project of data.sections.projects) {
      checkPageBreak(12)
      
      // Project name
      doc.setFontSize(size.body)
      doc.setTextColor(...colors.primary)
      doc.setFont(font.body, 'bold')
      doc.text(project.name, margin, y)
      y += 4

      // Description
      if (project.description) {
        doc.setFont(font.body, 'normal')
        doc.setTextColor(...colors.secondary)
        const descLines = doc.splitTextToSize(project.description, contentWidth)
        for (const line of descLines) {
          checkPageBreak(size.body * 0.45)
          doc.text(line, margin, y)
          y += size.body * 0.45
        }
      }

      // Technologies
      if (project.technologies && project.technologies.length > 0) {
        y += 1
        doc.setFontSize(size.small)
        doc.setTextColor(...colors.muted)
        doc.setFont(font.body, 'italic')
        doc.text(`Technologies: ${project.technologies.join(', ')}`, margin, y)
        y += 4
      }
      
      y += 2
    }
  }

  return doc.output('blob')
}

/**
 * Generate ATS-Optimized CV as DOCX
 */
export async function generateCVDOCX(data: CVData): Promise<Blob> {
  const children: Paragraph[] = []
  
  // Tab stop for right-aligned dates
  const rightTabStop = TabStopPosition.MAX

  // ===== HEADER =====
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.fullName.toUpperCase(),
          bold: true,
          size: 32,
          font: 'Calibri',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    })
  )

  // Target role
  if (data.targetRole) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: data.targetRole,
            size: 22,
            color: '333333',
            font: 'Calibri',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
      })
    )
  }

  // Contact info
  const contactParts = [data.location, data.email, data.phone].filter(Boolean)
  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactParts.join('  •  '),
            size: 20,
            color: '666666',
            font: 'Calibri',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    )
  }

  // Helper: Add section heading
  const addHeading = (title: string) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 22,
            font: 'Calibri',
          }),
        ],
        spacing: { before: 240, after: 80 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 8, color: 'CCCCCC' },
        },
      })
    )
  }

  // ===== PROFESSIONAL SUMMARY =====
  if (data.sections.summary) {
    addHeading('Professional Summary')
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: data.sections.summary,
            size: 22,
            font: 'Calibri',
          }),
        ],
        spacing: { after: 120 },
      })
    )
  }

  // ===== SKILLS =====
  const skills = normalizeSkills(data.sections.skills)
  if (skills.length > 0) {
    addHeading('Skills')
    
    // Check for grouped format
    if (data.sections.skills && typeof data.sections.skills[0] === 'object' && 'label' in data.sections.skills[0]) {
      const grouped = data.sections.skills as Array<{ label: string; items: string[] }>
      for (const group of grouped) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${group.label}: `,
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
              new TextRun({
                text: group.items.join(', '),
                size: 22,
                font: 'Calibri',
              }),
            ],
            spacing: { after: 60 },
          })
        )
      }
    } else {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: skills.join('  •  '),
              size: 22,
              font: 'Calibri',
            }),
          ],
          spacing: { after: 120 },
        })
      )
    }
  }

  // ===== PROFESSIONAL EXPERIENCE =====
  if (data.sections.experience && data.sections.experience.length > 0) {
    addHeading('Professional Experience')

    for (const exp of data.sections.experience) {
      // Title and Duration
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.title,
              bold: true,
              size: 22,
              font: 'Calibri',
            }),
            new TextRun({
              text: '\t',
            }),
            new TextRun({
              text: exp.duration,
              size: 20,
              color: '666666',
              font: 'Calibri',
            }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: rightTabStop }],
          spacing: { before: 120 },
        })
      )

      // Company
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.location ? `${exp.company}, ${exp.location}` : exp.company,
              italics: true,
              size: 22,
              color: '444444',
              font: 'Calibri',
            }),
          ],
          spacing: { after: 60 },
        })
      )

      // Bullets
      const bullets = normalizeBullets(exp.bullets)
      for (const bullet of bullets.filter(b => b && b.trim())) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `•  ${bullet}`,
                size: 22,
                font: 'Calibri',
              }),
            ],
            indent: { left: 240 },
            spacing: { after: 40 },
          })
        )
      }
    }
  }

  // ===== EDUCATION =====
  if (data.sections.education && data.sections.education.length > 0) {
    addHeading('Education')

    for (const edu of data.sections.education) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.degree,
              bold: true,
              size: 22,
              font: 'Calibri',
            }),
            new TextRun({
              text: '\t',
            }),
            new TextRun({
              text: edu.year || '',
              size: 20,
              color: '666666',
              font: 'Calibri',
            }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: rightTabStop }],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: edu.institution,
              size: 22,
              color: '444444',
              font: 'Calibri',
            }),
          ],
          spacing: { after: 80 },
        })
      )
    }
  }

  // ===== CERTIFICATIONS =====
  if (data.sections.certifications && data.sections.certifications.length > 0) {
    addHeading('Certifications')

    for (const cert of data.sections.certifications) {
      let certText = cert.name
      if (cert.issuer) certText += ` — ${cert.issuer}`
      if (cert.year) certText += ` (${cert.year})`
      
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: certText,
              size: 22,
              font: 'Calibri',
            }),
          ],
          spacing: { after: 40 },
        })
      )
    }
  }

  // ===== PROJECTS =====
  if (data.sections.projects && data.sections.projects.length > 0) {
    addHeading('Projects')

    for (const project of data.sections.projects) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: project.name,
              bold: true,
              size: 22,
              font: 'Calibri',
            }),
          ],
        })
      )

      if (project.description) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: project.description,
                size: 22,
                font: 'Calibri',
              }),
            ],
          })
        )
      }

      if (project.technologies && project.technologies.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Technologies: ${project.technologies.join(', ')}`,
                italics: true,
                size: 20,
                color: '666666',
                font: 'Calibri',
              }),
            ],
            spacing: { after: 80 },
          })
        )
      }
    }
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,  // 0.5 inch
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  })

  return await Packer.toBlob(doc)
}
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  TabStopPosition,
  TabStopType,
  BorderStyle,
  Packer,
  convertInchesToTwip,
  SectionType
} from 'docx'

// Types
interface CVData {
  basics: {
    fullName: string
    email?: string
    phone?: string
    location?: string
    links?: Array<{ label: string; url: string }>
  }
  summary?: string
  skills?: string[]
  experience?: Array<{
    company: string
    title: string
    duration: string
    location?: string
    bullets: string[]
  }>
  education?: Array<{
    institution: string
    degree: string
    year: string
  }>
  projects?: Array<{
    name: string
    description: string
    technologies?: string[]
  }>
  certifications?: Array<{
    name: string
    issuer: string
    year?: string
  }>
}

type TemplateType = 'ATS_1PAGE' | 'ATS_2PAGE' | 'TECH_PROJECTS'

// ============================================
// STYLE CONSTANTS
// ============================================

const STYLES = {
  fonts: {
    primary: 'Calibri',
    heading: 'Calibri Light'
  },
  sizes: {
    name: 28,
    sectionHeading: 13,
    jobTitle: 11,
    body: 10.5,
    small: 9.5
  },
  colors: {
    primary: '1a1a1a',
    secondary: '4a4a4a',
    muted: '6b7280'
  },
  spacing: {
    sectionGap: 240,
    paragraphGap: 120,
    bulletGap: 80
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create header with name and contact info
 */
function createHeader(basics: CVData['basics']): Paragraph[] {
  const paragraphs: Paragraph[] = []

  // Name
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: basics.fullName || 'Your Name',
          bold: true,
          size: STYLES.sizes.name * 2, // docx uses half-points
          font: STYLES.fonts.heading,
          color: STYLES.colors.primary
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    })
  )

  // Contact info line
  const contactParts: string[] = []
  if (basics.email) contactParts.push(basics.email)
  if (basics.phone) contactParts.push(basics.phone)
  if (basics.location) contactParts.push(basics.location)
  
  basics.links?.forEach(link => {
    contactParts.push(link.url.replace(/^https?:\/\//, ''))
  })

  if (contactParts.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactParts.join('  |  '),
            size: STYLES.sizes.small * 2,
            font: STYLES.fonts.primary,
            color: STYLES.colors.secondary
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        border: {
          bottom: {
            color: STYLES.colors.primary,
            space: 10,
            style: BorderStyle.SINGLE,
            size: 12
          }
        }
      })
    )
  }

  return paragraphs
}

/**
 * Create section heading
 */
function createSectionHeading(title: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        size: STYLES.sizes.sectionHeading * 2,
        font: STYLES.fonts.primary,
        color: STYLES.colors.primary
      })
    ],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: STYLES.spacing.sectionGap, after: 100 },
    border: {
      bottom: {
        color: 'e5e7eb',
        space: 4,
        style: BorderStyle.SINGLE,
        size: 6
      }
    }
  })
}

/**
 * Create summary section
 */
function createSummarySection(summary: string): Paragraph[] {
  return [
    createSectionHeading('Professional Summary'),
    new Paragraph({
      children: [
        new TextRun({
          text: summary,
          size: STYLES.sizes.body * 2,
          font: STYLES.fonts.primary,
          color: STYLES.colors.secondary
        })
      ],
      spacing: { after: STYLES.spacing.paragraphGap },
      alignment: AlignmentType.JUSTIFIED
    })
  ]
}

/**
 * Create skills section
 */
function createSkillsSection(skills: string[]): Paragraph[] {
  return [
    createSectionHeading('Skills & Expertise'),
    new Paragraph({
      children: [
        new TextRun({
          text: skills.join('  •  '),
          size: STYLES.sizes.body * 2,
          font: STYLES.fonts.primary,
          color: STYLES.colors.secondary
        })
      ],
      spacing: { after: STYLES.spacing.paragraphGap }
    })
  ]
}

/**
 * Create experience section
 */
function createExperienceSection(experience: CVData['experience']): Paragraph[] {
  const paragraphs: Paragraph[] = [createSectionHeading('Professional Experience')]

  experience?.forEach((exp, idx) => {
    // Job title and duration on same line with tab stop
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: exp.title,
            bold: true,
            size: STYLES.sizes.jobTitle * 2,
            font: STYLES.fonts.primary,
            color: STYLES.colors.primary
          }),
          new TextRun({
            text: '\t' + exp.duration,
            size: STYLES.sizes.small * 2,
            font: STYLES.fonts.primary,
            color: STYLES.colors.muted
          })
        ],
        tabStops: [
          {
            type: TabStopType.RIGHT,
            position: TabStopPosition.MAX
          }
        ],
        spacing: { before: idx > 0 ? 200 : 0 }
      })
    )

    // Company and location
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: exp.company,
            size: STYLES.sizes.body * 2,
            font: STYLES.fonts.primary,
            color: STYLES.colors.secondary
          }),
          ...(exp.location ? [
            new TextRun({
              text: '  |  ' + exp.location,
              size: STYLES.sizes.small * 2,
              font: STYLES.fonts.primary,
              color: STYLES.colors.muted
            })
          ] : [])
        ],
        spacing: { after: 60 }
      })
    )

    // Bullets
    exp.bullets?.forEach(bullet => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: bullet,
              size: STYLES.sizes.body * 2,
              font: STYLES.fonts.primary,
              color: STYLES.colors.secondary
            })
          ],
          bullet: { level: 0 },
          spacing: { after: STYLES.spacing.bulletGap },
          indent: { left: convertInchesToTwip(0.25) }
        })
      )
    })
  })

  return paragraphs
}

/**
 * Create education section
 */
function createEducationSection(education: CVData['education']): Paragraph[] {
  const paragraphs: Paragraph[] = [createSectionHeading('Education')]

  education?.forEach(edu => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: edu.institution,
            bold: true,
            size: STYLES.sizes.body * 2,
            font: STYLES.fonts.primary,
            color: STYLES.colors.primary
          }),
          new TextRun({
            text: '\t' + edu.year,
            size: STYLES.sizes.small * 2,
            font: STYLES.fonts.primary,
            color: STYLES.colors.muted
          })
        ],
        tabStops: [
          {
            type: TabStopType.RIGHT,
            position: TabStopPosition.MAX
          }
        ]
      })
    )

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: edu.degree,
            size: STYLES.sizes.body * 2,
            font: STYLES.fonts.primary,
            color: STYLES.colors.secondary
          })
        ],
        spacing: { after: STYLES.spacing.paragraphGap }
      })
    )
  })

  return paragraphs
}

/**
 * Create projects section
 */
function createProjectsSection(projects: CVData['projects']): Paragraph[] {
  const paragraphs: Paragraph[] = [createSectionHeading('Projects')]

  projects?.forEach(proj => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: proj.name,
            bold: true,
            size: STYLES.sizes.body * 2,
            font: STYLES.fonts.primary,
            color: STYLES.colors.primary
          })
        ]
      })
    )

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: proj.description,
            size: STYLES.sizes.body * 2,
            font: STYLES.fonts.primary,
            color: STYLES.colors.secondary
          })
        ],
        spacing: { after: proj.technologies?.length ? 40 : STYLES.spacing.paragraphGap }
      })
    )

    if (proj.technologies && proj.technologies.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Technologies: ' + proj.technologies.join(', '),
              italics: true,
              size: STYLES.sizes.small * 2,
              font: STYLES.fonts.primary,
              color: STYLES.colors.muted
            })
          ],
          spacing: { after: STYLES.spacing.paragraphGap }
        })
      )
    }
  })

  return paragraphs
}

/**
 * Create certifications section
 */
function createCertificationsSection(certifications: CVData['certifications']): Paragraph[] {
  const paragraphs: Paragraph[] = [createSectionHeading('Certifications')]

  certifications?.forEach(cert => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cert.name,
            size: STYLES.sizes.body * 2,
            font: STYLES.fonts.primary,
            color: STYLES.colors.primary
          }),
          ...(cert.year ? [
            new TextRun({
              text: ` (${cert.year})`,
              size: STYLES.sizes.small * 2,
              font: STYLES.fonts.primary,
              color: STYLES.colors.muted
            })
          ] : []),
          new TextRun({
            text: ' — ' + cert.issuer,
            size: STYLES.sizes.small * 2,
            font: STYLES.fonts.primary,
            color: STYLES.colors.secondary
          })
        ],
        spacing: { after: STYLES.spacing.bulletGap }
      })
    )
  })

  return paragraphs
}

// ============================================
// TEMPLATE BUILDERS
// ============================================

/**
 * Build ATS 1-Page template
 */
function buildATS1Page(data: CVData): Paragraph[] {
  const sections: Paragraph[] = []

  sections.push(...createHeader(data.basics))

  if (data.summary) {
    sections.push(...createSummarySection(data.summary))
  }

  if (data.skills && data.skills.length > 0) {
    sections.push(...createSkillsSection(data.skills.slice(0, 20)))
  }

  if (data.experience && data.experience.length > 0) {
    sections.push(...createExperienceSection(data.experience.slice(0, 4)))
  }

  if (data.education && data.education.length > 0) {
    sections.push(...createEducationSection(data.education))
  }

  if (data.certifications && data.certifications.length > 0) {
    sections.push(...createCertificationsSection(data.certifications.slice(0, 4)))
  }

  return sections
}

/**
 * Build ATS 2-Page template
 */
function buildATS2Page(data: CVData): Paragraph[] {
  const sections: Paragraph[] = []

  sections.push(...createHeader(data.basics))

  if (data.summary) {
    sections.push(...createSummarySection(data.summary))
  }

  if (data.skills && data.skills.length > 0) {
    sections.push(...createSkillsSection(data.skills.slice(0, 30)))
  }

  if (data.experience && data.experience.length > 0) {
    sections.push(...createExperienceSection(data.experience))
  }

  if (data.education && data.education.length > 0) {
    sections.push(...createEducationSection(data.education))
  }

  if (data.projects && data.projects.length > 0) {
    sections.push(...createProjectsSection(data.projects))
  }

  if (data.certifications && data.certifications.length > 0) {
    sections.push(...createCertificationsSection(data.certifications))
  }

  return sections
}

/**
 * Build Tech Projects template (projects emphasized)
 */
function buildTechProjects(data: CVData): Paragraph[] {
  const sections: Paragraph[] = []

  sections.push(...createHeader(data.basics))

  if (data.summary) {
    sections.push(...createSummarySection(data.summary))
  }

  if (data.skills && data.skills.length > 0) {
    sections.push(...createSkillsSection(data.skills.slice(0, 25)))
  }

  // Projects come before experience
  if (data.projects && data.projects.length > 0) {
    sections.push(...createProjectsSection(data.projects))
  }

  if (data.experience && data.experience.length > 0) {
    sections.push(...createExperienceSection(data.experience))
  }

  if (data.education && data.education.length > 0) {
    sections.push(...createEducationSection(data.education))
  }

  if (data.certifications && data.certifications.length > 0) {
    sections.push(...createCertificationsSection(data.certifications))
  }

  return sections
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Generate DOCX from CV data using docx library
 */
export async function generateCVDOCX(
  data: CVData,
  template: TemplateType = 'ATS_1PAGE'
): Promise<Blob> {
  let paragraphs: Paragraph[]

  switch (template) {
    case 'ATS_2PAGE':
      paragraphs = buildATS2Page(data)
      break
    case 'TECH_PROJECTS':
      paragraphs = buildTechProjects(data)
      break
    case 'ATS_1PAGE':
    default:
      paragraphs = buildATS1Page(data)
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          type: SectionType.CONTINUOUS,
          page: {
            margin: {
              top: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.75)
            }
          }
        },
        children: paragraphs
      }
    ],
    styles: {
      default: {
        document: {
          run: {
            font: STYLES.fonts.primary,
            size: STYLES.sizes.body * 2
          }
        }
      },
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            font: STYLES.fonts.primary,
            size: STYLES.sizes.body * 2
          }
        }
      ]
    }
  })

  const buffer = await Packer.toBlob(doc)
  return buffer
}

/**
 * Convert CV sections from API format to DOCX format
 * (Same structure as PDF export for consistency)
 */
export function convertSectionsToDOCXData(
  sections: {
    summary?: string
    skills?: string[]
    experience?: Array<{
      company: string
      title: string
      duration: string
      location?: string
      bullets: string[]
    }>
    education?: Array<{
      institution: string
      degree: string
      year: string
    }>
    projects?: Array<{
      name: string
      description: string
      technologies?: string[]
    }>
    certifications?: Array<{
      name: string
      issuer: string
      year?: string
    }>
  },
  profile: {
    full_name?: string
    email?: string
    phone?: string
    location?: string
    links?: {
      linkedin?: string
      github?: string
      portfolio?: string
    }
  }
): CVData {
  const links: Array<{ label: string; url: string }> = []
  
  if (profile.links?.linkedin) {
    links.push({ label: 'LinkedIn', url: profile.links.linkedin })
  }
  if (profile.links?.github) {
    links.push({ label: 'GitHub', url: profile.links.github })
  }
  if (profile.links?.portfolio) {
    links.push({ label: 'Portfolio', url: profile.links.portfolio })
  }

  return {
    basics: {
      fullName: profile.full_name || 'Your Name',
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      links: links.length > 0 ? links : undefined
    },
    summary: sections.summary,
    skills: sections.skills,
    experience: sections.experience,
    education: sections.education,
    projects: sections.projects,
    certifications: sections.certifications
  }
}

export type { CVData, TemplateType }
/**
 * ATS Classic Template Specification
 * Typography, spacing, and layout rules for professional CV export
 */

export const ATSClassicSpec = {
  // Page settings (A4)
  page: {
    size: 'A4' as const,
    marginTop: 36,
    marginRight: 40,
    marginBottom: 36,
    marginLeft: 40,
  },
  
  // Fonts (ATS-safe system fonts)
  font: {
    body: 'Helvetica',
    heading: 'Helvetica-Bold',
  },
  
  // Font sizes
  size: {
    name: 18,
    headline: 11,
    sectionHeading: 11,
    jobTitle: 10.5,
    company: 10,
    body: 10,
    small: 9,
    contact: 9,
  },
  
  // Line heights
  line: {
    name: 1.2,
    body: 1.35,
    tight: 1.2,
    bullet: 1.3,
  },
  
  // Spacing (in points)
  spacing: {
    sectionTop: 12,
    sectionBottom: 4,
    afterName: 4,
    afterHeadline: 8,
    afterContact: 12,
    betweenJobs: 10,
    beforeBullets: 4,
    bulletGap: 3,
    skillGroupGap: 6,
  },
  
  // Colors (black/gray only for ATS)
  colors: {
    primary: '#000000',
    secondary: '#333333',
    muted: '#555555',
    line: '#CCCCCC',
  },
  
  // ATS compliance rules
  rules: {
    noTables: true,
    noColumns: true,
    noIcons: true,
    noImages: true,
    noHeaders: true,    // No page headers/footers
    noTextBoxes: true,
    singleColumn: true,
    standardHeadings: true,
  },
  
  // Standard section headings (ATS-friendly)
  headings: {
    summary: 'PROFESSIONAL SUMMARY',
    skills: 'SKILLS',
    experience: 'PROFESSIONAL EXPERIENCE',
    education: 'EDUCATION',
    certifications: 'CERTIFICATIONS',
    projects: 'PROJECTS',
  },
}

export type ATSSpec = typeof ATSClassicSpec
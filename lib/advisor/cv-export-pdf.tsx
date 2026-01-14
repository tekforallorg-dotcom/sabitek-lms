import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf
} from '@react-pdf/renderer'

// Register fonts for professional typography
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff2', fontWeight: 700 },
  ]
})

// Fallback to Helvetica if Inter fails
Font.registerHyphenationCallback(word => [word])

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
// STYLES - Professional, ATS-Friendly
// ============================================

const colors = {
  primary: '#1a1a1a',
  secondary: '#4a4a4a',
  accent: '#2563eb',
  muted: '#6b7280',
  border: '#e5e7eb',
  background: '#ffffff'
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: colors.background,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 50,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
    color: colors.primary
  },
  // Header
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 15
  },
  name: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 8,
    letterSpacing: 0.5
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 5
  },
  contactItem: {
    fontSize: 9,
    color: colors.secondary
  },
  contactSeparator: {
    color: colors.muted,
    marginHorizontal: 8
  },
  // Sections
  section: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4
  },
  // Summary
  summary: {
    fontSize: 10,
    color: colors.secondary,
    lineHeight: 1.5,
    textAlign: 'justify'
  },
  // Skills
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  skillTag: {
    fontSize: 9,
    color: colors.secondary,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3
  },
  skillsList: {
    fontSize: 10,
    color: colors.secondary,
    lineHeight: 1.6
  },
  // Experience
  experienceItem: {
    marginBottom: 14
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4
  },
  experienceLeft: {
    flex: 1
  },
  experienceRight: {
    textAlign: 'right'
  },
  jobTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary
  },
  company: {
    fontSize: 10,
    color: colors.secondary,
    marginTop: 2
  },
  duration: {
    fontSize: 9,
    color: colors.muted
  },
  location: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 2
  },
  bulletList: {
    marginTop: 6,
    paddingLeft: 0
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 4
  },
  bulletPoint: {
    width: 12,
    fontSize: 10,
    color: colors.muted
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    color: colors.secondary,
    lineHeight: 1.45
  },
  // Education
  educationItem: {
    marginBottom: 8
  },
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  institution: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary
  },
  degree: {
    fontSize: 9.5,
    color: colors.secondary,
    marginTop: 2
  },
  year: {
    fontSize: 9,
    color: colors.muted
  },
  // Projects
  projectItem: {
    marginBottom: 10
  },
  projectName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary
  },
  projectDescription: {
    fontSize: 9.5,
    color: colors.secondary,
    marginTop: 3,
    lineHeight: 1.4
  },
  projectTech: {
    fontSize: 8.5,
    color: colors.muted,
    marginTop: 3,
    fontStyle: 'italic'
  },
  // Certifications
  certItem: {
    marginBottom: 6
  },
  certName: {
    fontSize: 10,
    color: colors.primary
  },
  certIssuer: {
    fontSize: 9,
    color: colors.muted
  },
  // Page number
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 20,
    right: 50,
    color: colors.muted
  }
})

// ============================================
// COMPONENTS
// ============================================

const Header: React.FC<{ basics: CVData['basics'] }> = ({ basics }) => (
  <View style={styles.header}>
    <Text style={styles.name}>{basics.fullName || 'Your Name'}</Text>
    <View style={styles.contactRow}>
      {basics.email && <Text style={styles.contactItem}>{basics.email}</Text>}
      {basics.phone && (
        <>
          {basics.email && <Text style={styles.contactSeparator}>|</Text>}
          <Text style={styles.contactItem}>{basics.phone}</Text>
        </>
      )}
      {basics.location && (
        <>
          {(basics.email || basics.phone) && <Text style={styles.contactSeparator}>|</Text>}
          <Text style={styles.contactItem}>{basics.location}</Text>
        </>
      )}
      {basics.links?.map((link, idx) => (
        <React.Fragment key={idx}>
          <Text style={styles.contactSeparator}>|</Text>
          <Text style={styles.contactItem}>{link.url.replace(/^https?:\/\//, '')}</Text>
        </React.Fragment>
      ))}
    </View>
  </View>
)

const SummarySection: React.FC<{ summary: string }> = ({ summary }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Professional Summary</Text>
    <Text style={styles.summary}>{summary}</Text>
  </View>
)

const SkillsSection: React.FC<{ skills: string[]; format: 'tags' | 'list' }> = ({ skills, format }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Skills & Expertise</Text>
    {format === 'tags' ? (
      <View style={styles.skillsContainer}>
        {skills.map((skill, idx) => (
          <Text key={idx} style={styles.skillTag}>{skill}</Text>
        ))}
      </View>
    ) : (
      <Text style={styles.skillsList}>{skills.join('  •  ')}</Text>
    )}
  </View>
)

const ExperienceSection: React.FC<{ experience: CVData['experience'] }> = ({ experience }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Professional Experience</Text>
    {experience?.map((exp, idx) => (
      <View key={idx} style={styles.experienceItem} wrap={false}>
        <View style={styles.experienceHeader}>
          <View style={styles.experienceLeft}>
            <Text style={styles.jobTitle}>{exp.title}</Text>
            <Text style={styles.company}>{exp.company}</Text>
          </View>
          <View style={styles.experienceRight}>
            <Text style={styles.duration}>{exp.duration}</Text>
            {exp.location && <Text style={styles.location}>{exp.location}</Text>}
          </View>
        </View>
        <View style={styles.bulletList}>
          {exp.bullets?.map((bullet, bulletIdx) => (
            <View key={bulletIdx} style={styles.bulletItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>
      </View>
    ))}
  </View>
)

const EducationSection: React.FC<{ education: CVData['education'] }> = ({ education }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Education</Text>
    {education?.map((edu, idx) => (
      <View key={idx} style={styles.educationItem}>
        <View style={styles.educationHeader}>
          <View>
            <Text style={styles.institution}>{edu.institution}</Text>
            <Text style={styles.degree}>{edu.degree}</Text>
          </View>
          <Text style={styles.year}>{edu.year}</Text>
        </View>
      </View>
    ))}
  </View>
)

const ProjectsSection: React.FC<{ projects: CVData['projects'] }> = ({ projects }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Projects</Text>
    {projects?.map((proj, idx) => (
      <View key={idx} style={styles.projectItem} wrap={false}>
        <Text style={styles.projectName}>{proj.name}</Text>
        <Text style={styles.projectDescription}>{proj.description}</Text>
        {proj.technologies && proj.technologies.length > 0 && (
          <Text style={styles.projectTech}>Technologies: {proj.technologies.join(', ')}</Text>
        )}
      </View>
    ))}
  </View>
)

const CertificationsSection: React.FC<{ certifications: CVData['certifications'] }> = ({ certifications }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Certifications</Text>
    {certifications?.map((cert, idx) => (
      <View key={idx} style={styles.certItem}>
        <Text style={styles.certName}>
          {cert.name}{cert.year ? ` (${cert.year})` : ''}
        </Text>
        <Text style={styles.certIssuer}>{cert.issuer}</Text>
      </View>
    ))}
  </View>
)

// ============================================
// TEMPLATES
// ============================================

/**
 * ATS 1-Page Template - Compact, optimized for ATS
 */
const ATS1PageTemplate: React.FC<{ data: CVData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Header basics={data.basics} />
      
      {data.summary && <SummarySection summary={data.summary} />}
      
      {data.skills && data.skills.length > 0 && (
        <SkillsSection skills={data.skills.slice(0, 20)} format="list" />
      )}
      
      {data.experience && data.experience.length > 0 && (
        <ExperienceSection experience={data.experience.slice(0, 4)} />
      )}
      
      {data.education && data.education.length > 0 && (
        <EducationSection education={data.education} />
      )}
      
      {data.certifications && data.certifications.length > 0 && (
        <CertificationsSection certifications={data.certifications.slice(0, 4)} />
      )}
      
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
        totalPages > 1 ? `${pageNumber} / ${totalPages}` : ''
      )} fixed />
    </Page>
  </Document>
)

/**
 * ATS 2-Page Template - Full detail, ATS optimized
 */
const ATS2PageTemplate: React.FC<{ data: CVData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Header basics={data.basics} />
      
      {data.summary && <SummarySection summary={data.summary} />}
      
      {data.skills && data.skills.length > 0 && (
        <SkillsSection skills={data.skills.slice(0, 30)} format="list" />
      )}
      
      {data.experience && data.experience.length > 0 && (
        <ExperienceSection experience={data.experience} />
      )}
      
      {data.education && data.education.length > 0 && (
        <EducationSection education={data.education} />
      )}
      
      {data.projects && data.projects.length > 0 && (
        <ProjectsSection projects={data.projects} />
      )}
      
      {data.certifications && data.certifications.length > 0 && (
        <CertificationsSection certifications={data.certifications} />
      )}
      
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
        `${pageNumber} / ${totalPages}`
      )} fixed />
    </Page>
  </Document>
)

/**
 * Tech Projects Template - Emphasizes projects and technical skills
 */
const TechProjectsTemplate: React.FC<{ data: CVData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Header basics={data.basics} />
      
      {data.summary && <SummarySection summary={data.summary} />}
      
      {data.skills && data.skills.length > 0 && (
        <SkillsSection skills={data.skills.slice(0, 25)} format="tags" />
      )}
      
      {/* Projects come before experience in this template */}
      {data.projects && data.projects.length > 0 && (
        <ProjectsSection projects={data.projects} />
      )}
      
      {data.experience && data.experience.length > 0 && (
        <ExperienceSection experience={data.experience} />
      )}
      
      {data.education && data.education.length > 0 && (
        <EducationSection education={data.education} />
      )}
      
      {data.certifications && data.certifications.length > 0 && (
        <CertificationsSection certifications={data.certifications} />
      )}
      
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
        totalPages > 1 ? `${pageNumber} / ${totalPages}` : ''
      )} fixed />
    </Page>
  </Document>
)

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Generate PDF from CV data using @react-pdf/renderer
 */
export async function generateCVPDF(
  data: CVData,
  template: TemplateType = 'ATS_1PAGE'
): Promise<Blob> {
  let TemplateComponent: React.FC<{ data: CVData }>

  switch (template) {
    case 'ATS_2PAGE':
      TemplateComponent = ATS2PageTemplate
      break
    case 'TECH_PROJECTS':
      TemplateComponent = TechProjectsTemplate
      break
    case 'ATS_1PAGE':
    default:
      TemplateComponent = ATS1PageTemplate
  }

  const doc = <TemplateComponent data={data} />
  const blob = await pdf(doc).toBlob()
  
  return blob
}

/**
 * Convert CV sections from API format to PDF format
 */
export function convertSectionsToPDFData(
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
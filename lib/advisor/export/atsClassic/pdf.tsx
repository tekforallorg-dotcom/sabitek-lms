/**
 * ATS Classic PDF Template
 * Professional, ATS-optimized CV template using @react-pdf/renderer
 */

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import { ATSClassicSpec } from './spec'
import type { CVData } from '@/lib/cv/schemas'

// Register Helvetica (built-in, ATS-safe)
// No custom fonts needed - using PDF standard fonts

const spec = ATSClassicSpec

// Create styles
const styles = StyleSheet.create({
  page: {
    paddingTop: spec.page.marginTop,
    paddingRight: spec.page.marginRight,
    paddingBottom: spec.page.marginBottom,
    paddingLeft: spec.page.marginLeft,
    fontFamily: spec.font.body,
    fontSize: spec.size.body,
    lineHeight: spec.line.body,
    color: spec.colors.primary,
  },
  
  // Header section
  header: {
    marginBottom: spec.spacing.afterContact,
  },
  name: {
    fontSize: spec.size.name,
    fontFamily: spec.font.heading,
    marginBottom: spec.spacing.afterName,
    textAlign: 'center',
  },
  headline: {
    fontSize: spec.size.headline,
    color: spec.colors.secondary,
    marginBottom: spec.spacing.afterHeadline,
    textAlign: 'center',
  },
  contactLine: {
    fontSize: spec.size.contact,
    color: spec.colors.muted,
    textAlign: 'center',
  },
  
  // Section styling
  section: {
    marginTop: spec.spacing.sectionTop,
    marginBottom: spec.spacing.sectionBottom,
  },
  sectionHeading: {
    fontSize: spec.size.sectionHeading,
    fontFamily: spec.font.heading,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: spec.colors.line,
    paddingBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    paddingLeft: 0,
  },
  
  // Summary
  summary: {
    fontSize: spec.size.body,
    lineHeight: spec.line.body,
    textAlign: 'justify',
  },
  
  // Skills
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  skillGroup: {
    marginBottom: spec.spacing.skillGroupGap,
  },
  skillGroupLabel: {
    fontFamily: spec.font.heading,
    fontSize: spec.size.body,
    marginRight: 4,
  },
  skillGroupItems: {
    fontSize: spec.size.body,
  },
  
  // Experience
  experienceItem: {
    marginBottom: spec.spacing.betweenJobs,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: spec.size.jobTitle,
    fontFamily: spec.font.heading,
  },
  jobDuration: {
    fontSize: spec.size.small,
    color: spec.colors.muted,
  },
  companyLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spec.spacing.beforeBullets,
  },
  company: {
    fontSize: spec.size.company,
    color: spec.colors.secondary,
  },
  location: {
    fontSize: spec.size.small,
    color: spec.colors.muted,
  },
  bulletList: {
    paddingLeft: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: spec.spacing.bulletGap,
  },
  bulletPoint: {
    width: 12,
    fontSize: spec.size.body,
  },
  bulletText: {
    flex: 1,
    fontSize: spec.size.body,
    lineHeight: spec.line.bullet,
  },
  
  // Education
  educationItem: {
    marginBottom: 6,
  },
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  degree: {
    fontSize: spec.size.body,
    fontFamily: spec.font.heading,
  },
  year: {
    fontSize: spec.size.small,
    color: spec.colors.muted,
  },
  school: {
    fontSize: spec.size.body,
    color: spec.colors.secondary,
  },
  
  // Certifications
  certItem: {
    marginBottom: 4,
  },
  certName: {
    fontSize: spec.size.body,
  },
  certIssuer: {
    fontSize: spec.size.small,
    color: spec.colors.muted,
  },
  
  // Projects
  projectItem: {
    marginBottom: 8,
  },
  projectName: {
    fontSize: spec.size.body,
    fontFamily: spec.font.heading,
  },
  projectDesc: {
    fontSize: spec.size.body,
    color: spec.colors.secondary,
  },
  projectTech: {
    fontSize: spec.size.small,
    color: spec.colors.muted,
    fontStyle: 'italic',
  },
})

// Props interface
interface ATSClassicPDFProps {
  cv: CVData
}

/**
 * ATS Classic PDF Document Component
 */
export function ATSClassicPDF({ cv }: ATSClassicPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{cv.header.name}</Text>
          {cv.header.headline && (
            <Text style={styles.headline}>{cv.header.headline}</Text>
          )}
          <Text style={styles.contactLine}>
            {cv.header.contact_line || [
              cv.header.location,
              cv.header.email,
              cv.header.phone,
            ].filter(Boolean).join(' • ')}
          </Text>
          {cv.header.links && cv.header.links.length > 0 && (
            <Text style={styles.contactLine}>
              {cv.header.links.join(' • ')}
            </Text>
          )}
        </View>

        {/* Professional Summary */}
        {cv.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>{spec.headings.summary}</Text>
            <Text style={styles.summary}>{cv.summary}</Text>
          </View>
        )}

        {/* Skills */}
        {cv.skills && cv.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>{spec.headings.skills}</Text>
            <View style={styles.sectionContent}>
              {cv.skills.map((group, idx) => (
                <View key={idx} style={styles.skillGroup}>
                  <Text>
                    <Text style={styles.skillGroupLabel}>{group.label}: </Text>
                    <Text style={styles.skillGroupItems}>
                      {group.items.join(', ')}
                    </Text>
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Professional Experience */}
        {cv.experience && cv.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>{spec.headings.experience}</Text>
            <View style={styles.sectionContent}>
              {cv.experience.map((exp, idx) => (
                <View key={idx} style={styles.experienceItem}>
                  <View style={styles.jobHeader}>
                    <Text style={styles.jobTitle}>{exp.title}</Text>
                    <Text style={styles.jobDuration}>{exp.duration}</Text>
                  </View>
                  <View style={styles.companyLine}>
                    <Text style={styles.company}>{exp.company}</Text>
                    {exp.location && (
                      <Text style={styles.location}>{exp.location}</Text>
                    )}
                  </View>
                  <View style={styles.bulletList}>
                    {exp.bullets.map((bullet, bIdx) => (
                      <View key={bIdx} style={styles.bulletItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>{bullet.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Education */}
        {cv.education && cv.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>{spec.headings.education}</Text>
            <View style={styles.sectionContent}>
              {cv.education.map((edu, idx) => (
                <View key={idx} style={styles.educationItem}>
                  <View style={styles.educationHeader}>
                    <Text style={styles.degree}>{edu.degree}</Text>
                    {edu.year && <Text style={styles.year}>{edu.year}</Text>}
                  </View>
                  <Text style={styles.school}>{edu.institution}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Certifications */}
        {cv.certifications && cv.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>{spec.headings.certifications}</Text>
            <View style={styles.sectionContent}>
              {cv.certifications.map((cert, idx) => (
                <View key={idx} style={styles.certItem}>
                  <Text style={styles.certName}>
                    {cert.name}
                    {cert.issuer && (
                      <Text style={styles.certIssuer}> — {cert.issuer}</Text>
                    )}
                    {cert.year && (
                      <Text style={styles.certIssuer}> ({cert.year})</Text>
                    )}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Projects */}
        {cv.projects && cv.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>{spec.headings.projects}</Text>
            <View style={styles.sectionContent}>
              {cv.projects.map((proj, idx) => (
                <View key={idx} style={styles.projectItem}>
                  <Text style={styles.projectName}>{proj.name}</Text>
                  {proj.description && (
                    <Text style={styles.projectDesc}>{proj.description}</Text>
                  )}
                  {proj.technologies && proj.technologies.length > 0 && (
                    <Text style={styles.projectTech}>
                      Technologies: {proj.technologies.join(', ')}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  )
}

export default ATSClassicPDF

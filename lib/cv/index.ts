/**
 * CV Builder v2 - Main Entry Point
 */

// Schemas & Types
export {
  ResumeSchemaZ,
  JobSchemaZ,
  CVDataZ,
  EvidenceMapSchema,
  type ResumeSchema,
  type JobSchema,
  type CVData,
  type EvidenceMap,
  type CVFailure,
  validateCVWorldClass,
  calculateQualityScore,
  passesQualityGate,
  safeParseResumeSchema,
  safeParseJobSchema,
  safeParseCVData,
} from './schemas'

// Prompts
export {
  SYSTEM_PROMPTS,
  buildSummaryPrompt,
  buildSkillsPrompt,
  buildExperiencePrompt,
  buildFixPassPrompt,
  cleanAIResponse,
  extractJSON,
} from './prompts'

// Extraction
export {
  extractResumeFromText,
  profileToResumeSchema,
  mergeResumeData,
  type ExtractionResult,
} from './extract/resumeToJson'

export {
  extractJDFromText,
  quickExtractKeywords,
  type JDExtractionResult,
} from './extract/jdToJson'

// Evidence Mapping
export {
  buildEvidenceMap,
  getPrioritizedKeywords,
  getBulletsToRewrite,
  calculateATSScoreFromEvidence,
  getTailoringSuggestions,
} from './match/evidenceMap'

// Pipeline
export {
  buildCV,
  tailorCV,
  type BuildCVInput,
  type BuildCVResult,
  type TailorCVInput,
  type TailorCVResult,
} from './pipeline'
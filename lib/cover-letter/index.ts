/**
 * Cover Letter Builder - Public Exports
 */

export {
  buildCoverLetter,
  tailorCoverLetter,
  type BuildCoverLetterInput,
  type TailorCoverLetterInput,
  type BuildCoverLetterResult,
  type TailorCoverLetterResult,
  type CoverLetterDocument,
  type CoverLetterSections,
  type CoverLetterInsights,
  type CoverLetterTone,
  type CoverLetterLength,
} from './pipeline'

export {
  validateCoverLetter,
  LENGTH_CONSTRAINTS,
  TONE_DESCRIPTORS,
  type QualityCheckResult,
  type QualityIssue,
} from './schemas'
/**
 * useTerminology — React hook for vertical-aware UI labels
 *
 * Reads the institution's terminology_pack and provides consistent
 * label mapping across the UI. Falls back to defaults based on
 * institution type if no custom pack is set.
 *
 * Usage:
 *   const t = useTerminology(institution)
 *   <h1>{t.learner_plural}</h1>  // "Students" for schools, "Beneficiaries" for NGOs
 *   <button>{t.invite_cta}</button>  // "Add Students" for schools, "Enroll Beneficiaries" for NGOs
 */

import { useMemo } from 'react'
import {
  type TerminologyPack,
  type InstitutionVerticalType,
  getDefaultTerminology,
} from '@/lib/vertical-packs'

interface InstitutionLike {
  type: string
  terminology_pack?: Partial<TerminologyPack> | null
}

/**
 * Returns a complete TerminologyPack for the given institution.
 * Merges any custom overrides with defaults for the institution type.
 */
export function useTerminology(institution: InstitutionLike | null | undefined): TerminologyPack {
  return useMemo(() => {
    if (!institution) {
      return getDefaultTerminology('other')
    }

    const verticalType = (institution.type || 'other') as InstitutionVerticalType
    const defaults = getDefaultTerminology(verticalType)

    if (!institution.terminology_pack) {
      return defaults
    }

    // Merge: institution overrides win, defaults fill gaps
    return { ...defaults, ...institution.terminology_pack }
  }, [institution?.type, institution?.terminology_pack])
}

/**
 * Non-hook version for use in server components or API routes.
 */
export function getTerminology(institution: InstitutionLike | null | undefined): TerminologyPack {
  if (!institution) {
    return getDefaultTerminology('other')
  }

  const verticalType = (institution.type || 'other') as InstitutionVerticalType
  const defaults = getDefaultTerminology(verticalType)

  if (!institution.terminology_pack) {
    return defaults
  }

  return { ...defaults, ...institution.terminology_pack }
}
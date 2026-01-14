/**
 * Years of Experience Calculator
 * 
 * Computes total years from job dates instead of using a constant.
 * Handles various date formats and "Present" for current roles.
 */

/**
 * Parse a date string to a Date object
 * Handles formats: "2021-04", "Apr 2021", "2021", "Present", "Current"
 */
function parseMonthYear(s?: string): Date | null {
  if (!s) return null
  const t = s.trim().toLowerCase()
  
  // Handle present/current
  if (!t || t === 'present' || t === 'current' || t === 'now') {
    return new Date()
  }

  // Try YYYY-MM format (2021-04)
  const isoMatch = t.match(/^(\d{4})-(\d{2})$/)
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, 1)
  }

  // Try "Apr 2021" or "April 2021" format
  const monthYearMatch = t.match(/^([a-z]{3,9})\s+(\d{4})$/i)
  if (monthYearMatch) {
    const monthDate = new Date(`${monthYearMatch[1]} 1, 2000`)
    if (!isNaN(monthDate.getTime())) {
      return new Date(Number(monthYearMatch[2]), monthDate.getMonth(), 1)
    }
  }

  // Try "2021" (year only)
  const yearOnlyMatch = t.match(/^(\d{4})$/)
  if (yearOnlyMatch) {
    return new Date(Number(yearOnlyMatch[1]), 0, 1)
  }

  // Try "MM/YYYY" or "MM-YYYY"
  const slashMatch = t.match(/^(\d{1,2})[/-](\d{4})$/)
  if (slashMatch) {
    return new Date(Number(slashMatch[2]), Number(slashMatch[1]) - 1, 1)
  }

  // Try "YYYY/MM" or "YYYY-MM"
  const reverseMatch = t.match(/^(\d{4})[/-](\d{1,2})$/)
  if (reverseMatch) {
    return new Date(Number(reverseMatch[1]), Number(reverseMatch[2]) - 1, 1)
  }

  return null
}

/**
 * Job date range interface
 */
interface JobDates {
  start?: string
  end?: string
  isCurrent?: boolean
  isPresent?: boolean
}

/**
 * Compute total years of experience from job history
 * 
 * @param jobs - Array of jobs with date ranges
 * @returns Total years (rounded to 1 decimal) or null if insufficient data
 */
export function computeYearsExperience(
  jobs: Array<{ 
    start?: string
    end?: string
    isCurrent?: boolean
    dates?: JobDates
  }>
): number | null {
  let totalMonths = 0
  const now = new Date()

  for (const job of jobs) {
    // Handle both flat and nested date structures
    const startStr = job.start || job.dates?.start
    const endStr = job.end || job.dates?.end
    const isCurrent = job.isCurrent || job.dates?.isCurrent || job.dates?.isPresent

    const startDate = parseMonthYear(startStr)
    if (!startDate) continue

    let endDate: Date
    if (isCurrent) {
      endDate = now
    } else {
      const parsed = parseMonthYear(endStr)
      endDate = parsed || now // Default to now if no end date
    }

    // Calculate months
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 
      + (endDate.getMonth() - startDate.getMonth())

    if (months > 0) {
      totalMonths += months
    }
  }

  // Return null if too little data (less than 6 months)
  if (totalMonths < 6) return null

  // Round to 1 decimal place
  return Math.round((totalMonths / 12) * 10) / 10
}
/**
 * Generate years of experience phrase for CV
 * 
 * RULE: If years cannot be computed with confidence, use non-numeric phrasing.
 * NEVER hardcode or guess years.
 * 
 * @param years - Computed years or null
 * @returns Human-readable phrase
 */
export function yearsPhrase(years: number | null): string {
  // If we can't compute years confidently, use non-numeric phrasing
  if (!years) return 'Experienced professional'
  
  // Round to avoid false precision
  const rounded = Math.floor(years)
  
  if (rounded < 1) return 'Nearly 1 year of experience'
  if (rounded === 1) return '1+ year of experience'
  if (rounded < 3) return '2+ years of experience'
  if (rounded < 5) return `${rounded}+ years of experience`
  if (rounded < 8) return `${rounded}+ years of experience`
  if (rounded < 12) return `${rounded}+ years of experience`
  
  return `${rounded}+ years of experience`
}

/**
 * Get safe years phrase - NEVER guesses
 * Use this when dates are uncertain
 */
export function safeYearsPhrase(years: number | null, roleContext?: string): string {
  if (!years) {
    // Context-aware non-numeric phrasing
    if (roleContext?.toLowerCase().includes('support')) {
      return 'Experienced IT support professional'
    }
    if (roleContext?.toLowerCase().includes('developer') || roleContext?.toLowerCase().includes('engineer')) {
      return 'Experienced software professional'
    }
    return 'Experienced professional'
  }
  
  return yearsPhrase(years)
}

/**
 * Get experience level based on years
 */
export function experienceLevelFromYears(years: number | null): 'entry' | 'mid' | 'senior' | 'lead' | 'executive' {
  if (!years || years < 2) return 'entry'
  if (years < 5) return 'mid'
  if (years < 8) return 'senior'
  if (years < 12) return 'lead'
  return 'executive'
}

export default {
  computeYearsExperience,
  yearsPhrase,
  experienceLevelFromYears,
  parseMonthYear,
}
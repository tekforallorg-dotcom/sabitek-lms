/**
 * Mobile Pricing — SabiWrite pay-per-action
 *
 * Hardcoded from PRD (non-negotiable):
 *   Standard tools (Claude Haiku ×25): ₦20 / ₦40 / ₦65 / ₦100
 *   Premium Humanize (×10): ₦150 / ₦300 / ₦500 / ₦750
 *
 * Word buckets: small ≤500, medium ≤1200, large ≤3000, xl ≤5000
 * No DB lookup — prices are fixed per PRD.
 */

export type MobileToolType =
  | 'rewrite'
  | 'shorten'
  | 'expand'
  | 'simplify'
  | 'clarity'
  | 'tone_change'
  | 'detection'
  | 'plagiarism'
  | 'humanize_premium';

export type WordBucket = 'small' | 'medium' | 'large' | 'xl';

export const MAX_WORDS = 5000;

/** Resolve word count to bucket */
export function resolveBucket(wordCount: number): WordBucket | null {
  if (wordCount <= 0) return null;
  if (wordCount <= 500) return 'small';
  if (wordCount <= 1200) return 'medium';
  if (wordCount <= 3000) return 'large';
  if (wordCount <= MAX_WORDS) return 'xl';
  return null; // over limit
}

/** Standard tool prices in Naira (Claude Haiku ×25 markup) */
const STANDARD_PRICES_NAIRA: Record<WordBucket, number> = {
  small: 20,
  medium: 40,
  large: 65,
  xl: 100,
};

/** Premium Humanize prices in Naira (dedicated engine ×10 markup) */
const PREMIUM_PRICES_NAIRA: Record<WordBucket, number> = {
  small: 150,
  medium: 300,
  large: 500,
  xl: 750,
};

/** Standard tools that use Haiku pricing */
const STANDARD_TOOLS: MobileToolType[] = [
  'rewrite', 'shorten', 'expand', 'simplify',
  'clarity', 'tone_change', 'detection', 'plagiarism',
];

export function isPremiumTool(toolType: MobileToolType): boolean {
  return toolType === 'humanize_premium';
}

export interface MobilePriceEstimate {
  toolType: MobileToolType;
  wordCount: number;
  bucket: WordBucket;
  priceNaira: number;
  priceKobo: number;
  isPremium: boolean;
  maxWords: number;
}

/**
 * Calculate price for a mobile operation.
 * Returns null if word count exceeds limit or is zero.
 */
export function getMobilePrice(
  toolType: MobileToolType,
  wordCount: number
): MobilePriceEstimate | null {
  const bucket = resolveBucket(wordCount);
  if (!bucket) return null;

  const isPremium = isPremiumTool(toolType);
  const priceTable = isPremium ? PREMIUM_PRICES_NAIRA : STANDARD_PRICES_NAIRA;
  const priceNaira = priceTable[bucket];

  return {
    toolType,
    wordCount,
    bucket,
    priceNaira,
    priceKobo: priceNaira * 100,
    isPremium,
    maxWords: MAX_WORDS,
  };
}

/** Format kobo to Naira display string */
export function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString()}`;
}
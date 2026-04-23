/**
 * Cryptographic helpers for Sabitek.
 *
 * Used for generating secure, URL-safe tokens for invites, magic links, etc.
 */

import { randomBytes } from 'crypto'

/**
 * Generates a cryptographically secure, URL-safe invite token.
 *
 * Uses 24 random bytes → 32-character base64url string.
 * Entropy: 192 bits — well above the 128-bit recommendation for session-grade tokens.
 * URL-safe: base64url uses only [A-Za-z0-9_-], no padding, no escaping needed.
 *
 * Example output: "dKF0y_c8nBxLpQzM4N6vHjK2RwTsPvXy"
 */
export function generateInviteToken(): string {
  return randomBytes(24).toString('base64url')
}

/**
 * Generates a shorter, human-readable access code.
 *
 * Uses uppercase letters + digits, excluding visually ambiguous chars (0, O, 1, I, L).
 * Length 8 = ~40 bits entropy — enough for short-lived cohort access codes.
 *
 * Example output: "K3P9XMQ7"
 */
export function generateAccessCode(length: number = 8): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // removed 0,O,1,I,L
  const bytes = randomBytes(length)
  let code = ''
  for (let i = 0; i < length; i++) {
    code += alphabet[bytes[i] % alphabet.length]
  }
  return code
}
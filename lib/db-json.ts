import type { Json } from '@/types/supabase'

/**
 * Hand a plain serialisable value to a json/jsonb column.
 *
 * The generated `Json` type has an index signature, which TypeScript
 * interfaces (CVSections, TerminologyPack, ...) do not, so they are not
 * assignable to it even though they serialise fine. This is the one place
 * that cast lives.
 */
export function toJson(value: unknown): Json {
  return value as Json
}

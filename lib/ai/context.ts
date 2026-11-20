import { AsyncLocalStorage } from 'node:async_hooks'

/**
 * Who an AI call is for, and which feature it belongs to.
 *
 * The CV, cover-letter and quiz pipelines make many model calls several
 * functions deep. Rather than thread a user id through every one of them, the
 * entry point sets the context once and every call underneath is metered
 * against it.
 */
export interface AIContext {
  userId: string | null
  feature: string
}

const storage = new AsyncLocalStorage<AIContext>()

export function withAIContext<T>(context: AIContext, fn: () => Promise<T>): Promise<T> {
  return storage.run(context, fn)
}

export function getAIContext(): AIContext | undefined {
  return storage.getStore()
}

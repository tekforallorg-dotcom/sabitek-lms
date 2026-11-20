import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { creditWallet, debitWallet, getOrCreateWallet } from '@/lib/wallet'

/**
 * lib/wallet does no arithmetic of its own any more: it hands every balance
 * change to the `wallet_apply` database function. These tests pin the contract
 * between the two: what is sent, and how each reply is reported to callers.
 * The database function itself is exercised against a real database in the
 * migration's dry run.
 */

interface RpcCall {
  fn: string
  args: Record<string, unknown>
}

function fakeClient(reply: { data?: unknown; error?: unknown }, wallet?: Record<string, unknown>) {
  const calls: RpcCall[] = []
  const client = {
    rpc: async (fn: string, args: Record<string, unknown>) => {
      calls.push({ fn, args })
      return { data: reply.data ?? null, error: reply.error ?? null }
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: wallet ?? null, error: wallet ? null : { message: 'not found' } }),
        }),
      }),
    }),
  }
  return { client: client as unknown as SupabaseClient, calls }
}

const base = {
  userId: 'user-1',
  amountKobo: 30000,
  service: 'advisor' as const,
  description: 'CV generation',
}

describe('debitWallet', () => {
  it('asks the database for a debit and reports the new balance', async () => {
    const { client, calls } = fakeClient({
      data: { success: true, replayed: false, new_balance: 70000, ledger_id: 'ledger-1' },
    })

    const result = await debitWallet(client, base)

    expect(calls).toHaveLength(1)
    expect(calls[0].fn).toBe('wallet_apply')
    expect(calls[0].args).toMatchObject({
      p_user: 'user-1',
      p_amount_kobo: 30000,
      p_type: 'debit',
      p_service: 'advisor',
      p_description: 'CV generation',
    })
    expect(result).toEqual({
      success: true,
      newBalance: 70000,
      ledgerId: 'ledger-1',
      replayed: false,
      error: undefined,
    })
  })

  it('passes the idempotency key through and reports a replay', async () => {
    const { client, calls } = fakeClient({
      data: { success: true, replayed: true, new_balance: 70000, ledger_id: 'ledger-1' },
    })

    const result = await debitWallet(client, { ...base, idempotencyKey: 'debit:advisor:op-1' })

    expect(calls[0].args.p_idempotency_key).toBe('debit:advisor:op-1')
    expect(result.success).toBe(true)
    expect(result.replayed).toBe(true)
  })

  it('sends no key when none is given', async () => {
    const { client, calls } = fakeClient({ data: { success: true, new_balance: 1 } })
    await debitWallet(client, base)
    expect(calls[0].args.p_idempotency_key).toBeNull()
  })

  it('reports an insufficient balance as a failure with the current balance', async () => {
    const { client } = fakeClient({
      data: { success: false, error: 'Insufficient balance', new_balance: 1000 },
    })

    const result = await debitWallet(client, base)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Insufficient balance')
    expect(result.newBalance).toBe(1000)
  })

  it('treats a database error as a failure, never as a success', async () => {
    const { client } = fakeClient({ error: { message: 'connection reset' } })

    const result = await debitWallet(client, base)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Failed to update balance')
  })

  it('keeps a string reference in the metadata', async () => {
    const { client, calls } = fakeClient({ data: { success: true, new_balance: 1 } })

    await debitWallet(client, { ...base, referenceId: 'ref-abc', metadata: { module: 'cv' } })

    expect(calls[0].args.p_metadata).toEqual({ module: 'cv', reference_id: 'ref-abc' })
  })
})

describe('creditWallet', () => {
  it.each(['credit', 'refund', 'bonus'] as const)('sends a %s as its own transaction type', async (type) => {
    const { client, calls } = fakeClient({ data: { success: true, new_balance: 1 } })

    await creditWallet(client, { ...base, transactionType: type })

    expect(calls[0].fn).toBe('wallet_apply')
    expect(calls[0].args.p_type).toBe(type)
    // transactionType is a routing field, not something to send to the database
    expect(calls[0].args).not.toHaveProperty('transactionType')
  })
})

describe('getOrCreateWallet', () => {
  it('creates the wallet through the database, with the welcome bonus, then reads it', async () => {
    const wallet = { id: 'w-1', user_id: 'user-1', balance_kobo: 50000, currency: 'NGN' }
    const { client, calls } = fakeClient({ data: 'w-1' }, wallet)

    const result = await getOrCreateWallet(client, 'user-1')

    expect(calls[0]).toEqual({
      fn: 'wallet_ensure',
      args: { p_user: 'user-1', p_welcome_bonus_kobo: 50000 },
    })
    expect(result).toEqual(wallet)
  })

  it('throws when the wallet cannot be created', async () => {
    const { client } = fakeClient({ error: { message: 'boom' } })
    await expect(getOrCreateWallet(client, 'user-1')).rejects.toThrow('Failed to create wallet')
  })
})

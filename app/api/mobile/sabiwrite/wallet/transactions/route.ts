/**
 * POST /api/mobile/sabiwrite/wallet/transactions
 *
 * Returns wallet ledger (credits & debits) for a device.
 * Body: { deviceId: string, limit?: number }
 * Response: { transactions: [...] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, limit = 50 } = body as { deviceId?: string; limit?: number };

    if (!deviceId) {
      return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: transactions, error } = await supabase
      .from('mobile_wallet_ledger')
      .select('id, transaction_type, amount_kobo, description, created_at')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[wallet/transactions] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    return NextResponse.json({
      transactions: (transactions || []).map((t) => ({
        id: t.id,
        type: t.transaction_type,
        amountKobo: t.amount_kobo,
        amountNaira: t.amount_kobo / 100,
        description: t.description,
        createdAt: t.created_at,
      })),
    });
  } catch (error) {
    console.error('[wallet/transactions] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
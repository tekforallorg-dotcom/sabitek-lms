/**
 * POST /api/mobile/sabiwrite/wallet/balance
 *
 * Returns wallet balance for a device. Creates wallet if not exists.
 * Body: { deviceId: string }
 * Response: { balanceKobo, balanceNaira, exists }
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin'


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId } = body as { deviceId?: string };

    if (!deviceId) {
      return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
    }

    const supabase = supabaseAdmin;

    // Get or create wallet
    let { data: wallet } = await supabase
      .from('mobile_wallets')
      .select('id, balance_kobo')
      .eq('device_id', deviceId)
      .single();

    if (!wallet) {
      const { data: newWallet, error } = await supabase
        .from('mobile_wallets')
        .insert({ device_id: deviceId, balance_kobo: 0 })
        .select('id, balance_kobo')
        .single();

      if (error) {
        console.error('[wallet/balance] Create error:', error);
        return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 });
      }
      wallet = newWallet;
    }

    return NextResponse.json({
      balanceKobo: wallet!.balance_kobo,
      balanceNaira: wallet!.balance_kobo / 100,
    });
  } catch (error) {
    console.error('[wallet/balance] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
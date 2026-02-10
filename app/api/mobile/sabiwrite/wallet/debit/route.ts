/**
 * POST /api/mobile/sabiwrite/wallet/debit
 *
 * Debits wallet for an operation. Called by process route when paymentMethod='wallet'.
 * Body: { deviceId, amountKobo, toolType, operationRef }
 * Response: { success, newBalanceKobo, newBalanceNaira }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, amountKobo, toolType, operationRef } = body as {
      deviceId?: string;
      amountKobo?: number;
      toolType?: string;
      operationRef?: string;
    };

    if (!deviceId || !amountKobo || amountKobo <= 0) {
      return NextResponse.json(
        { error: 'Missing deviceId or amountKobo' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get wallet
    const { data: wallet } = await supabase
      .from('mobile_wallets')
      .select('*')
      .eq('device_id', deviceId)
      .single();

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    if (wallet.balance_kobo < amountKobo) {
      return NextResponse.json(
        {
          error: 'Insufficient balance',
          balanceKobo: wallet.balance_kobo,
          requiredKobo: amountKobo,
          shortfallKobo: amountKobo - wallet.balance_kobo,
        },
        { status: 402 }
      );
    }

    const balanceBefore = wallet.balance_kobo;
    const balanceAfter = balanceBefore - amountKobo;

    // Debit wallet
    const { error: updateError } = await supabase
      .from('mobile_wallets')
      .update({
        balance_kobo: balanceAfter,
        total_debited_kobo: wallet.total_debited_kobo + amountKobo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id)
      .gte('balance_kobo', amountKobo); // Prevent race condition

    if (updateError) {
      return NextResponse.json({ error: 'Debit failed' }, { status: 500 });
    }

    // Ledger entry
    await supabase.from('mobile_wallet_ledger').insert({
      wallet_id: wallet.id,
      device_id: deviceId,
      transaction_type: 'debit',
      amount_kobo: amountKobo,
      balance_before_kobo: balanceBefore,
      balance_after_kobo: balanceAfter,
      reference_type: 'operation',
      reference_id: operationRef || null,
      description: `SabiWrite ${toolType || 'operation'}`,
    });

    return NextResponse.json({
      success: true,
      newBalanceKobo: balanceAfter,
      newBalanceNaira: balanceAfter / 100,
    });
  } catch (error) {
    console.error('[wallet/debit] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
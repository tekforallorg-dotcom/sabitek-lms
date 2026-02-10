/**
 * POST /api/mobile/sabiwrite/wallet/topup
 *
 * Verifies Paystack payment and credits the device wallet.
 * Body: { deviceId, reference }
 * Response: { newBalanceKobo, newBalanceNaira, creditedKobo }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, reference } = body as { deviceId?: string; reference?: string };

    if (!deviceId || !reference) {
      return NextResponse.json(
        { error: 'Missing deviceId or reference' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for duplicate reference
    const { data: existingLedger } = await supabase
      .from('mobile_wallet_ledger')
      .select('id')
      .eq('reference_id', reference)
      .eq('transaction_type', 'credit')
      .single();

    if (existingLedger) {
      // Idempotent — already processed
      const { data: wallet } = await supabase
        .from('mobile_wallets')
        .select('balance_kobo')
        .eq('device_id', deviceId)
        .single();

      return NextResponse.json({
        newBalanceKobo: wallet?.balance_kobo || 0,
        newBalanceNaira: (wallet?.balance_kobo || 0) / 100,
        creditedKobo: 0,
        status: 'already_processed',
      });
    }

    // Verify with Paystack
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data?.status !== 'success') {
      return NextResponse.json(
        { error: verifyData.message || 'Payment verification failed' },
        { status: 402 }
      );
    }

    const paidAmountKobo = verifyData.data.amount; // Paystack returns kobo

    // Get or create wallet
    let { data: wallet } = await supabase
      .from('mobile_wallets')
      .select('*')
      .eq('device_id', deviceId)
      .single();

    if (!wallet) {
      const { data: newWallet, error } = await supabase
        .from('mobile_wallets')
        .insert({ device_id: deviceId, balance_kobo: 0 })
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 });
      }
      wallet = newWallet;
    }

    const balanceBefore = wallet!.balance_kobo;
    const balanceAfter = balanceBefore + paidAmountKobo;

    // Credit wallet
    const { error: updateError } = await supabase
      .from('mobile_wallets')
      .update({
        balance_kobo: balanceAfter,
        total_credited_kobo: wallet!.total_credited_kobo + paidAmountKobo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet!.id);

    if (updateError) {
      console.error('[wallet/topup] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to credit wallet' }, { status: 500 });
    }

    // Create ledger entry
    await supabase.from('mobile_wallet_ledger').insert({
      wallet_id: wallet!.id,
      device_id: deviceId,
      transaction_type: 'credit',
      amount_kobo: paidAmountKobo,
      balance_before_kobo: balanceBefore,
      balance_after_kobo: balanceAfter,
      reference_type: 'topup',
      reference_id: reference,
      description: `Wallet top-up ₦${(paidAmountKobo / 100).toLocaleString()}`,
    });

    return NextResponse.json({
      newBalanceKobo: balanceAfter,
      newBalanceNaira: balanceAfter / 100,
      creditedKobo: paidAmountKobo,
    });
  } catch (error) {
    console.error('[wallet/topup] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
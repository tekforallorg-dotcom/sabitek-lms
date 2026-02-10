/**
 * POST /api/mobile/sabiwrite/entitlement/verify
 *
 * Verifies a payment receipt and creates a mobile entitlement.
 * Supports: google_play, apple_iap, paystack
 *
 * Body: {
 *   deviceId: string,
 *   paymentProvider: 'google_play' | 'apple_iap' | 'paystack',
 *   receipt: string | object,   // provider-specific receipt data
 *   toolType: MobileToolType,
 *   wordCount: number,
 * }
 *
 * Response: { entitlementId, status, priceKobo, expiresAt }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getMobilePrice, type MobileToolType } from '@/lib/sabiwrite/mobile-pricing';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type PaymentProvider = 'google_play' | 'apple_iap' | 'paystack';

/**
 * Verify payment receipt with provider.
 * TODO: Implement real verification for each provider.
 * For now, returns mock success for development.
 */
async function verifyReceipt(
  provider: PaymentProvider,
  receipt: unknown,
  expectedAmountKobo: number
): Promise<{
  valid: boolean;
  transactionId: string | null;
  error?: string;
}> {
  switch (provider) {
    case 'google_play': {
      // TODO: Verify with Google Play Developer API
      // https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.products/get
      const receiptData = receipt as { purchaseToken?: string; productId?: string };
      if (!receiptData?.purchaseToken) {
        return { valid: false, transactionId: null, error: 'Missing purchaseToken' };
      }
      // Mock verification for dev — replace with real API call
      return {
        valid: true,
        transactionId: `gp_${receiptData.purchaseToken.slice(0, 16)}`,
      };
    }

    case 'apple_iap': {
      // TODO: Verify with Apple App Store Server API
      // https://developer.apple.com/documentation/appstoreserverapi
      const receiptData = receipt as { transactionId?: string };
      if (!receiptData?.transactionId) {
        return { valid: false, transactionId: null, error: 'Missing transactionId' };
      }
      return {
        valid: true,
        transactionId: `apple_${receiptData.transactionId}`,
      };
    }

    case 'paystack': {
      // Verify with Paystack API
      const receiptData = receipt as { reference?: string };
      if (!receiptData?.reference) {
        return { valid: false, transactionId: null, error: 'Missing reference' };
      }

      try {
        const response = await fetch(
          `https://api.paystack.co/transaction/verify/${receiptData.reference}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
          }
        );

        const data = await response.json();

        if (data.status && data.data?.status === 'success') {
          const paidAmountKobo = data.data.amount; // Paystack returns amount in kobo
          if (paidAmountKobo < expectedAmountKobo) {
            return {
              valid: false,
              transactionId: null,
              error: `Paid ${paidAmountKobo} kobo but expected ${expectedAmountKobo} kobo`,
            };
          }
          return {
            valid: true,
            transactionId: `ps_${data.data.reference}`,
          };
        }

        return {
          valid: false,
          transactionId: null,
          error: data.message || 'Payment verification failed',
        };
      } catch (err) {
        console.error('[paystack verify] Error:', err);
        return { valid: false, transactionId: null, error: 'Paystack API error' };
      }
    }

    default:
      return { valid: false, transactionId: null, error: 'Unknown provider' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, paymentProvider, receipt, toolType, wordCount } = body as {
      deviceId?: string;
      paymentProvider?: PaymentProvider;
      receipt?: unknown;
      toolType?: MobileToolType;
      wordCount?: number;
    };

    // Validate
    if (!deviceId || !paymentProvider || !receipt || !toolType || !wordCount) {
      return NextResponse.json(
        { error: 'Missing required fields: deviceId, paymentProvider, receipt, toolType, wordCount' },
        { status: 400 }
      );
    }

    // Get expected price
    const priceEstimate = getMobilePrice(toolType, wordCount);
    if (!priceEstimate) {
      return NextResponse.json(
        { error: 'Invalid tool type or word count' },
        { status: 400 }
      );
    }

    // Verify payment
    const verification = await verifyReceipt(
      paymentProvider,
      receipt,
      priceEstimate.priceKobo
    );

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || 'Payment verification failed' },
        { status: 402 }
      );
    }

    // Check for duplicate transaction
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existing } = await supabase
      .from('mobile_entitlements')
      .select('id')
      .eq('transaction_id', verification.transactionId)
      .single();

    if (existing) {
      // Idempotent — return existing entitlement
      return NextResponse.json({
        entitlementId: existing.id,
        status: 'already_verified',
        priceKobo: priceEstimate.priceKobo,
      });
    }

    // Create entitlement (valid for 30 minutes)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { data: entitlement, error: insertError } = await supabase
      .from('mobile_entitlements')
      .insert({
        device_id: deviceId,
        payment_provider: paymentProvider,
        transaction_id: verification.transactionId,
        tool_type: toolType,
        word_count: wordCount,
        price_kobo: priceEstimate.priceKobo,
        status: 'paid',
        expires_at: expiresAt,
      })
      .select('id')
      .single();

    if (insertError || !entitlement) {
      console.error('[entitlement/verify] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create entitlement' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      entitlementId: entitlement.id,
      status: 'paid',
      priceKobo: priceEstimate.priceKobo,
      priceNaira: priceEstimate.priceNaira,
      expiresAt,
    });
  } catch (error) {
    console.error('[entitlement/verify] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
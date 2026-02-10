/**
 * POST /api/mobile/sabiwrite/pricing
 *
 * Public endpoint (no auth). Returns price estimate for mobile.
 * Body: { toolType, wordCount } or { toolType, inputText }
 *
 * Response: { priceNaira, priceKobo, bucket, wordCount, isPremium, maxWords }
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getMobilePrice,
  type MobileToolType,
} from '@/lib/sabiwrite/mobile-pricing';

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toolType, wordCount: rawWordCount, inputText } = body as {
      toolType?: MobileToolType;
      wordCount?: number;
      inputText?: string;
    };

    if (!toolType) {
      return NextResponse.json(
        { error: 'Missing toolType' },
        { status: 400 }
      );
    }

    // Accept either wordCount directly or compute from inputText
    const wordCount = rawWordCount ?? (inputText ? countWords(inputText) : 0);

    if (wordCount <= 0) {
      return NextResponse.json(
        { error: 'No text provided', wordCount: 0 },
        { status: 400 }
      );
    }

    const estimate = getMobilePrice(toolType, wordCount);

    if (!estimate) {
      return NextResponse.json(
        {
          error: 'Text exceeds maximum word limit',
          wordCount,
          maxWords: 5000,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(estimate);
  } catch (error) {
    console.error('[mobile/pricing] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
/**
 * POST /api/mobile/sabiwrite/process
 *
 * Supports two payment methods:
 *   1. entitlement — entitlementId from Paystack per-action flow
 *   2. wallet — wallet already debited via /wallet/debit
 *
 * Streams AI output via SSE, same prompts as web.
 *
 * Body: {
 *   entitlementId: string,     // 'wallet' if wallet-paid, or UUID from entitlement
 *   deviceId: string,
 *   toolType: MobileToolType,
 *   inputText: string,
 *   tone?: ToneType,
 *   action?: string,
 * }
 */
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getMobilePrice, type MobileToolType } from '@/lib/sabiwrite/mobile-pricing';
import { type ToneType, type ToolType } from '@/lib/sabiwrite/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Max tokens for AI output — 16384 supports ~12k words of output */
const MAX_OUTPUT_TOKENS = 16384;

/** Same system prompts as web process route — strict: no preamble, no explanation */
const SYSTEM_PROMPTS: Record<string, (tone: string, action: string) => string> = {
  rewrite: (tone) => `You are a professional writing assistant. Rewrite the following text in a ${tone} tone. Maintain the original meaning but improve clarity and flow. Output only plain text - no markdown, no bold, no asterisks, no special formatting. Use regular dashes (-) not em-dashes (—). IMPORTANT: Output ONLY the rewritten text. Do NOT include any introduction, preamble, explanation, or meta-commentary like "Here is the rewritten text:" - just output the result directly.`,
  shorten: (tone) => `You are a professional editor. Shorten the following text significantly while keeping the key points. Use a ${tone} tone. Output only plain text - no markdown, no bold, no asterisks. Use regular dashes (-) not em-dashes (—). IMPORTANT: Output ONLY the shortened text. Do NOT include any introduction, preamble, explanation, or meta-commentary - just output the result directly.`,
  expand: (tone) => `You are a professional writer. Expand the following text with more detail and examples. Use a ${tone} tone. Output only plain text - no markdown, no bold, no asterisks. Use regular dashes (-) not em-dashes (—). IMPORTANT: Output ONLY the expanded text. Do NOT include any introduction, preamble, explanation, or meta-commentary - just output the result directly.`,
  simplify: (tone) => `You are a professional editor. Simplify the following text so it's easier to understand. Use simple words and shorter sentences. Use a ${tone} tone. Output only plain text - no markdown formatting. Use regular dashes (-) not em-dashes (—). IMPORTANT: Output ONLY the simplified text. Do NOT include any introduction, preamble, explanation, or meta-commentary - just output the result directly.`,
  clarity: (tone) => `You are a professional editor. Improve the clarity of the following text. Fix any confusing sentences, improve structure, and make the message clearer. Use a ${tone} tone. Output only plain text - no markdown formatting. Use regular dashes (-) not em-dashes (—). IMPORTANT: Output ONLY the improved text. Do NOT include any introduction, preamble, explanation, or meta-commentary - just output the result directly.`,
  tone_change: (tone) => `You are a professional writer. Rewrite the following text in a ${tone} tone. Keep the meaning but change the style to match the requested tone. Output only plain text - no markdown formatting. Use regular dashes (-) not em-dashes (—). IMPORTANT: Output ONLY the rewritten text. Do NOT include any introduction, preamble, explanation, or meta-commentary - just output the result directly.`,
  detection: () => `You are an AI content detection expert. Analyze the following text and determine the probability it was written by AI.\n\nRespond in this exact JSON format only, no other text:\n{\n  "score": <number 0-100>,\n  "confidence": "<low|medium|high>",\n  "signals": [\n    {"type": "<signal_type>", "description": "<brief explanation>"}\n  ],\n  "summary": "<one sentence summary>"\n}\n\nScoring guide:\n- 0-30: Likely human-written\n- 31-60: Uncertain\n- 61-100: Likely AI-generated`,
  humanize_premium: (tone) => `You are an expert editor who transforms AI-generated text into natural, human-sounding writing. Your output must be the SAME LENGTH or LONGER than the input - do not shorten or summarize.\n\nTransform the following text to sound more human and natural while preserving ALL the content and meaning. Apply these techniques:\n- Add natural sentence variation (mix short and long)\n- Include subtle imperfections humans make\n- Use more conversational transitions\n- Add personal touches and voice\n- Vary paragraph lengths\n- Use contractions where natural\n- Replace generic phrases with specific ones\n${tone !== 'neutral' ? `- Maintain a ${tone} tone throughout` : ''}\n\nCRITICAL RULES:\n1. Output ONLY the humanized text - no introduction, no preamble, no "Here is the text" or similar\n2. Do NOT shorten or summarize - preserve ALL content from the original\n3. No markdown, no bold, no asterisks - plain text only\n4. Start directly with the transformed content`,
  plagiarism: () => `You are a plagiarism detection expert. Analyze the following text for potential plagiarism indicators.\n\nRespond in this exact JSON format only, no other text:\n{\n  "similarityScore": <number 0-100>,\n  "riskLevel": "<low|medium|high>",\n  "flags": [\n    {"type": "<flag_type>", "description": "<brief explanation>", "severity": "<low|medium|high>"}\n  ],\n  "summary": "<one sentence assessment>",\n  "recommendation": "<what the user should do next>"\n}`,
};

function getPromptKey(toolType: MobileToolType): string {
  if (toolType === 'humanize_premium') return 'humanize_premium';
  return toolType;
}


function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const body = await request.json();
    const {
      entitlementId,
      deviceId,
      toolType,
      inputText,
      tone = 'neutral',
      action,
    } = body as {
      entitlementId: string;
      deviceId: string;
      toolType: MobileToolType;
      inputText: string;
      tone?: ToneType;
      action?: string;
    };

    if (!entitlementId || !deviceId || !toolType || !inputText) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: entitlementId, deviceId, toolType, inputText' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const isWalletPayment = entitlementId === 'wallet';

    // --- Payment Verification ---
    if (isWalletPayment) {
      // Wallet path: verify device has a wallet and the debit already happened.
      const { data: wallet } = await supabase
        .from('mobile_wallets')
        .select('id, device_id')
        .eq('device_id', deviceId)
        .single();

      if (!wallet) {
        return new Response(
          JSON.stringify({ error: 'No wallet found for this device' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Entitlement path: verify entitlement exists and is unused
      const { data: entitlement, error: entError } = await supabase
        .from('mobile_entitlements')
        .select('*')
        .eq('id', entitlementId)
        .eq('device_id', deviceId)
        .eq('status', 'paid')
        .single();

      if (entError || !entitlement) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired entitlement' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Mark entitlement as consumed
      await supabase
        .from('mobile_entitlements')
        .update({ status: 'consumed', consumed_at: new Date().toISOString() })
        .eq('id', entitlementId);
    }

    // --- Pricing & Routing ---
    const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;
    const priceEstimate = getMobilePrice(toolType, wordCount);

    if (!priceEstimate) {
      return new Response(
        JSON.stringify({ error: 'Text exceeds word limit' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const inputTokens = estimateTokens(inputText);
    // Mobile always uses Claude Haiku — skip model router
    const routeDecision = {
      provider: 'anthropic' as const,
      model: 'claude-3-haiku-20240307',
      reason: 'mobile_always_haiku',
    };

    // --- Create Operation Record ---
    const { data: operation } = await supabase
      .from('mobile_operations')
      .insert({
        device_id: deviceId,
        entitlement_id: isWalletPayment ? null : entitlementId,
        tool_type: toolType,
        action: action || toolType,
        input_text: inputText,
        input_chars: inputText.length,
        input_tokens: inputTokens,
        word_count: wordCount,
        model_provider: routeDecision.provider,
        model_name: routeDecision.model,
        route_reason: routeDecision.reason,
        cost_kobo: priceEstimate.priceKobo,
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .select('id, created_at')
      .single();

    const operationId = operation?.id;

    // --- Build Prompt ---
    const promptKey = getPromptKey(toolType);
    const systemPrompt =
      SYSTEM_PROMPTS[promptKey]?.(tone, action || toolType) ||
      SYSTEM_PROMPTS.rewrite(tone, action || toolType);

    // --- Stream AI Response ---
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullOutput = '';

  // Stream from Claude Haiku
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.ANTHROPIC_API_KEY!,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: routeDecision.model,
              max_tokens: MAX_OUTPUT_TOKENS,
              stream: true,
              messages: [
                { role: 'user', content: `${systemPrompt}\n\nText to process:\n${inputText}` },
              ],
            }),
          });

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              for (const line of chunk.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data: ')) continue;
                try {
                  const json = JSON.parse(trimmed.slice(6));
                  if (json.type === 'content_block_delta' && json.delta?.text) {
                    fullOutput += json.delta.text;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: json.delta.text })}\n\n`));
                  }
                } catch {}
              }
            }
          }

          // Update operation as completed
          const outputTokens = estimateTokens(fullOutput);
          await supabase
            .from('mobile_operations')
            .update({
              output_text: fullOutput,
              output_tokens: outputTokens,
              status: 'completed',
              completed_at: new Date().toISOString(),
              duration_ms: Date.now() - new Date(operation?.created_at || Date.now()).getTime(),
            })
            .eq('id', operationId);

          // Send completion event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                operationId,
                costKobo: priceEstimate.priceKobo,
                model: routeDecision.model,
                wordCount,
                paymentMethod: isWalletPayment ? 'wallet' : 'entitlement',
              })}\n\n`
            )
          );

          controller.close();
        } catch (error) {
          console.error('[mobile/process] Streaming error:', error);

          await supabase
            .from('mobile_operations')
            .update({ status: 'failed', error_message: String(error) })
            .eq('id', operationId);

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Processing failed' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[mobile/process] API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
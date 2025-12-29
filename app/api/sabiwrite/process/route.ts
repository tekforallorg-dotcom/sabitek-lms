import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { routeModel, getModelConfig } from '@/lib/sabiwrite/model-router'
import { getPricingRule, calculateCostEstimate, estimateTokens } from '@/lib/sabiwrite/pricing'
import { debitWallet, getOrCreateWallet } from '@/lib/sabiwrite/wallet'
import { ToolType, ToneType, PlanTier } from '@/lib/sabiwrite/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const SYSTEM_PROMPTS: Record<string, (tone: ToneType, action: string) => string> = {
  rewrite: (tone, action) => `You are a professional writing assistant. Rewrite the following text in a ${tone} tone. Maintain the original meaning but improve clarity and flow. Output only plain text - no markdown, no bold, no asterisks, no special formatting. Use regular dashes (-) not em-dashes (—). Only output the rewritten text, no explanations.`,
  shorten: (tone, action) => `You are a professional editor. Shorten the following text significantly while keeping the key points. Use a ${tone} tone. Output only plain text - no markdown, no bold, no asterisks. Use regular dashes (-) not em-dashes (—). Only output the shortened text, no explanations.`,
  expand: (tone, action) => `You are a professional writer. Expand the following text with more detail and examples. Use a ${tone} tone. Output only plain text - no markdown, no bold, no asterisks. Use regular dashes (-) not em-dashes (—). Only output the expanded text, no explanations.`,
  simplify: (tone, action) => `You are a professional editor. Simplify the following text so it's easier to understand. Use simple words and shorter sentences. Use a ${tone} tone. Output only plain text - no markdown formatting. Use regular dashes (-) not em-dashes (—). Only output the simplified text, no explanations.`,
  clarity: (tone, action) => `You are a professional editor. Improve the clarity of the following text. Fix any confusing sentences, improve structure, and make the message clearer. Use a ${tone} tone. Output only plain text - no markdown formatting. Use regular dashes (-) not em-dashes (—). Only output the improved text, no explanations.`,
  tone_change: (tone, action) => `You are a professional writer. Rewrite the following text in a ${tone} tone. Keep the meaning but change the style to match the requested tone. Output only plain text - no markdown formatting. Use regular dashes (-) not em-dashes (—). Only output the rewritten text, no explanations.`,
  detection: () => `You are an AI content detection expert. Analyze the following text and determine the probability it was written by AI.

Respond in this exact JSON format only, no other text:
{
  "score": <number 0-100>,
  "confidence": "<low|medium|high>",
  "signals": [
    {"type": "<signal_type>", "description": "<brief explanation>"}
  ],
  "summary": "<one sentence summary>"
}

Scoring guide:
- 0-30: Likely human-written (natural variation, personal voice, imperfections)
- 31-60: Uncertain (mixed signals)
- 61-100: Likely AI-generated (uniform style, perfect grammar, generic phrasing)

Analyze for: repetitive patterns, overly formal structure, lack of personal voice, generic transitions, perfect punctuation, hedging phrases like "it's important to note", list-heavy formatting.`,
  humanize: (tone) => `You are an expert editor who transforms AI-generated text into natural, human-sounding writing.

Transform the following text to sound more human and natural while preserving the core meaning. Apply these techniques:
- Add natural sentence variation (mix short and long)
- Include subtle imperfections humans make
- Use more conversational transitions
- Add personal touches and voice
- Vary paragraph lengths
- Use contractions where natural
- Replace generic phrases with specific ones
- Add occasional rhetorical questions or asides
${tone !== 'neutral' ? `- Maintain a ${tone} tone throughout` : ''}

Output only plain text - no markdown, no bold, no asterisks. Use regular dashes (-) not em-dashes (—). Only output the humanized text, no explanations or commentary.`,
  plagiarism: () => `You are a plagiarism detection expert. Analyze the following text for potential plagiarism indicators.

Note: This is a heuristic analysis based on writing patterns, not a database comparison. For definitive results, use a dedicated plagiarism service.

Respond in this exact JSON format only, no other text:
{
  "similarityScore": <number 0-100>,
  "riskLevel": "<low|medium|high>",
  "flags": [
    {"type": "<flag_type>", "description": "<brief explanation>", "severity": "<low|medium|high>"}
  ],
  "commonPhrases": [
    "<phrase that appears generic or commonly used>"
  ],
  "summary": "<one sentence assessment>",
  "recommendation": "<what the user should do next>"
}

Analysis criteria:
- 0-20: Low risk (original-sounding, unique voice, specific examples)
- 21-50: Medium risk (some generic phrases, common structures)
- 51-100: High risk (highly generic, templated language, clichés)

Look for:
- Overly generic phrases that appear in many texts
- Wikipedia-style factual statements without attribution
- Common essay structures and transitions
- Lack of personal voice or specific examples
- Technical definitions that sound copied
- Inconsistent writing style within the text`
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()
  
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await request.json()
    const { 
      sessionId, 
      toolType, 
      action, 
      inputText, 
      tone = 'neutral',
      confirmed = false 
    } = body as {
      sessionId?: string
      toolType: ToolType
      action: string
      inputText: string
      tone: ToneType
      confirmed: boolean
    }

    if (!toolType || !inputText) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get user plan tier
    const { data: userProfile } = await supabase
      .from('users')
      .select('plan_tier')
      .eq('id', user.id)
      .single()

    const planTier: PlanTier = userProfile?.plan_tier || 'free'

    // Calculate cost
    const inputTokens = estimateTokens(inputText)
    const pricingRule = await getPricingRule(toolType, planTier)
    
    if (!pricingRule) {
      return new Response(JSON.stringify({ error: 'Pricing not found' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const costEstimate = calculateCostEstimate(inputTokens, pricingRule)

    // Check wallet balance
   const wallet = await getOrCreateWallet(supabase, user.id)
    if (wallet.balance_kobo < costEstimate.totalCostKobo) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient balance',
        required: costEstimate.totalCostKobo,
        balance: wallet.balance_kobo
      }), { 
        status: 402,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // If confirmation required and not confirmed
    if (costEstimate.requiresConfirmation && !confirmed) {
      return new Response(JSON.stringify({ 
        requiresConfirmation: true,
        estimate: costEstimate
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Route to model
    const routeDecision = routeModel({
      toolType,
      planTier,
      inputTokens,
      tone,
      modelPreference: pricingRule.model_preference
    })

    // Create or get session
    let currentSessionId = sessionId
    if (!currentSessionId) {
      const { data: newSession } = await supabase
        .from('sabiwrite_sessions')
        .insert({
          user_id: user.id,
          title: inputText.slice(0, 50) + (inputText.length > 50 ? '...' : ''),
          status: 'active'
        })
        .select('id')
        .single()
      
      currentSessionId = newSession?.id
    }

    // Create operation record
    const { data: operation } = await supabase
      .from('sabiwrite_operations')
      .insert({
        session_id: currentSessionId,
        user_id: user.id,
        tool_type: toolType,
        action,
        pricing_rule_id: pricingRule.id,
        input_text: inputText,
        input_chars: inputText.length,
        input_tokens: inputTokens,
        chunk_count: costEstimate.chunkCount,
        model_provider: routeDecision.provider,
        model_name: routeDecision.model,
        route_reason: routeDecision.reason,
        cost_kobo: costEstimate.totalCostKobo,
        estimated_cost_kobo: costEstimate.totalCostKobo,
        status: 'processing',
        started_at: new Date().toISOString()
      })
     .select('id, created_at')
      .single()

    const operationId = operation?.id

    // Debit wallet
  const debitResult = await debitWallet(supabase, {
      userId: user.id,
      amountKobo: costEstimate.totalCostKobo,
      referenceType: 'operation',
      referenceId: operationId,
      description: `${toolType} - ${action || 'default'}`
    })

    if (!debitResult.success) {
      await supabase
        .from('sabiwrite_operations')
        .update({ status: 'failed', error_message: 'Payment failed' })
        .eq('id', operationId)

      return new Response(JSON.stringify({ error: 'Payment failed' }), { 
        status: 402,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Build prompt
    const systemPrompt = SYSTEM_PROMPTS[toolType]?.(tone, action) || SYSTEM_PROMPTS.rewrite(tone, action)

    // Call AI with streaming
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullOutput = ''

          if (routeDecision.provider === 'deepseek') {
            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
              },
              body: JSON.stringify({
                model: routeDecision.model,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: inputText }
                ],
                stream: true,
                max_tokens: 4096
              })
            })

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            if (reader) {
              while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                const lines = chunk.split('\n')

                for (const line of lines) {
                  const trimmed = line.trim()
                  if (!trimmed || trimmed === 'data: [DONE]') continue
                  if (!trimmed.startsWith('data: ')) continue

                  try {
                    const json = JSON.parse(trimmed.slice(6))
                    const content = json.choices?.[0]?.delta?.content
                    if (content) {
                      fullOutput += content
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                    }
                  } catch (e) {
                    // Skip malformed JSON
                  }
                }
              }
            }
          } else {
            // Anthropic Claude
            const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY!,
                'anthropic-version': '2023-06-01'
              },
              body: JSON.stringify({
                model: routeDecision.model,
                max_tokens: 4096,
                stream: true,
                messages: [
                  { role: 'user', content: `${systemPrompt}\n\nText to process:\n${inputText}` }
                ]
              })
            })

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            if (reader) {
              while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                const lines = chunk.split('\n')

                for (const line of lines) {
                  const trimmed = line.trim()
                  if (!trimmed || !trimmed.startsWith('data: ')) continue

                  try {
                    const json = JSON.parse(trimmed.slice(6))
                    if (json.type === 'content_block_delta' && json.delta?.text) {
                      fullOutput += json.delta.text
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: json.delta.text })}\n\n`))
                    }
                  } catch (e) {
                    // Skip malformed JSON
                  }
                }
              }
            }
          }

          // Update operation with output
          const outputTokens = estimateTokens(fullOutput)
          await supabase
            .from('sabiwrite_operations')
            .update({
              output_text: fullOutput,
              output_tokens: outputTokens,
              status: 'completed',
              completed_at: new Date().toISOString(),
              duration_ms: Date.now() - new Date(operation?.created_at || Date.now()).getTime()
            })
            .eq('id', operationId)

          // Update session
          await supabase
            .from('sabiwrite_sessions')
            .update({
              last_tool_used: toolType,
              total_cost_kobo: supabase.rpc('increment_cost', { 
                session_id: currentSessionId, 
                cost: costEstimate.totalCostKobo 
              }),
              message_count: supabase.rpc('increment_messages', { session_id: currentSessionId }),
              updated_at: new Date().toISOString()
            })
            .eq('id', currentSessionId)

          // Send completion with metadata
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            done: true,
            operationId,
            sessionId: currentSessionId,
            costKobo: costEstimate.totalCostKobo,
            newBalance: debitResult.newBalance,
            model: routeDecision.model
          })}\n\n`))

          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          
          // Update operation as failed
          await supabase
            .from('sabiwrite_operations')
            .update({ status: 'failed', error_message: String(error) })
            .eq('id', operationId)

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Processing failed' })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

  } catch (error) {
    console.error('Process API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
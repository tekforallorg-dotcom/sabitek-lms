import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPricingRule, calculateCostEstimate, estimateTokens, formatNaira, getWalletBalance } from '@/lib/sabiwrite/pricing'
import { routeModel } from '@/lib/sabiwrite/model-router'
import { ToolType, PlanTier, ToneType } from '@/lib/sabiwrite/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { toolType, inputText, tone } = body as {
      toolType: ToolType
      inputText: string
      tone?: ToneType
    }

    if (!toolType || !inputText) {
      return NextResponse.json({ error: 'Missing toolType or inputText' }, { status: 400 })
    }

    // Get user's plan tier (default to free)
    const { data: userProfile } = await supabase
      .from('users')
      .select('plan_tier')
      .eq('id', user.id)
      .single()

    const planTier: PlanTier = userProfile?.plan_tier || 'free'

    // Get pricing rule
    const pricingRule = await getPricingRule(toolType, planTier)
    if (!pricingRule) {
      return NextResponse.json({ error: 'Pricing not found for this operation' }, { status: 400 })
    }

    // Calculate tokens and cost
    const inputTokens = estimateTokens(inputText)
    const estimate = calculateCostEstimate(inputTokens, pricingRule)

    // Get model route decision
    const routeDecision = routeModel({
      toolType,
      planTier,
      inputTokens,
      tone,
      modelPreference: pricingRule.model_preference
    })

    // Get wallet balance
    const walletBalance = await getWalletBalance(user.id)
    const canAfford = walletBalance >= estimate.totalCostKobo
    const shortfall = canAfford ? 0 : estimate.totalCostKobo - walletBalance

    return NextResponse.json({
      estimate: {
        ...estimate,
        totalCostFormatted: formatNaira(estimate.totalCostKobo),
        baseCostFormatted: formatNaira(estimate.baseCostKobo)
      },
      model: {
        provider: routeDecision.provider,
        name: routeDecision.model,
        reason: routeDecision.reason
      },
      wallet: {
        balanceKobo: walletBalance,
        balanceFormatted: formatNaira(walletBalance),
        canAfford,
        shortfallKobo: shortfall,
        shortfallFormatted: shortfall > 0 ? formatNaira(shortfall) : null
      },
      inputTokens,
      planTier
    })
  } catch (error) {
    console.error('Pricing API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
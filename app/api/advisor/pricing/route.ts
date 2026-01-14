import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  estimateOperationCost, 
  getModulePricing,
  AdvisorOperationType,
  AdvisorModule 
} from '@/lib/advisor/pricing'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/advisor/pricing
 * Get pricing for operations
 * 
 * Query params:
 * - operation: specific operation type
 * - module: get all pricing for a module (cv, cover_letter, interview, roadmap)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const operation = searchParams.get('operation') as AdvisorOperationType | null
    const module = searchParams.get('module') as AdvisorModule | null

    if (operation) {
      // Get pricing for specific operation
      const estimate = await estimateOperationCost(supabaseAdmin, operation)
      
      if (!estimate) {
        return NextResponse.json(
          { error: 'Operation not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(estimate)
    }

    if (module) {
      // Get all pricing for a module
      const pricing = await getModulePricing(supabaseAdmin, module)
      return NextResponse.json({ pricing })
    }

    // Get all pricing
    const { data: allPricing, error } = await supabaseAdmin
      .from('advisor_pricing')
      .select('*')
      .eq('is_active', true)
      .order('module')
      .order('base_cost_kobo')

    if (error) {
      throw error
    }

    // Group by module
    const grouped = allPricing.reduce((acc, item) => {
      if (!acc[item.module]) {
        acc[item.module] = []
      }
      acc[item.module].push(item)
      return acc
    }, {} as Record<string, typeof allPricing>)

    return NextResponse.json({ pricing: grouped })

  } catch (error) {
    console.error('Pricing API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pricing' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/advisor/pricing/estimate
 * Estimate cost for an operation (with optional cache check)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operationType } = body as { operationType: AdvisorOperationType }

    if (!operationType) {
      return NextResponse.json(
        { error: 'operationType is required' },
        { status: 400 }
      )
    }

    const estimate = await estimateOperationCost(supabaseAdmin, operationType)

    if (!estimate) {
      return NextResponse.json(
        { error: 'Operation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(estimate)

  } catch (error) {
    console.error('Estimate API error:', error)
    return NextResponse.json(
      { error: 'Failed to estimate cost' },
      { status: 500 }
    )
  }
}
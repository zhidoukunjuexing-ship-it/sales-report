import { NextRequest, NextResponse } from 'next/server'
import { analyzeKpi } from '@/lib/analyzer'
import { KpiData } from '@/lib/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { today, history = [] } = body as { today: KpiData; history: KpiData[] }

  const result = analyzeKpi(today, history)
  return NextResponse.json(result)
}

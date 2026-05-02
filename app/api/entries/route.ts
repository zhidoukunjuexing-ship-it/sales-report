import { NextRequest, NextResponse } from 'next/server'
import { supabase, kpiDataToRow, rowToKpiData } from '@/lib/supabase'
import { KpiData } from '@/lib/types'

// 一覧取得
export async function GET() {
  const { data, error } = await supabase
    .from('kpi_entries')
    .select('*')
    .order('date', { ascending: false })
    .order('member_name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data.map(rowToKpiData))
}

// 保存（upsert: 同じメンバー+日付なら上書き）
export async function POST(req: NextRequest) {
  const data: KpiData = await req.json()
  const row = kpiDataToRow(data)

  const { error } = await supabase
    .from('kpi_entries')
    .upsert(row, { onConflict: 'member_name,date' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

import { createClient } from '@supabase/supabase-js'
import { KpiData } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type KpiEntryRow = {
  id: string
  member_name: string
  date: string
  visits: number
  interphones: number
  facings: number
  presentations: number
  full_talks: number
  in_homes: number
  negotiations: number
  prospects: number
  orders: number
  daily_report: string
  created_at: string
}

export function rowToKpiData(row: KpiEntryRow): KpiData {
  return {
    date: row.date,
    memberName: row.member_name,
    visits: row.visits,
    interphones: row.interphones,
    facings: row.facings,
    presentations: row.presentations,
    fullTalks: row.full_talks,
    inHomes: row.in_homes,
    negotiations: row.negotiations,
    prospects: row.prospects,
    orders: row.orders,
    dailyReport: row.daily_report,
  }
}

export function kpiDataToRow(data: KpiData): Omit<KpiEntryRow, 'id' | 'created_at'> {
  return {
    member_name: data.memberName,
    date: data.date,
    visits: data.visits,
    interphones: data.interphones,
    facings: data.facings,
    presentations: data.presentations,
    full_talks: data.fullTalks,
    in_homes: data.inHomes,
    negotiations: data.negotiations,
    prospects: data.prospects,
    orders: data.orders,
    daily_report: data.dailyReport,
  }
}

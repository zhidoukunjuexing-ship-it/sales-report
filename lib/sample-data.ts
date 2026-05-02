import { KpiData } from './types'

export const SAMPLE_KPI: KpiData = {
  date: '2026-04-26',
  memberName: '山田 太郎',
  visits: 80,
  interphones: 60,
  facings: 20,
  presentations: 18,
  fullTalks: 10,
  inHomes: 3,
  negotiations: 2,
  prospects: 1,
  orders: 0,
  targets: {
    visits: 100,
    interphones: 80,
    facings: 30,
    presentations: 25,
    fullTalks: 15,
    inHomes: 8,
    negotiations: 5,
    prospects: 3,
    orders: 1,
  },
  dailyReport: `本日は訪問数80件、紙プレ18件実施しました。
宅内には3件入れましたが受注には繋がりませんでした。
フルトークの精度をもっと上げていきたいと思います。
明日は訪問数を増やして頑張ります。`,
}

export const SAMPLE_HISTORY: KpiData[] = [
  {
    date: '2026-04-25',
    memberName: '山田 太郎',
    visits: 75,
    interphones: 55,
    facings: 18,
    presentations: 16,
    fullTalks: 9,
    inHomes: 2,
    negotiations: 1,
    prospects: 1,
    orders: 0,
    dailyReport: 'フルトークの精度が課題だと感じました。',
  },
  {
    date: '2026-04-24',
    memberName: '山田 太郎',
    visits: 70,
    interphones: 50,
    facings: 15,
    presentations: 14,
    fullTalks: 8,
    inHomes: 2,
    negotiations: 1,
    prospects: 0,
    orders: 0,
    dailyReport: '今日も頑張りました。明日も頑張ります。',
  },
]

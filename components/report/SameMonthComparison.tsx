import { KpiData, AnalysisResult } from '@/lib/types'

type Props = {
  data: KpiData
  analysis: AnalysisResult
}

// TOP16の稼働N月目ごとの実績（PDFデータ8ヶ月 × TOP16メンバー分析より）
// n=8（1月目）, n=6（2月目）, n=3（3月目）
const TOP16_BY_MONTH: Record<number, {
  avgWins: number
  facingRate: number
  negoRate: number
  winRate: number
  vpw: number
}> = {
  1: { avgWins: 3.8,  facingRate: 36.9, negoRate: 44.0, winRate: 12.8, vpw: 987 },
  2: { avgWins: 15.0, facingRate: 68.7, negoRate: 49.6, winRate: 32.6, vpw: 293 },
  3: { avgWins: 8.3,  facingRate: 70.2, negoRate: 53.1, winRate: 21.0, vpw: 371 },
}
// 4ヶ月目以降はピーク水準（月10件以上エントリの集計値）
const TOP16_PEAK = { avgWins: 17, facingRate: 55.4, negoRate: 62.0, winRate: 31.1, vpw: 243 }

function getTop16ForMonth(month: number) {
  return TOP16_BY_MONTH[month] ?? TOP16_PEAK
}

type BarItem = {
  label: string
  mine: number
  top16: number
  unit: string
  lowerIsBetter?: boolean
}

function getColor(mine: number, top16: number, lowerIsBetter = false): string {
  const ratio = lowerIsBetter
    ? top16 / Math.max(mine, 0.001)
    : mine / Math.max(top16, 0.001)
  if (ratio >= 1.0) return 'bg-green-500'
  if (ratio >= 0.8) return 'bg-yellow-400'
  return 'bg-red-400'
}

function getTextColor(mine: number, top16: number, lowerIsBetter = false): string {
  const ratio = lowerIsBetter
    ? top16 / Math.max(mine, 0.001)
    : mine / Math.max(top16, 0.001)
  if (ratio >= 1.0) return 'text-green-700'
  if (ratio >= 0.8) return 'text-yellow-700'
  return 'text-red-600'
}

function CompareBar({ label, mine, top16, unit, lowerIsBetter = false }: BarItem) {
  const max = Math.max(mine, top16, 0.001)
  const myWidth = Math.min((mine / max) * 100, 100)
  const topWidth = Math.min((top16 / max) * 100, 100)
  const barColor = getColor(mine, top16, lowerIsBetter)
  const textColor = getTextColor(mine, top16, lowerIsBetter)
  const diff = lowerIsBetter
    ? round1(top16 - mine)
    : round1(mine - top16)
  const sign = diff >= 0 ? '+' : ''

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-gray-700">{label}</span>
        <span className={`text-xs font-bold ${textColor}`}>
          {sign}{diff}{unit} vs TOP16
        </span>
      </div>
      {/* 自分 */}
      <div className="mb-1">
        <div className="flex justify-between text-xs text-gray-500 mb-0.5">
          <span>自分</span>
          <span className={`font-bold ${textColor}`}>{mine}{unit}</span>
        </div>
        <div className="h-5 bg-gray-100 rounded overflow-hidden">
          <div className={`h-full rounded ${barColor} transition-all`} style={{ width: `${myWidth}%` }} />
        </div>
      </div>
      {/* TOP16 */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-0.5">
          <span>TOP16（同月目）</span>
          <span>{top16}{unit}</span>
        </div>
        <div className="h-5 bg-gray-100 rounded overflow-hidden">
          <div className="h-full rounded bg-gray-300" style={{ width: `${topWidth}%` }} />
        </div>
      </div>
    </div>
  )
}

function round1(n: number) {
  return Math.round(n * 10) / 10
}

export function SameMonthComparison({ data, analysis }: Props) {
  const month = analysis.monthsActive
  const top16 = getTop16ForMonth(month)

  const facingConv = analysis.conversions.find(c => c.from === 'interphones' && c.to === 'facings')
  const negoConv = analysis.conversions.find(
    c => c.to === 'negotiations' && (c.from === 'facings' || c.from === 'inHomes')
  )
  const winConv = analysis.conversions.find(c => c.to === 'orders')

  const myFacingRate = facingConv?.rate ?? 0
  const myNegoRate = negoConv?.rate ?? 0
  const myWinRate = winConv?.rate ?? 0
  const myVpw = data.orders > 0 ? Math.round(data.visits / data.orders) : null

  // 稼働月数バッジ色
  const monthColor =
    month <= 2 ? 'bg-blue-100 text-blue-800' :
    month <= 4 ? 'bg-purple-100 text-purple-800' :
    'bg-indigo-100 text-indigo-800'

  // TOP16データの信頼度注記
  const sampleNote =
    month === 1 ? '（n=8）' :
    month === 2 ? '（n=6）' :
    month === 3 ? '（n=3）' :
    '（ピーク水準）'

  const bars: BarItem[] = [
    { label: '対面率（インターホン→対面）', mine: myFacingRate, top16: top16.facingRate, unit: '%' },
    { label: '商談率（対面→商談）', mine: myNegoRate, top16: top16.negoRate, unit: '%' },
    { label: '獲得率（商談→受注）', mine: myWinRate, top16: top16.winRate, unit: '%' },
  ]

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-lg font-bold text-gray-800">同月比較（稼働月目）</h2>
        <span className={`text-sm font-bold px-3 py-0.5 rounded-full ${monthColor}`}>
          稼働{month}ヶ月目
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        TOP16メンバーが稼働{month}ヶ月目のときの平均値{sampleNote}と比較しています。
        {month >= 4 && ' ※4ヶ月目以降はピーク水準（月10件以上エントリ）を基準としています。'}
      </p>

      {/* TOP16同月の獲得数比較 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">自分の月獲得数</p>
          <p className="text-3xl font-bold text-gray-900">{data.orders}<span className="text-sm text-gray-500 ml-1">件</span></p>
          <p className="text-xs text-gray-400 mt-1">（本日入力値）</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">TOP16 {month}ヶ月目平均</p>
          <p className="text-3xl font-bold text-gray-600">{top16.avgWins}<span className="text-sm text-gray-400 ml-1">件</span></p>
          <p className="text-xs text-gray-400 mt-1">月平均獲得数</p>
        </div>
      </div>

      {/* 転換率3項目の比較バー */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        {bars.map(b => (
          <CompareBar key={b.label} {...b} />
        ))}

        {/* 訪問/獲得の比較 */}
        {myVpw !== null ? (
          <CompareBar
            label="訪問/獲得（低いほど良い）"
            mine={myVpw}
            top16={top16.vpw}
            unit="件"
            lowerIsBetter
          />
        ) : (
          <div className="text-xs text-gray-400 mt-2">
            受注ゼロのため訪問/獲得は算出不可（TOP16同月基準: {top16.vpw}件/獲得）
          </div>
        )}
      </div>

      {/* 成長フェーズ説明 */}
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs font-bold text-blue-800 mb-1">
          稼働{month}ヶ月目の目標
        </p>
        <p className="text-xs text-blue-700">
          {month === 1 && 'まず行動量を確保してください。1ヶ月目は訪問数を最優先に。対面率・商談率はこれから磨いていきます。'}
          {month === 2 && 'TOP16は2ヶ月目で大きく跳ねます（平均15件）。対面率68%・訪問300件/獲得を目標にしてください。'}
          {month === 3 && '対面率70%台を維持しながら、商談率53%・獲得率21%以上を目指してください。'}
          {month >= 4 && `稼働${month}ヶ月目以降はピーク水準（対面率55%・商談率62%・獲得率31%・訪問243件/獲得）を標準目標とします。訪問量を増やしながら精度も高めていく段階です。`}
        </p>
      </div>
    </section>
  )
}

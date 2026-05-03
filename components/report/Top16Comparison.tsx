'use client'

import { KpiData, AnalysisResult } from '@/lib/types'
import { TOP_PLAYER_BENCHMARKS } from '@/lib/analyzer'

type Props = {
  data: KpiData
  analysis: AnalysisResult
}

type ComparisonItem = {
  label: string
  myRate: number
  top16Rate: number
  unit: string
  // lower is better when true (e.g. visits per win)
  lowerIsBetter?: boolean
}

function getBarColor(myRate: number, top16Rate: number, lowerIsBetter = false): {
  bar: string
  text: string
  badge: string
} {
  const ratio = lowerIsBetter
    ? top16Rate / Math.max(myRate, 0.001)
    : myRate / Math.max(top16Rate, 0.001)

  if (ratio >= 1.0) {
    return {
      bar: 'bg-green-500',
      text: 'text-green-700',
      badge: 'bg-green-100 text-green-800',
    }
  }
  if (ratio >= 0.8) {
    return {
      bar: 'bg-yellow-400',
      text: 'text-yellow-700',
      badge: 'bg-yellow-100 text-yellow-800',
    }
  }
  return {
    bar: 'bg-red-400',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-800',
  }
}

function getStatusLabel(myRate: number, top16Rate: number, lowerIsBetter = false): string {
  const ratio = lowerIsBetter
    ? top16Rate / Math.max(myRate, 0.001)
    : myRate / Math.max(top16Rate, 0.001)

  if (ratio >= 1.0) return 'TOP16超え'
  if (ratio >= 0.8) return '基準の80%以上'
  return '要改善'
}

function ProgressBar({
  myRate,
  top16Rate,
  lowerIsBetter = false,
  unit,
}: {
  myRate: number
  top16Rate: number
  lowerIsBetter?: boolean
  unit: string
}) {
  const colors = getBarColor(myRate, top16Rate, lowerIsBetter)

  // Normalize bar widths relative to the larger of the two values
  const maxVal = Math.max(myRate, top16Rate, 0.001)
  const myWidth = Math.min((myRate / maxVal) * 100, 100)
  const top16Width = Math.min((top16Rate / maxVal) * 100, 100)

  return (
    <div className="space-y-1.5">
      {/* 自分のバー */}
      <div>
        <div className="flex items-center justify-between text-xs mb-0.5">
          <span className="text-gray-600 font-medium">自分</span>
          <span className={`font-bold ${colors.text}`}>
            {myRate % 1 === 0 ? myRate : myRate.toFixed(1)}{unit}
          </span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${colors.bar}`}
            style={{ width: `${myWidth}%` }}
          />
        </div>
      </div>

      {/* TOP16バー */}
      <div>
        <div className="flex items-center justify-between text-xs mb-0.5">
          <span className="text-gray-500">TOP16</span>
          <span className="font-medium text-gray-500">
            {top16Rate % 1 === 0 ? top16Rate : top16Rate.toFixed(1)}{unit}
          </span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gray-300"
            style={{ width: `${top16Width}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export function Top16Comparison({ data, analysis }: Props) {
  // 転換率4ステップをanaysis.conversionsから抽出
  // ネット対面率: visits → interphones
  // 対面率:       interphones → facings
  // 商談率:       facings → negotiations (funnelではfacings→negotiations間にpresentations/fullTalks/inHomesが挟まるが、
  //               実データ上は対面→商談を直接比較)
  // 獲得率:       negotiations → orders
  const findConversion = (from: string, to: string) =>
    analysis.conversions.find((c) => c.from === from && c.to === to)

  const netFacing = findConversion('visits', 'interphones')
  const facing = findConversion('interphones', 'facings')
  // 商談率は facings → negotiations を採用（中間ステップが未入力の場合が多い）
  const negotiation = findConversion('facings', 'negotiations')
  const win = findConversion('negotiations', 'orders')

  // 転換率比較アイテム（benchmark は analyzer.ts の BENCHMARKS 値が入っている）
  const conversionItems: ComparisonItem[] = [
    {
      label: 'ネット対面率',
      myRate: netFacing?.rate ?? 0,
      top16Rate: netFacing?.benchmark ?? 4,
      unit: '%',
    },
    {
      label: '対面率',
      myRate: facing?.rate ?? 0,
      top16Rate: facing?.benchmark ?? 54,
      unit: '%',
    },
    {
      label: '商談率',
      myRate: negotiation?.rate ?? 0,
      top16Rate: negotiation?.benchmark ?? 50,
      unit: '%',
    },
    {
      label: '獲得率',
      myRate: win?.rate ?? 0,
      top16Rate: win?.benchmark ?? 30,
      unit: '%',
    },
  ]

  // 訪問/獲得の比較
  const visitsPerWin =
    data.orders > 0 ? Math.round(data.visits / data.orders) : null

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-gray-800 border-b-2 border-blue-500 pb-1 mb-4">
        TOP16比較
      </h2>

      <p className="text-xs text-gray-500 mb-4">
        TOP16ベンチマーク: トッププレイヤー16名の平均値（月10件以上エントリ）との比較です。
      </p>

      {/* 転換率4ステップ — 横並び4カラム */}
      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        {conversionItems.map((item) => {
          const colors = getBarColor(item.myRate, item.top16Rate)
          const statusLabel = getStatusLabel(item.myRate, item.top16Rate)
          return (
            <div key={item.label} className="border border-gray-200 rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-700">{item.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${colors.badge}`}>
                  {statusLabel}
                </span>
              </div>
              <ProgressBar
                myRate={item.myRate}
                top16Rate={item.top16Rate}
                unit={item.unit}
              />
            </div>
          )
        })}
      </div>

      {/* 訪問/獲得の比較 */}
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <h3 className="text-sm font-bold text-gray-700 mb-3">訪問/獲得（何件訪問して1件獲得するか）</h3>
        {visitsPerWin !== null ? (
          <div>
            <ProgressBar
              myRate={visitsPerWin}
              top16Rate={TOP_PLAYER_BENCHMARKS.visitsPerWin}
              lowerIsBetter
              unit="件"
            />
            <div className="mt-2 flex items-center gap-2">
              {(() => {
                const colors = getBarColor(visitsPerWin, TOP_PLAYER_BENCHMARKS.visitsPerWin, true)
                const statusLabel = getStatusLabel(visitsPerWin, TOP_PLAYER_BENCHMARKS.visitsPerWin, true)
                return (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${colors.badge}`}>
                    {statusLabel}
                  </span>
                )
              })()}
              <span className="text-xs text-gray-500">
                TOP16基準: {TOP_PLAYER_BENCHMARKS.visitsPerWin}件 / 獲得1件
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            受注ゼロのため訪問/獲得は算出できません。
            （TOP16基準: {TOP_PLAYER_BENCHMARKS.visitsPerWin}件/獲得）
          </p>
        )}
      </div>
    </section>
  )
}

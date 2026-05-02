'use client'

import { KpiData, KPI_LABELS, FUNNEL_STEPS, AnalysisResult } from '@/lib/types'

type Props = {
  data: KpiData
  analysis: AnalysisResult
}

const STATUS_COLOR: Record<string, string> = {
  good: 'text-green-600 bg-green-50',
  warning: 'text-yellow-600 bg-yellow-50',
  critical: 'text-red-600 bg-red-50',
  pending: 'text-gray-400 bg-gray-50',
}

const STATUS_LABEL: Record<string, string> = {
  good: '良好',
  warning: '要注意',
  critical: '要改善',
  pending: '基準未設定',
}

export function KpiSummary({ data, analysis }: Props) {
  const convMap = Object.fromEntries(
    analysis.conversions.map((c) => [c.to, c])
  )

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-gray-800 border-b-2 border-blue-600 pb-1 mb-4">
        Section 1 — KPIサマリー
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left px-3 py-2 border border-gray-200">項目</th>
              <th className="text-right px-3 py-2 border border-gray-200">実績</th>
              <th className="text-right px-3 py-2 border border-gray-200">目標</th>
              <th className="text-right px-3 py-2 border border-gray-200">達成率</th>
              <th className="text-right px-3 py-2 border border-gray-200">転換率</th>
              <th className="text-center px-3 py-2 border border-gray-200">判定</th>
            </tr>
          </thead>
          <tbody>
            {FUNNEL_STEPS.map((key) => {
              const actual = data[key] as number
              const target = data.targets?.[key as keyof typeof data.targets] as number | undefined
              const achievement = target ? Math.round((actual / target) * 100) : null
              const conv = convMap[key]

              return (
                <tr key={key} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border border-gray-200 font-medium">
                    {KPI_LABELS[key]}
                  </td>
                  <td className="text-right px-3 py-2 border border-gray-200 font-bold">
                    {actual}
                  </td>
                  <td className="text-right px-3 py-2 border border-gray-200 text-gray-500">
                    {target ?? '—'}
                  </td>
                  <td className="text-right px-3 py-2 border border-gray-200">
                    {achievement !== null ? (
                      <span className={achievement >= 100 ? 'text-green-600 font-bold' : achievement >= 80 ? 'text-yellow-600' : 'text-red-600'}>
                        {achievement}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="text-right px-3 py-2 border border-gray-200 text-gray-600">
                    {conv ? `${conv.rate}%` : '—'}
                  </td>
                  <td className="text-center px-3 py-2 border border-gray-200">
                    {conv ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[conv.status]}`}>
                        {STATUS_LABEL[conv.status]}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ファネル可視化 */}
      <div className="mt-4 flex items-end gap-1 h-16">
        {FUNNEL_STEPS.map((key, i) => {
          const first = data[FUNNEL_STEPS[0]] as number
          const val = data[key] as number
          const pct = first > 0 ? (val / first) * 100 : 0
          const conv = convMap[key]
          const color =
            conv?.status === 'critical' ? 'bg-red-400' :
            conv?.status === 'warning' ? 'bg-yellow-400' :
            'bg-blue-400'

          return (
            <div key={key} className="flex flex-col items-center flex-1">
              <span className="text-xs text-gray-500 mb-0.5">{val}</span>
              <div
                className={`w-full rounded-t ${i === 0 ? 'bg-blue-600' : color}`}
                style={{ height: `${Math.max(pct, 4)}%` }}
              />
              <span className="text-xs text-gray-400 mt-0.5 truncate w-full text-center">
                {KPI_LABELS[key].replace(/数$/, '')}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

'use client'

import { ActionItem, AnalysisResult } from '@/lib/types'

type Props = {
  analysis: AnalysisResult
}

const PERIOD_CONFIG = {
  today: { label: '今日やること', icon: '🔥', color: 'border-red-400 bg-red-50' },
  week: { label: '今週やること', icon: '📅', color: 'border-orange-400 bg-orange-50' },
  month: { label: '今月やること', icon: '📆', color: 'border-blue-400 bg-blue-50' },
  half_year: { label: '半期目標', icon: '🎯', color: 'border-green-400 bg-green-50' },
}

const PRIORITY_BADGE: Record<ActionItem['priority'], string> = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  normal: 'bg-gray-100 text-gray-600 border-gray-200',
}

const PRIORITY_LABEL: Record<ActionItem['priority'], string> = {
  urgent: '緊急',
  high: '重要',
  normal: '通常',
}

type Period = ActionItem['period']

export function ActionPlan({ analysis }: Props) {
  const { actionItems } = analysis
  const periods: Period[] = ['today', 'week', 'month', 'half_year']

  const grouped = periods.reduce<Record<Period, ActionItem[]>>(
    (acc, p) => {
      acc[p] = actionItems.filter((a) => a.period === p)
      return acc
    },
    { today: [], week: [], month: [], half_year: [] }
  )

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-gray-800 border-b-2 border-green-500 pb-1 mb-4">
        Section 4 — アクションプラン
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {periods.map((period) => {
          const cfg = PERIOD_CONFIG[period]
          const items = grouped[period]

          return (
            <div key={period} className={`border-l-4 rounded-lg p-4 ${cfg.color}`}>
              <h3 className="font-bold text-gray-800 mb-3">
                {cfg.icon} {cfg.label}
              </h3>

              {items.length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  {period === 'today'
                    ? '判断基準設定後に自動生成されます'
                    : '課題が解消されたか、基準未設定です'}
                </p>
              ) : (
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-start gap-2">
                      <span className={`text-xs border rounded px-1.5 py-0.5 shrink-0 mt-0.5 ${PRIORITY_BADGE[item.priority]}`}>
                        {PRIORITY_LABEL[item.priority]}
                      </span>
                      <span className="text-sm text-gray-700">{item.action}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        ※ アクションプランは数値課題から自動逆算で生成されます。判断基準（Phase2）設定後により精度が上がります。
      </p>
    </section>
  )
}

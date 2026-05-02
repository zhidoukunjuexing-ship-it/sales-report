'use client'

import { AnalysisResult } from '@/lib/types'

type Props = {
  analysis: AnalysisResult
}

const TREND_CONFIG = {
  new: { icon: '🆕', label: '初出', color: 'text-blue-600' },
  improving: { icon: '📈', label: '改善中', color: 'text-green-600' },
  stagnant: { icon: '➡️', label: '停滞', color: 'text-yellow-600' },
  worsening: { icon: '📉', label: '悪化', color: 'text-red-600' },
}

export function ProgressTracker({ analysis }: Props) {
  const { progressRecords, issues } = analysis
  const repeating = progressRecords.filter((r) => r.isRepeating)

  const issueMap = Object.fromEntries(issues.map((i) => [i.id, i]))

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-gray-800 border-b-2 border-indigo-500 pb-1 mb-4">
        Section 5 — 進捗追跡
      </h2>

      {repeating.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm font-bold text-red-700 mb-1">⚠️ 繰り返し課題アラート</p>
          {repeating.map((r) => (
            <p key={r.issueId} className="text-sm text-red-600">
              「{issueMap[r.issueId]?.category ?? r.issueId}」が{r.dates.length}日連続で同じ課題として検出されています。
              根本的な改善アクションが実行されていない可能性があります。
            </p>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {progressRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-2xl mb-2">📊</p>
            <p className="text-sm">
              進捗追跡は複数日のデータが蓄積されると有効になります。
            </p>
          </div>
        ) : (
          progressRecords.map((record) => {
            const issue = issueMap[record.issueId]
            const trendCfg = TREND_CONFIG[record.trend]

            return (
              <div key={record.issueId} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-800 text-sm">
                    {issue?.category ?? record.issueId}
                  </span>
                  <div className="flex items-center gap-2">
                    {record.isRepeating && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        {record.dates.length}日継続
                      </span>
                    )}
                    <span className={`text-sm font-medium ${trendCfg.color}`}>
                      {trendCfg.icon} {trendCfg.label}
                    </span>
                  </div>
                </div>

                {record.dates.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {record.dates.map((d) => (
                      <span key={d} className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {d}
                      </span>
                    ))}
                  </div>
                )}

                {record.isRepeating && (
                  <p className="text-xs text-red-500 mt-1">
                    毎回同じ課題・同じ日報パターンが継続しています。思考の習慣化と具体的なアクションを見直してください。
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        ※ 進捗追跡は過去データとの比較で機能します（Phase3: Googleスプレッドシート連携後に完全動作）
      </p>
    </section>
  )
}

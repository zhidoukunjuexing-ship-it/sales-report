'use client'

import { AnalysisResult } from '@/lib/types'

type Props = {
  analysis: AnalysisResult
}

const SEVERITY_CONFIG = {
  critical: {
    icon: '🔴',
    label: '早急改善',
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-700',
  },
  warning: {
    icon: '🟡',
    label: '要注意',
    bg: 'bg-yellow-50 border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-700',
  },
  info: {
    icon: '🔵',
    label: '参考',
    bg: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
  },
}

export function AutoAnalysis({ analysis }: Props) {
  const { issues, summary } = analysis
  const critical = issues.filter((i) => i.severity === 'critical')
  const warnings = issues.filter((i) => i.severity === 'warning')
  const info = issues.filter((i) => i.severity === 'info')
  const grouped = [
    ...critical,
    ...warnings,
    ...info,
  ]

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-gray-800 border-b-2 border-orange-500 pb-1 mb-4">
        Section 2 — 自動分析
      </h2>

      {/* サマリー文 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-sm text-gray-700">
        {summary}
      </div>

      {grouped.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-sm">
            判断基準が未設定のため、詳細分析は Phase2 以降に表示されます。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map((issue) => {
            const cfg = SEVERITY_CONFIG[issue.severity]
            return (
              <div
                key={issue.id}
                className={`border rounded-lg p-4 ${cfg.bg}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg leading-none mt-0.5">{cfg.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      <span className="font-bold text-gray-800">{issue.category}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{issue.description}</p>
                    <p className="text-xs text-gray-500">{issue.detail}</p>
                    {issue.mentionedInReport !== null && (
                      <div className="mt-2">
                        {issue.mentionedInReport ? (
                          <span className="text-xs text-green-600">✅ 日報で言及あり</span>
                        ) : (
                          <span className="text-xs text-red-500">❌ 日報で未言及</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 転換率チェーン */}
      <div className="mt-6">
        <h3 className="text-sm font-bold text-gray-600 mb-2">転換率チェーン</h3>
        <div className="flex flex-wrap gap-1 items-center text-xs text-gray-600">
          {analysis.conversions.map((conv, i) => {
            const color =
              conv.status === 'critical' ? 'text-red-600 bg-red-50 border-red-200' :
              conv.status === 'warning' ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
              conv.status === 'good' ? 'text-green-600 bg-green-50 border-green-200' :
              'text-gray-400 bg-gray-50 border-gray-200'

            return (
              <span key={i} className="flex items-center gap-1">
                <span className={`border rounded px-2 py-0.5 font-medium ${color}`}>
                  {conv.rate}%
                </span>
                {i < analysis.conversions.length - 1 && (
                  <span className="text-gray-300">→</span>
                )}
              </span>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          ※ 基準値が設定されていない項目は「基準未設定」として表示されます（Phase2で設定）
        </p>
      </div>
    </section>
  )
}

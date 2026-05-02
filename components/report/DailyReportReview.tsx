'use client'

import { KpiData, AnalysisResult } from '@/lib/types'

type Props = {
  data: KpiData
  analysis: AnalysisResult
}

const DEPTH_CONFIG = {
  shallow: {
    label: '振り返りが浅い',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    bar: 'bg-red-400',
  },
  average: {
    label: '標準的',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50 border-yellow-200',
    bar: 'bg-yellow-400',
  },
  deep: {
    label: '深い振り返り',
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    bar: 'bg-green-500',
  },
}

export function DailyReportReview({ data, analysis }: Props) {
  const { thinkingDepth, issues, lossAnalysis } = analysis
  const cfg = DEPTH_CONFIG[thinkingDepth.label]
  const mentionedIssues = issues.filter((i) => i.mentionedInReport === true)
  const unmentiondIssues = issues.filter((i) => i.mentionedInReport === false)

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-gray-800 border-b-2 border-purple-500 pb-1 mb-4">
        Section 3 — 日報レビュー
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 日報本文 */}
        <div>
          <h3 className="text-sm font-bold text-gray-600 mb-2">日報（原文）</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap min-h-24">
            {data.dailyReport || (
              <span className="text-gray-400 italic">日報未入力</span>
            )}
          </div>
        </div>

        {/* 思考深度スコア */}
        <div>
          <h3 className="text-sm font-bold text-gray-600 mb-2">思考深度スコア</h3>
          <div className={`border rounded-lg p-4 ${cfg.bg}`}>
            <div className="flex items-baseline gap-2 mb-2">
              <span className={`text-3xl font-bold ${cfg.color}`}>
                {thinkingDepth.score}
              </span>
              <span className="text-gray-400 text-sm">/ 10</span>
              <span className={`text-sm font-bold ml-2 ${cfg.color}`}>
                {cfg.label}
              </span>
            </div>
            {/* スコアバー */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className={`h-2 rounded-full ${cfg.bar} transition-all`}
                style={{ width: `${thinkingDepth.score * 10}%` }}
              />
            </div>
            <p className="text-xs text-gray-600">{thinkingDepth.feedback}</p>
          </div>
        </div>
      </div>

      {/* 失注分析セクション */}
      {lossAnalysis.severity !== 'none' && (
        <div className={`mt-4 rounded-lg border p-4 ${
          lossAnalysis.severity === 'critical'
            ? 'bg-red-50 border-red-300'
            : 'bg-yellow-50 border-yellow-300'
        }`}>
          <h3 className={`text-sm font-bold mb-3 ${
            lossAnalysis.severity === 'critical' ? 'text-red-800' : 'text-yellow-800'
          }`}>
            失注分析 — 外的要因 / 内的要因
          </h3>
          {lossAnalysis.alert && (
            <p className="text-xs font-bold text-red-700 mb-3">{lossAnalysis.alert}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="space-y-2">
              <p className="font-semibold text-gray-700">外的要因（お客さんの事情）</p>
              <p className="text-xs text-gray-500">熱量・家庭環境・家の状況 — やむを得ない失注</p>
              <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded ${
                lossAnalysis.externalFactorMentioned
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {lossAnalysis.externalFactorMentioned ? '✅ 日報で言及あり' : '— 言及なし'}
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-700">内的要因（自分のトーク）</p>
              <p className="text-xs text-gray-500">トーク次第で取れたはず — 絶対に改善必須</p>
              <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded ${
                lossAnalysis.internalFactorAnalyzed
                  ? 'bg-green-100 text-green-700'
                  : lossAnalysis.internalFactorMentioned
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-600'
              }`}>
                {lossAnalysis.internalFactorAnalyzed
                  ? '✅ 言及あり + 深掘りあり'
                  : lossAnalysis.internalFactorMentioned
                  ? '⚠ 言及あり（なぜ取れなかったか深掘りを追記して）'
                  : '❌ 言及なし — 内的要因の分析を日報に追加してください'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 課題言及チェック */}
      {issues.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-bold text-gray-600 mb-2">課題への言及チェック</h3>
          <div className="space-y-2">
            {mentionedIssues.map((issue) => (
              <div key={issue.id} className="flex items-start gap-2 text-sm">
                <span className="text-green-500 mt-0.5">✅</span>
                <div>
                  <span className="font-medium text-gray-700">{issue.category}</span>
                  <span className="text-gray-500 ml-2">日報で言及あり</span>
                </div>
              </div>
            ))}
            {unmentiondIssues.map((issue) => (
              <div key={issue.id} className="flex items-start gap-2 text-sm">
                <span className="text-red-500 mt-0.5">❌</span>
                <div>
                  <span className="font-medium text-gray-700">{issue.category}</span>
                  <span className="text-red-500 ml-2">
                    日報で未言及 — 振り返りに追加が必要です
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

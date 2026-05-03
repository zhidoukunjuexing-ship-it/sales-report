'use client'

import { KpiData, AnalysisResult } from '@/lib/types'
import { KpiSummary } from './KpiSummary'
import { AutoAnalysis } from './AutoAnalysis'
import { DailyReportReview } from './DailyReportReview'
import { ActionPlan } from './ActionPlan'
import { ProgressTracker } from './ProgressTracker'
import { Top16Comparison } from './Top16Comparison'
import { FunnelChart } from './FunnelChart'
import { EfficiencyReport } from './EfficiencyReport'
import { SameMonthComparison } from './SameMonthComparison'

type Props = {
  data: KpiData
  analysis: AnalysisResult
}

export function ReportPreview({ data, analysis }: Props) {
  return (
    <div id="report-content" className="bg-white p-8 max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-8 pb-4 border-b-2 border-gray-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">営業活動分析レポート</h1>
            <p className="text-sm text-gray-500 mt-1">自動生成 — 判断ロジック: Phase1（基準値未設定）</p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p className="font-bold text-lg">{data.memberName}</p>
            <p>{data.date}</p>
          </div>
        </div>

        {/* 受注ステータス — 最優先チェック */}
        <div className={`mt-3 px-4 py-2 rounded-lg text-sm font-bold border ${
          analysis.winsStatus === 'good'
            ? 'bg-green-50 border-green-300 text-green-800'
            : analysis.winsStatus === 'critical'
            ? 'bg-red-50 border-red-400 text-red-900'
            : 'bg-yellow-50 border-yellow-300 text-yellow-800'
        }`}>
          {analysis.winsStatus === 'good' && `受注あり: ${data.orders}件獲得`}
          {analysis.winsStatus === 'critical' && '受注ゼロ（フルトーク以降到達済み）— 失注分析を必ず実施してください'}
          {analysis.winsStatus === 'warning' && '受注ゼロ — 引き続きフルトークまでの転換率を高めましょう'}
        </div>

        {/* 重要度サマリーバッジ */}
        <div className="flex gap-2 mt-3">
          {analysis.issues.filter((i) => i.severity === 'critical').length > 0 && (
            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-bold">
              即改善 {analysis.issues.filter((i) => i.severity === 'critical').length}件
            </span>
          )}
          {analysis.issues.filter((i) => i.severity === 'warning').length > 0 && (
            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-bold">
              要注意 {analysis.issues.filter((i) => i.severity === 'warning').length}件
            </span>
          )}
          <span className={`text-xs px-2 py-1 rounded-full font-bold ${
            analysis.thinkingDepth.label === 'deep'
              ? 'bg-green-100 text-green-700'
              : analysis.thinkingDepth.label === 'average'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          }`}>
            思考深度: {analysis.thinkingDepth.score}/10
          </span>
        </div>
      </div>

      <KpiSummary data={data} analysis={analysis} />
      <FunnelChart data={data} analysis={analysis} />
      <SameMonthComparison data={data} analysis={analysis} />
      <Top16Comparison data={data} analysis={analysis} />
      <EfficiencyReport data={data} analysis={analysis} />
      <AutoAnalysis analysis={analysis} />
      <DailyReportReview data={data} analysis={analysis} />
      <ActionPlan analysis={analysis} />
      <ProgressTracker analysis={analysis} />

      {/* フッター */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
        このレポートは営業KPIと日報を元に自動生成されました。
      </div>
    </div>
  )
}

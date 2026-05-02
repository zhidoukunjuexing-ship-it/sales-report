'use client'

import { useState } from 'react'
import { KpiData, KPI_LABELS, FUNNEL_STEPS } from '@/lib/types'
import { SAMPLE_KPI } from '@/lib/sample-data'

type Props = {
  onSubmit: (data: KpiData) => void
  loading: boolean
}

export function InputForm({ onSubmit, loading }: Props) {
  const [form, setForm] = useState<KpiData>(SAMPLE_KPI)

  const updateField = (key: keyof KpiData, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const updateKpi = (key: string, value: string) => {
    const num = parseInt(value, 10)
    setForm((prev) => ({ ...prev, [key]: isNaN(num) ? 0 : num }))
  }

  const updateTarget = (key: string, value: string) => {
    const num = parseInt(value, 10)
    setForm((prev) => ({
      ...prev,
      targets: { ...prev.targets, [key]: isNaN(num) ? undefined : num },
    }))
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(form)
      }}
      className="space-y-6"
    >
      {/* 基本情報 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-800 mb-4">基本情報</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">氏名</label>
            <input
              type="text"
              value={form.memberName}
              onChange={(e) => updateField('memberName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="山田 太郎"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">日付</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => updateField('date', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* KPI入力 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-800 mb-4">営業KPI数値</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 font-medium">項目</th>
                <th className="pb-2 font-medium text-center">実績</th>
                <th className="pb-2 font-medium text-center">目標（任意）</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {FUNNEL_STEPS.map((key) => (
                <tr key={key}>
                  <td className="py-2 text-gray-700 font-medium">{KPI_LABELS[key]}</td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      min={0}
                      value={(form[key] as number) ?? 0}
                      onChange={(e) => updateKpi(key, e.target.value)}
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      min={0}
                      value={(form.targets?.[key as keyof typeof form.targets] as number) ?? ''}
                      onChange={(e) => updateTarget(key, e.target.value)}
                      placeholder="—"
                      className="w-20 border border-gray-200 rounded px-2 py-1 text-center text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 日報 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-800 mb-4">日報</h2>
        <textarea
          value={form.dailyReport}
          onChange={(e) => updateField('dailyReport', e.target.value)}
          rows={6}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="今日の活動内容・振り返りを入力してください..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? '分析中...' : '🔍 分析レポートを生成'}
      </button>
    </form>
  )
}

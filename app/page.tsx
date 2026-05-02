'use client'

import { useState, useEffect, useCallback } from 'react'
import { InputForm } from '@/components/InputForm'
import { ReportPreview } from '@/components/report/ReportPreview'
import { PdfExportButton } from '@/components/PdfExportButton'
import { KpiData, AnalysisResult } from '@/lib/types'

type Entry = { date: string; memberName: string }

export default function Home() {
  const [report, setReport] = useState<{ data: KpiData; analysis: AnalysisResult } | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(true)

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/entries')
      if (!res.ok) return
      const data: KpiData[] = await res.json()
      setEntries(data.map((d) => ({ date: d.date, memberName: d.memberName })))
    } catch {
      // サイレントフェイル
    } finally {
      setLoadingEntries(false)
    }
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const handleSubmit = async (data: KpiData) => {
    setLoading(true)
    setError(null)
    try {
      // 分析
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ today: data, history: [] }),
      })
      if (!res.ok) throw new Error('分析に失敗しました')
      const analysis: AnalysisResult = await res.json()
      setReport({ data, analysis })

      // Supabaseに保存
      setSaving(true)
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      fetchEntries()

      setTimeout(() => {
        document.getElementById('report-content')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラー')
    } finally {
      setLoading(false)
      setSaving(false)
    }
  }

  const handleLoadEntry = async (entry: Entry) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/entries')
      if (!res.ok) throw new Error('データ取得に失敗しました')
      const all: KpiData[] = await res.json()
      const data = all.find((d) => d.date === entry.date && d.memberName === entry.memberName)
      if (!data) throw new Error('データが見つかりません')

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ today: data, history: [] }),
      })
      if (!analyzeRes.ok) throw new Error('分析に失敗しました')
      const analysis: AnalysisResult = await analyzeRes.json()
      setReport({ data, analysis })

      setTimeout(() => {
        document.getElementById('report-content')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラー')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">営業分析レポート</h1>
            <p className="text-xs text-gray-400 mt-0.5">Sales Activity Report Generator</p>
          </div>
          {report && <PdfExportButton />}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {!report ? (
          <div className="space-y-6">
            {/* 過去データ一覧 */}
            {!loadingEntries && entries.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
                  保存済みデータ
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {entries.map((e) => (
                    <button
                      key={`${e.date}_${e.memberName}`}
                      onClick={() => handleLoadEntry(e)}
                      className="text-left px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      <p className="text-xs text-gray-400">{e.date}</p>
                      <p className="text-sm font-bold text-gray-800">{e.memberName}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-700">新規入力</h2>
                <p className="text-sm text-gray-400 mt-1">
                  送信すると自動でSupabaseに保存されます。
                </p>
              </div>
              <InputForm onSubmit={handleSubmit} loading={loading} />
              {saving && (
                <p className="mt-2 text-xs text-blue-500">Supabaseに保存中...</p>
              )}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6 print:hidden">
              <button
                onClick={() => setReport(null)}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                ← 一覧に戻る
              </button>
              <PdfExportButton />
            </div>
            <ReportPreview data={report.data} analysis={report.analysis} />
          </div>
        )}
      </main>
    </div>
  )
}

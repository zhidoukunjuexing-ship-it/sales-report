import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement, type JSXElementConstructor } from 'react'
import { Resend } from 'resend'
import { supabase, rowToKpiData, KpiEntryRow } from '@/lib/supabase'
import { analyzeKpi } from '@/lib/analyzer'
import { groupByManager } from '@/lib/org-chart'
import { ReportPdf } from '@/lib/pdf/ReportPdf'
import { KpiData, AnalysisResult } from '@/lib/types'

// Vercel Cron は Authorization: Bearer <CRON_SECRET> を送ってくる
function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return true // 開発環境ではスキップ
  return auth === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    // 直近7日分のデータを取得
    const since = new Date()
    since.setDate(since.getDate() - 7)
    const sinceStr = since.toISOString().split('T')[0]

    const { data: rows, error } = await supabase
      .from('kpi_entries')
      .select('*')
      .gte('date', sinceStr)
      .order('date', { ascending: false })

    if (error) throw new Error(`Supabase error: ${error.message}`)
    if (!rows || rows.length === 0) {
      return NextResponse.json({ message: '対象データなし' })
    }

    const entries = (rows as KpiEntryRow[]).map(rowToKpiData)

    // メンバーごとに最新1件を取得
    const latestByMember = new Map<string, KpiData>()
    for (const entry of entries) {
      if (!latestByMember.has(entry.memberName)) {
        latestByMember.set(entry.memberName, entry)
      }
    }

    // 各メンバーの分析 + PDF生成
    const results: { memberName: string; pdf: Buffer; analysis: AnalysisResult; data: KpiData }[] = []

    for (const [memberName, data] of latestByMember) {
      const history = entries.filter(
        (e) => e.memberName === memberName && e.date !== data.date
      )
      const analysis = analyzeKpi(data, history)
      const pdfBuffer = await renderToBuffer(
        createElement(ReportPdf, { data, analysis }) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>
      )
      results.push({ memberName, pdf: pdfBuffer, analysis, data })
    }

    // 責任者ごとにグループ化してメール送信
    const memberNames = results.map((r) => r.memberName)
    const byManager = groupByManager(memberNames)

    const emailsSent: string[] = []

    for (const [manager, members] of byManager) {
      const managerResults = results.filter((r) => members.includes(r.memberName))

      // メール本文を生成
      const memberSummaries = managerResults.map((r) => {
        const criticals = r.analysis.issues.filter((i) => i.severity === 'critical')
        const todayActions = r.analysis.actionItems.filter((a) => a.period === 'today')
        return `
【${r.memberName}】${r.data.date}
受注: ${r.data.orders}件 | 訪問: ${r.data.visits}件
${criticals.length > 0 ? `⚠ 要改善: ${criticals.map((i) => i.category).join('、')}` : '✓ 大きな課題なし'}
今日のアクション: ${todayActions[0]?.action ?? 'なし'}
        `.trim()
      }).join('\n\n')

      const emailBody = `
${manager.name} 様

担当メンバーの週次分析レポートが完成しました。
本日中にご確認いただき、各メンバーへのフィードバック・指導をお願いします。

━━━━━━━━━━━━━━━━━━━━━━━━
■ メンバー別サマリー
━━━━━━━━━━━━━━━━━━━━━━━━

${memberSummaries}

━━━━━━━━━━━━━━━━━━━━━━━━

各メンバーの詳細レポートをPDFで添付しています。

Kaika Sales Report System
      `.trim()

      // PDF添付でメール送信
      const attachments = managerResults.map((r) => ({
        filename: `${r.memberName}_${r.data.date}_レポート.pdf`,
        content: r.pdf.toString('base64'),
      }))

      await resend.emails.send({
        from: 'Kaika Report <report@kaika-sales.com>',
        to: manager.email,
        subject: `【週次レポート完成】担当メンバー${members.length}名分`,
        text: emailBody,
        attachments,
      })

      emailsSent.push(manager.email)
    }

    return NextResponse.json({
      ok: true,
      membersProcessed: results.length,
      emailsSent,
    })
  } catch (err) {
    console.error('[cron/weekly-report]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

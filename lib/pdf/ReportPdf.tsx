import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import { KpiData, AnalysisResult, KPI_LABELS, FUNNEL_STEPS } from '../types'

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica', color: '#1f2937' },
  header: { marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid #1f2937' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 9, color: '#6b7280' },
  memberRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  memberName: { fontSize: 13, fontWeight: 'bold' },
  date: { fontSize: 10, color: '#6b7280' },

  // ステータスバナー
  bannerGood: { backgroundColor: '#d1fae5', padding: 6, borderRadius: 4, marginBottom: 12 },
  bannerCritical: { backgroundColor: '#fee2e2', padding: 6, borderRadius: 4, marginBottom: 12 },
  bannerWarning: { backgroundColor: '#fef3c7', padding: 6, borderRadius: 4, marginBottom: 12 },
  bannerText: { fontWeight: 'bold', fontSize: 10 },

  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', borderBottom: '1px solid #e5e7eb', paddingBottom: 3, marginBottom: 6 },

  // KPI テーブル
  table: { borderTop: '1px solid #e5e7eb' },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #e5e7eb', paddingVertical: 3 },
  tableHeader: { backgroundColor: '#f3f4f6' },
  col1: { width: '40%' },
  col2: { width: '20%', textAlign: 'right' },
  col3: { width: '20%', textAlign: 'right' },
  col4: { width: '20%', textAlign: 'right' },

  // 課題カード
  issueCritical: { backgroundColor: '#fee2e2', padding: 6, marginBottom: 4, borderRadius: 3, borderLeft: '3px solid #ef4444' },
  issueWarning: { backgroundColor: '#fef9c3', padding: 6, marginBottom: 4, borderRadius: 3, borderLeft: '3px solid #eab308' },
  issueTitle: { fontWeight: 'bold', marginBottom: 2 },
  issueDetail: { fontSize: 9, color: '#4b5563' },

  // アクションプラン
  actionItem: { flexDirection: 'row', marginBottom: 3 },
  actionBullet: { width: 12 },
  actionText: { flex: 1, fontSize: 9 },
  urgentLabel: { color: '#dc2626', fontWeight: 'bold' },

  // 日報
  reportBox: { backgroundColor: '#f9fafb', padding: 6, borderRadius: 3, fontSize: 9, color: '#374151' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  scoreLabel: { fontWeight: 'bold', marginRight: 4 },
  scoreValue: { fontSize: 13, fontWeight: 'bold' },

  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, textAlign: 'center', fontSize: 8, color: '#9ca3af' },
})

type Props = {
  data: KpiData
  analysis: AnalysisResult
}

export function ReportPdf({ data, analysis }: Props) {
  const criticalIssues = analysis.issues.filter((i) => i.severity === 'critical')
  const warningIssues = analysis.issues.filter((i) => i.severity === 'warning')
  const todayActions = analysis.actionItems.filter((a) => a.period === 'today')
  const weekActions = analysis.actionItems.filter((a) => a.period === 'week')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>営業活動分析レポート</Text>
          <View style={styles.memberRow}>
            <Text style={styles.memberName}>{data.memberName}</Text>
            <Text style={styles.date}>{data.date}</Text>
          </View>
          <Text style={styles.subtitle}>自動生成レポート — Kaika Sales Report System</Text>
        </View>

        {/* 受注ステータスバナー */}
        <View style={
          analysis.winsStatus === 'good' ? styles.bannerGood :
          analysis.winsStatus === 'critical' ? styles.bannerCritical :
          styles.bannerWarning
        }>
          <Text style={styles.bannerText}>
            {analysis.winsStatus === 'good' && `受注あり: ${data.orders}件獲得`}
            {analysis.winsStatus === 'critical' && '【最重要】フルトーク以降到達済みで受注ゼロ — 失注分析を即実施してください'}
            {analysis.winsStatus === 'warning' && '受注ゼロ — フルトークまでの転換率向上に注力してください'}
          </Text>
        </View>

        {/* KPI数値 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KPI実績</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.col1}>指標</Text>
              <Text style={styles.col2}>実績</Text>
              <Text style={styles.col3}>転換率</Text>
              <Text style={styles.col4}>基準値</Text>
            </View>
            {FUNNEL_STEPS.map((step, i) => {
              const conv = analysis.conversions.find((c) => c.to === step)
              return (
                <View key={step} style={styles.tableRow}>
                  <Text style={styles.col1}>{KPI_LABELS[step]}</Text>
                  <Text style={styles.col2}>{(data[step] as number).toLocaleString()}</Text>
                  <Text style={styles.col3}>
                    {conv ? `${conv.rate}%` : '—'}
                  </Text>
                  <Text style={styles.col4}>
                    {conv && conv.benchmark > 0 ? `${conv.benchmark}%` : '—'}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* 課題 */}
        {(criticalIssues.length > 0 || warningIssues.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>検出された課題</Text>
            {criticalIssues.map((issue) => (
              <View key={issue.id} style={styles.issueCritical}>
                <Text style={styles.issueTitle}>🔴 {issue.category}</Text>
                <Text style={styles.issueDetail}>{issue.description}</Text>
              </View>
            ))}
            {warningIssues.map((issue) => (
              <View key={issue.id} style={styles.issueWarning}>
                <Text style={styles.issueTitle}>🟡 {issue.category}</Text>
                <Text style={styles.issueDetail}>{issue.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* アクションプラン */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アクションプラン</Text>
          {todayActions.length > 0 && (
            <>
              <Text style={[styles.issueTitle, { marginBottom: 3 }]}>今日やること</Text>
              {todayActions.map((a) => (
                <View key={a.id} style={styles.actionItem}>
                  <Text style={[styles.actionBullet, styles.urgentLabel]}>▶</Text>
                  <Text style={styles.actionText}>{a.action}</Text>
                </View>
              ))}
            </>
          )}
          {weekActions.length > 0 && (
            <>
              <Text style={[styles.issueTitle, { marginTop: 6, marginBottom: 3 }]}>今週やること</Text>
              {weekActions.map((a) => (
                <View key={a.id} style={styles.actionItem}>
                  <Text style={styles.actionBullet}>・</Text>
                  <Text style={styles.actionText}>{a.action}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* 日報・思考深度 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>日報レビュー</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>思考深度スコア:</Text>
            <Text style={styles.scoreValue}>{analysis.thinkingDepth.score}</Text>
            <Text style={{ marginLeft: 4, color: '#6b7280' }}>/10 — {analysis.thinkingDepth.feedback}</Text>
          </View>
          <Text style={[styles.issueDetail, { marginBottom: 4 }]}>日報原文:</Text>
          <View style={styles.reportBox}>
            <Text>{data.dailyReport || '（日報未入力）'}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Kaika Sales Report System — 自動生成 {new Date().toLocaleDateString('ja-JP')}
        </Text>
      </Page>
    </Document>
  )
}

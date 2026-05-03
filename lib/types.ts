// =========================================================
// 実データのファネル定義（スプレッドシートの実績値に合わせた4ステップ）
// 将来的に紙プレ・フルトーク等のステップを追加予定
//
// PDF実績から導出したベンチマーク（トッププレイヤー16名平均）:
//   訪問→ネット対面: 4.1%
//   ネット対面→主権対面: 60%
//   主権対面→商談: 62%
//   商談→獲得: 30%
// =========================================================

export type KpiData = {
  date: string
  memberName: string
  // 営業ファネル（実データの4+αステップ）
  visits: number        // 訪問数
  interphones: number   // インターホン数（ネット対面）
  facings: number       // 対面数（主権対面 ≒ ドアを開けてもらった数）
  presentations: number // 紙プレ数（将来追加）
  fullTalks: number     // フルトーク数（将来追加）
  inHomes: number       // 宅内数（主権対面の一部 or 商談前段階）
  negotiations: number  // 商談数
  prospects: number     // 見込み数（将来追加）
  orders: number        // 受注数（獲得）
  // 目標値（任意）
  targets?: Partial<Omit<KpiData, 'date' | 'memberName' | 'targets' | 'dailyReport'>>
  dailyReport: string   // 日報テキスト
}

export type ConversionRate = {
  from: KpiLabel
  to: KpiLabel
  rate: number          // %
  benchmark: number     // 基準値%（Phase2で設定）
  status: 'good' | 'warning' | 'critical' | 'pending'
}

export type Issue = {
  id: string
  severity: 'critical' | 'warning' | 'info'
  category: string      // 例: "インターホントーク"
  description: string   // 例: "インターホン→対面の転換率が低い"
  detail: string        // 根拠の説明
  mentionedInReport: boolean | null  // 日報で言及しているか
}

export type ActionItem = {
  id: string
  period: 'today' | 'week' | 'month' | 'half_year'
  priority: 'urgent' | 'high' | 'normal'
  action: string
  relatedIssueId?: string
}

export type ProgressRecord = {
  issueId: string
  dates: string[]       // 同課題が出た日付リスト
  isRepeating: boolean  // 3回以上同じ課題が出ているか
  trend: 'improving' | 'worsening' | 'stagnant' | 'new'
}

export type ReportThinkingDepth = {
  score: number         // 0-10
  label: 'shallow' | 'average' | 'deep'
  feedback: string      // 例: "課題に対する原因分析が不足しています"
}

export type SalesEfficiency = {
  visitsPerWin: number          // 訪問/獲得（低いほど良い）
  efficiencyScore: number       // 1〜10スコア（TOP16比較）
  salesStyle: 'volume' | 'precision' | 'balanced' | 'developing'
  // volume: 訪問量で稼ぐタイプ（訪問>3000, 獲得率<15%）
  // precision: 精度で稼ぐタイプ（獲得率>35%）
  // balanced: 両立タイプ（ハイパフォーマー水準）
  // developing: まだ水準に達していないタイプ
  styleLabel: string            // 表示用ラベル
  nextGoal: string              // 次の改善ポイント
}

// 失注分析（宅内・フルトーク以降で受注できなかったケースの要因分析）
export type LossAnalysis = {
  estimatedInHomeLosses: number    // 宅内に入って受注できなかった件数（inHomes - orders）
  hasInHomeLosses: boolean         // 宅内失注あり（inHomes > 0 && orders === 0）
  externalFactorMentioned: boolean // 外的要因（お客さんの事情）を日報で言及しているか
  internalFactorMentioned: boolean // 内的要因（自分のトーク次第）を日報で言及しているか
  internalFactorAnalyzed: boolean  // 内的要因の深掘り（なぜ・改善策）があるか
  alert: string | null
  severity: 'critical' | 'warning' | 'none'
}

export type AnalysisResult = {
  conversions: ConversionRate[]
  issues: Issue[]
  actionItems: ActionItem[]
  progressRecords: ProgressRecord[]
  thinkingDepth: ReportThinkingDepth
  lossAnalysis: LossAnalysis
  winsStatus: 'good' | 'warning' | 'critical'
  summary: string
  efficiency: SalesEfficiency
}

export type KpiLabel = keyof Omit<KpiData, 'date' | 'memberName' | 'targets' | 'dailyReport'>

export const KPI_LABELS: Record<KpiLabel, string> = {
  visits: '訪問数',
  interphones: 'インターホン数',
  facings: '対面数',
  presentations: '紙プレ数',
  fullTalks: 'フルトーク数',
  inHomes: '宅内数',
  negotiations: '商談数',
  prospects: '見込み数',
  orders: '受注数',
}

// ファネルの順番（転換率計算に使う）
export const FUNNEL_STEPS: KpiLabel[] = [
  'visits',
  'interphones',
  'facings',
  'presentations',
  'fullTalks',
  'inHomes',
  'negotiations',
  'prospects',
  'orders',
]

// 各ステップ間の問題カテゴリ名
export const FUNNEL_ISSUE_CATEGORY: Partial<Record<KpiLabel, string>> = {
  interphones: 'ピンポン数（行動量）',
  facings: 'インターホントーク',
  presentations: '対面トーク（紙プレへの誘導）',
  fullTalks: '紙プレの質・精度',
  inHomes: 'フルトークから宅内への誘導',
  negotiations: '宅内トーク（商談設定）',
  prospects: '商談の質（見込み化）',
  orders: 'クロージングの精度',
}

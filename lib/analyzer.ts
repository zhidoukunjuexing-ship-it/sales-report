import {
  KpiData,
  AnalysisResult,
  ConversionRate,
  Issue,
  ActionItem,
  ProgressRecord,
  ReportThinkingDepth,
  LossAnalysis,
  SalesEfficiency,
  FUNNEL_STEPS,
  FUNNEL_ISSUE_CATEGORY,
  KPI_LABELS,
  KpiLabel,
} from './types'

// =========================================================
// ベンチマーク基準値
// 実績PDFデータ（2025.06〜2026.03）よりトッププレイヤー16名の
// 転換率平均を算出し設定。
//
// トッププレイヤー定義メンバー:
//   二川, 中森, 辻岡, 水川, 岩永, 奥田, 福島, 中尾, 和田, 梶原,
//   谷本, サプコタ, 鮫島, 松本, 三浦, 小谷
//
// ベンチマーク計算方法:
//   各ステップの転換率 = 先ステップ数値/元ステップ数値 の平均（中央値）
// =========================================================

// 各KPIの「前ステップに対する比率（%）」基準値
// good: benchmark × 110% 以上
// warning: benchmark × 80% 以上 (good未満)
// critical: benchmark × 80% 未満
// 実績PDFデータ（月10件以上エントリ7件）より再算出
// TOP16集計: 訪問40,312件, ネット対面1,521件, 主権対面818件, 商談407件, 獲得122件
const BENCHMARKS: Partial<Record<KpiLabel, number>> = {
  // 訪問 → インターホン対面（ネット対面）: ハイパフォーマー平均 4%
  interphones: 4,

  // インターホン → 対面（主権対面）: ハイパフォーマー 55.4%
  facings: 55,

  // 対面 → 紙プレ（データなし・将来設定）
  presentations: 0,

  // 紙プレ → フルトーク（データなし・将来設定）
  fullTalks: 0,

  // フルトーク/対面 → 宅内（将来設定）
  inHomes: 0,

  // 主権対面 → 商談: ハイパフォーマー 62.0%
  negotiations: 62,

  // 商談 → 見込み（データなし・将来設定）
  prospects: 0,

  // 商談/見込み → 受注（獲得）: ハイパフォーマー 31.1%
  orders: 31,
}

// =========================================================
// トッププレイヤー比較データ（参考表示用）
// =========================================================
// ハイパフォーマー集計（月10件以上エントリ, n=39）
export const TOP_PLAYER_BENCHMARKS = {
  // 1件獲得するために必要な訪問数（ハイパフォーマー平均）
  visitsPerWin: 243,
  // 1件獲得するために必要な対面（主権対面）数: 3484/672 ≈ 5.2
  facingsPerWin: 5,
  // 1件獲得するために必要な商談数: 2160/672 ≈ 3.2
  negotiationsPerWin: 3,
  // トップ月間平均獲得数
  avgMonthlyWins: 17,
  // トップ月間平均訪問数: 163583/39
  avgMonthlyVisits: 4200,
}

// =========================================================
// 各ステップ間の「問題ロジック」定義（芋づる方式）
//
// 【重要な定義】
// ① 訪問数が少ない → 本人の力量不足 or 稼働時間が短い
// ② インターホン数（有効接点）が少ない
//    → ピンポンはしているが相手が出てこない
//    → 人がいない時間帯・エリアに当たっている（留守・手が離せない）
// ③ 対面数が少ない
//    → インターホン越しのトークが悪く、玄関前まで誘導できていない
// ④ 紙プレ数が少ない
//    → 対面してからのトークの質に問題がある
// ⑤ フルトーク数が少ない
//    → 紙プレ自体の質が問題（興味を持たせられていない）
// ⑥ 宅内に至らない
//    → フルトークの内容・質に問題がある
// ⑦ 見込みはできるが受注できない
//    → 落とし込みトークが甘い・最後の一押しができていない
// ⑧ 商談はしているが見込みにもならない
//    → クロージングトークが最悪。最優先で改善が必要
// =========================================================
const ISSUE_LOGIC: Partial<Record<KpiLabel, {
  category: string
  detail: (rate: number, benchmark: number) => string
  todayAction: string
  weekAction: string
  monthAction: string
  urgency: 'immediate' | 'high' | 'normal'
}>> = {
  interphones: {
    category: 'エリア・時間帯の選定',
    urgency: 'high',
    detail: (r, b) => `訪問数に対してインターホンに応答してもらえた割合が${r.toFixed(1)}%（基準${b}%）です。ピンポンはしているが相手が出てきていない状態と考えられます。人がいない時間帯や留守の多いエリアを回っている可能性が高いです。訪問する時間帯・エリアの見直しが必要です。`,
    todayAction: '今日の訪問で「留守」「応答なし」「手が離せない」の件数を記録し、時間帯別の応答パターンを把握する。',
    weekAction: '時間帯別・エリア別のインターホン応答率を記録・分析し、応答が多い条件を特定する。人がいる時間帯（夕方・休日・昼）を意識してシフトを組む。',
    monthAction: '高応答率エリア・時間帯での行動比率を高め、インターホン率を基準の4%以上に引き上げることを月次目標とする。',
  },
  facings: {
    category: 'インターホン越しのトーク',
    urgency: 'immediate',
    detail: (r, b) => `インターホンに出てくれた件数に対して、実際に玄関前まで出てきてもらえた割合が${r.toFixed(1)}%（基準${b}%）です。インターホン越しの会話で断られているケースが多い状態です。玄関先まで誘導するトーク・一言が機能していません。早急に改善が必要です。`,
    todayAction: '【最優先ロープレ】インターホン越しのトーク（最初の一言・誘導フレーズ）をリーダーと確認・練習する。「断られるパターン」を書き出して持っていく。',
    weekAction: 'インターホンで断られた際の相手の反応・言葉をメモし、断られパターン別の切り返しトークを週内に整備する。',
    monthAction: '対面率を基準54%以上に引き上げることを月次KPIとし、インターホントークの精度を毎週見直す。',
  },
  presentations: {
    category: '対面後のアプローチトーク',
    urgency: 'high',
    detail: (r, b) => `対面できた件数に対して紙プレ（商談らしい話）に進めた割合が${r.toFixed(1)}%（基準${b}%）です。対面はできているのに商談の入り口に進めていない状態です。対面してからの第一声・アプローチの質に問題があります。`,
    todayAction: '対面から紙プレへの流れ（第一声〜資料提示まで）をリーダーと確認し、本日の稼働前にロープレする。',
    weekAction: '対面→紙プレに繋げられなかったケースの理由を毎日日報に記録し、改善パターンを見つける。',
    monthAction: '対面→紙プレ転換率の向上を重点課題とし、アプローチトークを週次で改善する。',
  },
  fullTalks: {
    category: '紙プレ（資料説明）の質',
    urgency: 'high',
    detail: (r, b) => `紙プレをした件数に対してフルトーク（商談の最後まで完結）できた割合が${r.toFixed(1)}%（基準${b}%）です。紙プレはしているがお客様の興味を引けておらず、途中で止まってしまっている状態です。紙プレ自体の内容・伝え方を分析・改善する必要があります。`,
    todayAction: '紙プレのどの部分でお客様の反応が薄くなるか意識して稼働し、ポイントを日報に記録する。帰宅後リーダーにフィードバックを求める。',
    weekAction: '紙プレで「興味を持ってもらえたポイント」「反応が薄かったポイント」を毎日記録し、資料の見せ方・説明順を改善する。',
    monthAction: '紙プレの質を根本から見直し、フルトーク率を基準値以上に引き上げることを月次目標とする。',
  },
  inHomes: {
    category: 'フルトークの質・宅内誘導',
    urgency: 'immediate',
    detail: (r, b) => `フルトーク数に対して宅内（本格商談・詳細説明の場）に進めた割合が${r.toFixed(1)}%（基準${b}%）です。フルトークまでできているのに「中でゆっくり話しましょう」への誘導ができていない状態です。フルトークの内容・質のブラッシュアップが必要です。`,
    todayAction: '宅内誘導のフレーズ（「5分だけ中で」等）をリーダーと確認し、フルトーク後の誘導タイミングを意識して稼働する。',
    weekAction: '宅内に入れた件・入れなかった件の違いを毎日記録し、誘導成功/失敗のパターンを分析する。',
    monthAction: 'フルトークの質とその後の宅内誘導率を改善し、転換率を基準値以上に引き上げることを月次目標とする。',
  },
  negotiations: {
    category: '宅内トーク（商談設定）',
    urgency: 'immediate',
    detail: (r, b) => `宅内・対面数に対して商談（具体的な提案・検討）に進めた割合が${r.toFixed(1)}%（基準${b}%）です。対面・宅内まで進めているのに商談設定ができていない状態です。宅内でのトーク構成・ニーズ引き出しに問題があります。`,
    todayAction: '宅内でのトーク構成（ヒアリング〜提案の流れ）をリーダーと確認する。「商談に進めなかったパターン」を書き出す。',
    weekAction: '商談設定できた/できなかった件の違いを毎日記録し、成功パターンを積み上げる。',
    monthAction: '商談率を基準50%以上に引き上げることを今月のKPIとし、宅内トークを週次で見直す。',
  },
  prospects: {
    category: 'クロージングトーク【最優先改善】',
    urgency: 'immediate',
    detail: (r, b) => `商談件数に対して見込み（購入意向あり）になった割合が${r.toFixed(1)}%（基準${b}%）です。商談はしているが見込みにすら至っていない状態は、クロージングトークの質が最大の問題です。ただの失注が続いている可能性があります。これは最優先で改善すべき課題です。`,
    todayAction: '【緊急】クロージングトーク全体をリーダーに見てもらう or ロープレで確認する。「何が決定打になるか」を徹底的に議論する。',
    weekAction: '商談で失注した理由を毎回詳細に記録し、「なぜ見込みにならなかったか」を深掘りして日報に書く。クロージングを変えながら試行する。',
    monthAction: 'クロージングトークを根本から作り直し、見込み化率を大幅に改善することを今月の最重点課題とする。',
  },
  orders: {
    category: '落とし込みトーク（最後の一押し）',
    urgency: 'immediate',
    detail: (r, b) => `見込み件数に対して受注できた割合が${r.toFixed(1)}%（基準${b}%）です。見込みはできているのに受注に繋がっていない状態です。「前向きだけど決まらない」という状況が多い場合、落とし込みトークが甘く、最後の一押しができていないことが原因です。判断を相手に委ねすぎている可能性があります。`,
    todayAction: '見込み客への再訪・フォロー計画を立てる。「決め手になる一言」「背中を押すフレーズ」をリーダーに確認する。',
    weekAction: '見込みがあるのに受注できていないケースの理由を毎回記録し、「なぜ決まらなかったか」を分析して落とし込みトークを改善する。',
    monthAction: '見込み→受注の転換率を基準30%以上に引き上げることを目標とし、落とし込みトークと再訪フォローの精度を高める。',
  },
}

// =========================================================
// 営業効率スコア計算
// =========================================================
function calcEfficiency(data: KpiData, conversions: ConversionRate[]): SalesEfficiency {
  const visitsPerWin = data.orders > 0 ? Math.round(data.visits / data.orders) : 9999

  // 効率スコア: TOP16基準(243件)と比較。243件=10点、1168件=1点
  const efficiencyScore = Math.max(1, Math.min(10, Math.round(10 - (visitsPerWin - 243) / 100)))

  // 営業スタイル判定
  const winRate = conversions.find(c => c.to === 'orders')?.rate ?? 0
  const negoRate = conversions.find(c => c.to === 'negotiations')?.rate ?? 0

  let salesStyle: SalesEfficiency['salesStyle']
  let styleLabel: string
  let nextGoal: string

  if (winRate >= 35 && negoRate >= 55) {
    salesStyle = 'precision'
    styleLabel = '精度型（クロージング特化）'
    nextGoal = '訪問量を増やせばさらに件数が跳ねます。現在の獲得率を維持しながら訪問数3,000件/月を目指してください。'
  } else if (data.visits >= 3000 && winRate >= 25 && negoRate >= 55) {
    salesStyle = 'balanced'
    styleLabel = 'バランス型（TOP16水準）'
    nextGoal = '訪問量・精度ともに高水準です。商談率・獲得率をさらに高め、訪問数を減らしながら獲得数を維持する「精度型」への進化を目指してください。'
  } else if (data.visits >= 3000 && winRate < 20) {
    salesStyle = 'volume'
    styleLabel = '行動量型（訪問量でカバー）'
    nextGoal = '訪問量は十分ですが、商談率・獲得率が低く効率が悪い状態です。同じ訪問量でも対面率55%・獲得率31%を目標にすると獲得数が1.5〜2倍になります。クロージングトークの改善を最優先にしてください。'
  } else {
    salesStyle = 'developing'
    styleLabel = '成長中（基準以下）'
    nextGoal = '訪問量と精度の両方が基準に達していません。まずは訪問量を2,000件/月に増やしながら、対面率55%・商談率62%を目標にしてください。'
  }

  return { visitsPerWin, efficiencyScore, salesStyle, styleLabel, nextGoal }
}

// =========================================================
// 失注分析（フルトーク以降で受注できなかったケースの外的/内的要因判定）
// =========================================================
function analyzeLosses(data: KpiData): LossAnalysis {
  const { inHomes, fullTalks, orders, dailyReport: report } = data
  const estimatedInHomeLosses = Math.max(0, inHomes - orders)
  const hasInHomeLosses = inHomes > 0 && orders === 0

  const externalKeywords = ['外的', '熱量', '家庭環境', '家の状況', '無理', 'やむを得', '仕方', '事情', '都合', 'タイミング']
  const internalKeywords = ['内的', '自分のトーク', 'トーク次第', '自分次第', '改善できた', '取れた', '反省', '原因は自分', '自分の力', '自分の問題']
  const deepAnalysisKeywords = ['なぜ', 'どこで', 'どの部分', '改善策', '次回は', 'トークを変え', 'ロープレ', '練習']

  const externalFactorMentioned = externalKeywords.some(k => report.includes(k))
  const internalFactorMentioned = internalKeywords.some(k => report.includes(k))
  const internalFactorAnalyzed = internalFactorMentioned && deepAnalysisKeywords.some(k => report.includes(k))

  let severity: LossAnalysis['severity'] = 'none'
  let alert: string | null = null

  if (hasInHomeLosses) {
    severity = 'critical'
    alert = `宅内${inHomes}件入って受注ゼロ。各失注が外的要因か内的要因かを必ず分析してください。内的要因が1件でもある場合は即日改善が必須です。`
  } else if (estimatedInHomeLosses > 0) {
    severity = 'warning'
    alert = `宅内${inHomes}件中${estimatedInHomeLosses}件が失注。失注理由を外的/内的要因で分析し、内的要因は改善策を立ててください。`
  } else if (fullTalks > 0 && inHomes === 0 && orders === 0) {
    severity = 'critical'
    alert = `フルトーク${fullTalks}件で宅内・受注ゼロ。フルトーク→宅内への誘導を即改善してください。`
  }

  return {
    estimatedInHomeLosses,
    hasInHomeLosses,
    externalFactorMentioned,
    internalFactorMentioned,
    internalFactorAnalyzed,
    alert,
    severity,
  }
}

function calcWinsStatus(data: KpiData): AnalysisResult['winsStatus'] {
  if (data.orders > 0) return 'good'
  // 受注ゼロは常に warning 以上
  // フルトーク以降に到達しているのに受注ゼロ = critical
  if (data.inHomes > 0 || data.fullTalks > 0) return 'critical'
  return 'warning'
}

export function analyzeKpi(
  today: KpiData,
  history: KpiData[] = []
): AnalysisResult {
  const conversions = calcConversions(today)
  const issues = detectIssues(conversions, today)
  const lossAnalysis = analyzeLosses(today)
  const winsStatus = calcWinsStatus(today)
  const thinkingDepth = evaluateThinkingDepth(today.dailyReport, issues, lossAnalysis)
  const actionItems = generateActionItems(issues)
  const progressRecords = trackProgress(issues, history)
  const efficiency = calcEfficiency(today, conversions)
  const monthsActive = history.length + 1

  return {
    conversions,
    issues,
    actionItems,
    progressRecords,
    thinkingDepth,
    lossAnalysis,
    winsStatus,
    summary: buildSummary(issues, thinkingDepth, winsStatus),
    efficiency,
    monthsActive,
  }
}

function calcConversions(data: KpiData): ConversionRate[] {
  const results: ConversionRate[] = []

  for (let i = 1; i < FUNNEL_STEPS.length; i++) {
    const fromKey = FUNNEL_STEPS[i - 1]
    const toKey = FUNNEL_STEPS[i]
    const fromVal = data[fromKey] as number
    const toVal = data[toKey] as number
    const rate = fromVal > 0 ? Math.round((toVal / fromVal) * 1000) / 10 : 0
    const benchmark = BENCHMARKS[toKey] ?? 0 // Phase2で埋まる

    results.push({
      from: fromKey,
      to: toKey,
      rate,
      benchmark,
      // Phase2で閾値が設定されるまでは pending
      status: benchmark === 0 ? 'pending' : calcStatus(rate, benchmark),
    })
  }

  return results
}

function calcStatus(
  rate: number,
  benchmark: number
): ConversionRate['status'] {
  // Phase2: ユーザーの判断軸に応じて調整
  if (rate >= benchmark * 1.1) return 'good'
  if (rate >= benchmark * 0.8) return 'warning'
  return 'critical'
}

function detectIssues(
  conversions: ConversionRate[],
  data: KpiData
): Issue[] {
  const issues: Issue[] = []

  for (const conv of conversions) {
    if (conv.status === 'pending') continue

    const logic = ISSUE_LOGIC[conv.to]
    const category = logic?.category ?? KPI_LABELS[conv.to]
    const fromLabel = KPI_LABELS[conv.from]
    const toLabel = KPI_LABELS[conv.to]

    if (conv.status === 'critical' || conv.status === 'warning') {
      issues.push({
        id: `conv_${conv.from}_${conv.to}`,
        severity: conv.status === 'critical' ? 'critical' : 'warning',
        category,
        description: `${fromLabel}→${toLabel}の転換率が低い（${conv.rate}% / 基準${conv.benchmark}%）`,
        detail: logic
          ? logic.detail(conv.rate, conv.benchmark)
          : `${fromLabel}→${toLabel}の転換率が${conv.rate}%（基準${conv.benchmark}%）です。`,
        mentionedInReport: null,
      })
    }
  }

  // ======================================================
  // 【最重要チェック】フルトーク以降で受注ゼロ
  // フルトークまで行ったら必ず受注につなげるのが大原則。
  // 宅内に入って受注ゼロは「めちゃくちゃやばい」最重大問題。
  // ======================================================
  if (data.inHomes > 0 && data.orders === 0) {
    issues.unshift({
      id: 'inhome_zero_orders',
      severity: 'critical',
      category: '宅内失注【最重大】',
      description: `宅内${data.inHomes}件入って受注ゼロ — 即日改善必須`,
      detail: `宅内に入ったら必ず受注につなげることが絶対原則です。${data.inHomes}件の宅内で受注ゼロという状況は最重大の問題です。各失注について、外的要因（お客さんの家庭環境・タイミング）なのか内的要因（自分のトークで取れたはず）なのかを今日中に分析し、日報に記録してください。内的要因が1件でもある場合は即ロープレで改善してください。`,
      mentionedInReport: null,
    })
  } else if (data.fullTalks > 0 && data.inHomes === 0 && data.orders === 0) {
    issues.unshift({
      id: 'fulltalk_zero_inhomes',
      severity: 'critical',
      category: 'フルトーク→宅内ゼロ【重大】',
      description: `フルトーク${data.fullTalks}件実施したが宅内・受注ゼロ`,
      detail: `フルトーク以降は全て受注まで意識することが大原則です。フルトーク${data.fullTalks}件で宅内に入れていない状況は重大な問題です。「中でゆっくり話しましょう」への誘導トークを即日リーダーと確認してください。`,
      mentionedInReport: null,
    })
  }

  // 訪問数絶対数チェック（稼働しているのに訪問が極端に少ない）
  // トップ平均3000/月 ≒ 1日150件 → 50件未満は要注意
  if (data.visits > 0 && data.visits < 50) {
    issues.push({
      id: 'low_visits',
      severity: 'warning',
      category: '行動量（稼働時間）',
      description: `訪問数が${data.visits}件と少ない（目安50件/日）`,
      detail: `本日の訪問数が${data.visits}件です。訪問数が少ない主な原因は「本人の力量不足」か「稼働時間の短さ」です。まず稼働時間を確認し、それでも少ない場合は行動の効率・スピードを見直してください。`,
      mentionedInReport: null,
    })
  }

  if (data.visits === 0) {
    issues.push({
      id: 'zero_visits',
      severity: 'critical',
      category: '行動量',
      description: '訪問数が0件',
      detail: 'そもそもの行動が発生していません。',
      mentionedInReport: null,
    })
  }

  // ======================================================
  // 【受注ルール】1日1件がマスト。受注ゼロは「終わり」
  // ======================================================

  // (a) 受注ゼロ → 常に critical（inhome_zero_orders / fulltalk_zero_inhomes と別IDで differentiate）
  if (data.orders === 0) {
    const alreadyHasInHomeIssue = issues.some(
      (i) => i.id === 'inhome_zero_orders' || i.id === 'fulltalk_zero_inhomes',
    )
    if (!alreadyHasInHomeIssue) {
      issues.unshift({
        id: 'orders_zero',
        severity: 'critical',
        category: '受注ゼロ【本日終了】',
        description: '本日受注ゼロ — 1日1件受注はマスト',
        detail:
          '1日1件の受注はミニマムマストです。今日は受注ゼロで終わっています。これは「終わり」の状態です。ファネルのどのステップで止まったかを今日中に特定し、明日の稼働前にリーダーへ報告・ロープレを実施してください。',
        mentionedInReport: null,
      })
    }
  }

  // (b) 見込みを作ったなら必ず翌日以降に受注へ繋げること
  if (data.prospects > 0 && data.orders === 0) {
    issues.unshift({
      id: 'prospects_no_orders',
      severity: 'critical',
      category: '見込みあり受注なし【要追撃】',
      description: `見込み${data.prospects}件があるのに受注ゼロ`,
      detail: `見込みを作ったならば、必ず受注まで持っていくことが原則です。見込み${data.prospects}件が受注に繋がっていません。「検討中」「前向き」で終わらせず、今日中に再訪・電話フォローの計画を立て、明日中に必ず受注を取ってください。見込みを見込みのまま放置することは認めません。`,
      mentionedInReport: null,
    })
  }

  // (c) 商談→見込みばかりで受注なし = 認めない
  if (data.negotiations > 0 && data.prospects > 0 && data.orders === 0) {
    // prospects_no_orders が既に追加されているのでメッセージを強化するためさらに追加
    issues.unshift({
      id: 'nego_no_orders',
      severity: 'critical',
      category: '商談・見込みあり受注ゼロ【論外】',
      description: `商談${data.negotiations}件・見込み${data.prospects}件で受注ゼロ`,
      detail: `商談まで設定し、見込みまで作りながら受注ゼロという状況は絶対に認められません。「商談して見込みになりました」は成果ではなく、受注になって初めて成果です。今日中にリーダーへ相談し、見込み客の落とし込みプランを具体的に立ててください。同じパターンを繰り返すのであればトーク全体を見直す必要があります。`,
      mentionedInReport: null,
    })
  }

  // ======================================================
  // 【ファネル連動ルール】絶対数ベースの追加チェック
  // ======================================================

  // visits多い(>100)のにnet_face少ない(net_face/visits < 2%)
  if (data.visits > 100) {
    const interphoneRate = data.visits > 0 ? (data.interphones / data.visits) * 100 : 0
    if (interphoneRate < 2) {
      issues.push({
        id: 'very_low_interphone',
        severity: 'critical',
        category: 'ピンポン数・エリア【深刻】',
        description: `訪問${data.visits}件に対しインターホン応答が${interphoneRate.toFixed(1)}%（基準2%未満）`,
        detail: `訪問数${data.visits}件という行動量があるにもかかわらず、インターホン応答率が${interphoneRate.toFixed(1)}%と極めて低い状態です。これはピンポン数が問題か、回っているエリアそのものに人がいない可能性が高いです。時間帯・エリアを根本から見直す必要があります。今日中にリーダーと「どこを・何時に・どう回るか」を再設計してください。`,
        mentionedInReport: null,
      })
    }
  }

  // net_face多い(>20)のにmain_face少ない(main_face/net_face < 30%)
  if (data.interphones > 20) {
    const facingRate = data.interphones > 0 ? (data.facings / data.interphones) * 100 : 0
    if (facingRate < 30) {
      issues.push({
        id: 'very_low_facing',
        severity: 'critical',
        category: 'インターホントーク【最悪レベル】',
        description: `インターホン${data.interphones}件に対し対面率${facingRate.toFixed(1)}%（基準30%未満）`,
        detail: `インターホンに${data.interphones}件応答してもらえているのに、対面（玄関に出てきてもらえる）率が${facingRate.toFixed(1)}%という状況はインターホントークが最悪レベルです。「玄関前に出てきてもらうための一言」が全く機能していません。今日稼働前に必ずリーダーとインターホントークの全文をロープレし、承認をもらってから出てください。`,
        mentionedInReport: null,
      })
    }
  }

  // main_face多い(>10)のにpresentations=0（紙プレなし）
  if (data.facings > 10 && data.presentations === 0) {
    issues.push({
      id: 'facing_no_presentation',
      severity: 'warning',
      category: '対面後アプローチ（紙プレ未実施）',
      description: `対面${data.facings}件あるのに紙プレ0件`,
      detail: `対面が${data.facings}件あるのに紙プレ（資料を使った商談入口）がゼロ件です。対面してからの第一声・アプローチで商談の入り口に進めていない状態です。対面→紙プレへの誘導トークをリーダーと確認してください。`,
      mentionedInReport: null,
    })
  }

  // negotiations>3かつorders=0
  if (data.negotiations > 3 && data.orders === 0) {
    issues.unshift({
      id: 'nego_zero_orders',
      severity: 'critical',
      category: '商談設定後受注ゼロ【論外】',
      description: `商談${data.negotiations}件設定して受注ゼロ`,
      detail: `商談を${data.negotiations}件も設定できているのに受注がゼロという状況は論外です。商談設定までの力はあるのに、クロージング（決断を促す最後の一押し）が全くできていません。今日中にクロージングトークをリーダーと徹底的にロープレしてください。「商談した」は成果ではありません。「受注した」が成果です。`,
      mentionedInReport: null,
    })
  }

  // ======================================================
  // 【行動量依存・訪問効率チェック】
  // ======================================================

  // 行動量依存型: 訪問が多いのに獲得率が低い
  if (data.visits >= 3000 && data.orders > 0) {
    const winRate = data.negotiations > 0 ? (data.orders / data.negotiations) * 100 : 0
    if (winRate < 15) {
      issues.push({
        id: 'volume_dependent',
        severity: 'warning',
        category: '行動量依存型（効率改善が必要）',
        description: `訪問${data.visits}件あるが獲得率${winRate.toFixed(1)}%は低水準`,
        detail: `訪問量${data.visits}件は十分ありますが、獲得率${winRate.toFixed(1)}%は低水準です。同じ訪問量でもクロージング精度を上げれば獲得数が2〜3倍になります。訪問量に頼った営業スタイルからの脱却が次のステップです。`,
        mentionedInReport: null,
      })
    }
  }

  // 訪問効率が低い: 1件獲得に1,000件超の訪問が必要な状態
  if (data.orders > 0) {
    const vpw = Math.round(data.visits / data.orders)
    if (vpw > 1000) {
      issues.push({
        id: 'low_visit_efficiency',
        severity: 'warning',
        category: '訪問効率が低い（1,000件超/獲得）',
        description: `1件獲得に${vpw}件の訪問が必要（TOP16基準: 243件）`,
        detail: `1件獲得するのに${vpw}件の訪問が必要な状態です（TOP16基準: 243件）。この差は商談率・獲得率の低さが原因です。`,
        mentionedInReport: null,
      })
    }
  }

  return issues
}

function evaluateThinkingDepth(
  report: string,
  issues: Issue[],
  lossAnalysis: LossAnalysis
): ReportThinkingDepth {
  if (!report || report.trim().length === 0) {
    return {
      score: 0,
      label: 'shallow',
      feedback: '日報が未記入です。振り返りが行われていません。',
    }
  }

  let score = 5 // ベーススコア（Phase2で調整）
  const unmentiond: string[] = []

  // 各課題が日報で言及されているか確認
  for (const issue of issues) {
    const mentioned = checkMentioned(report, issue.category)
    issue.mentionedInReport = mentioned
    if (!mentioned && issue.severity === 'critical') {
      score -= 3
      unmentiond.push(issue.category)
    } else if (!mentioned && issue.severity === 'warning') {
      score -= 1
      unmentiond.push(issue.category)
    } else if (mentioned) {
      score += 1
    }
  }

  // 原因分析の深さキーワード
  const analysisKeywords = [
    'なぜ', '原因', 'ため', 'から', 'ので', '改善', '課題',
    '時間帯', 'エリア', 'トーク', 'ロープレ', '断られ', '反応',
  ]
  const analysisCount = analysisKeywords.filter((k) => report.includes(k)).length
  if (analysisCount >= 3) score += 2
  else if (analysisCount >= 1) score += 1

  // 失注分析チェック（フルトーク以降で受注できなかった場合）
  if (lossAnalysis.severity !== 'none') {
    if (!lossAnalysis.externalFactorMentioned && !lossAnalysis.internalFactorMentioned) {
      score -= 2
      unmentiond.push('失注要因分析（外的/内的要因）')
    } else if (lossAnalysis.internalFactorMentioned && !lossAnalysis.internalFactorAnalyzed) {
      score -= 1
      unmentiond.push('内的要因の深掘り（なぜ取れなかったか）')
    } else if (lossAnalysis.internalFactorAnalyzed) {
      score += 1 // 内的要因を深掘りできている
    }
  }

  // 単なる結果報告だけで終わっているか判定（思考の浅さペナルティ）
  const shallowPatterns = ['頑張ります', '頑張った', '明日も', 'できました', 'しました']
  const deepPatterns = ['なぜなら', 'だから', 'したがって', 'このため', '改善策', '気づき']
  const isShallowOnly =
    shallowPatterns.some((k) => report.includes(k)) &&
    !deepPatterns.some((k) => report.includes(k)) &&
    report.trim().length < 150
  if (isShallowOnly) score -= 2

  const clamped = Math.max(0, Math.min(10, score))

  let label: ReportThinkingDepth['label']
  let feedback: string

  if (clamped <= 3) {
    label = 'shallow'
    feedback =
      unmentiond.length > 0
        ? `数値上の課題（${unmentiond.join('、')}）に対して日報で言及がありません。課題に対して分析がなく、問題意識が見られません。今すぐリーダーに確認してください。`
        : '課題に対して分析がなく、問題意識が見られません。今すぐリーダーに確認してください。'
  } else if (clamped <= 6) {
    label = 'average'
    feedback =
      unmentiond.length > 0
        ? `${unmentiond.join('、')}の課題への言及を日報に追加するとさらに良くなります。`
        : '基本的な振り返りはできています。原因の深掘りをさらに意識してください。'
  } else {
    label = 'deep'
    feedback = '課題に対する振り返りができています。この思考習慣を継続してください。'
  }

  return { score: clamped, label, feedback }
}

// 各課題カテゴリに紐づく検索キーワード群
const MENTION_KEYWORDS: Record<string, string[]> = {
  'エリア・時間帯の選定': ['時間帯', 'エリア', '留守', '応答', '人がいない', 'タイミング', '朝', '夕方', '昼'],
  'インターホン越しのトーク': ['インターホン', 'ピンポン', '断られ', '玄関', '出てきてもらえ', 'トーク'],
  '対面後のアプローチトーク': ['対面', 'アプローチ', '第一声', '紙プレ', '資料'],
  '紙プレ（資料説明）の質': ['紙プレ', '資料', 'プレゼン', 'フルトーク', '説明'],
  'フルトークの質・宅内誘導': ['フルトーク', '宅内', '中で', '誘導'],
  '宅内トーク（商談設定）': ['宅内', '商談', '提案', 'ヒアリング'],
  'クロージングトーク【最優先改善】': ['クロージング', '見込み', '決め', '落とし込み', '失注'],
  '落とし込みトーク（最後の一押し）': ['受注', '落とし込み', '一押し', '見込み', 'フォロー'],
  '行動量（稼働時間）': ['訪問', '稼働', '行動量', '件数'],
  '行動量（ピンポン数）': ['ピンポン', 'インターホン', '行動量'],
  '宅内失注【最重大】': ['失注', '宅内', '受注', '外的', '内的', '取れなかった', '断られ'],
  'フルトーク→宅内ゼロ【重大】': ['フルトーク', '宅内', '誘導', '中で', '入れなかった'],
  '受注ゼロ【本日終了】': ['受注', '獲得', '決まらなかった', '取れなかった', '0件', 'ゼロ'],
  '見込みあり受注なし【要追撃】': ['見込み', 'フォロー', '再訪', '落とし込み', '受注'],
  '商談・見込みあり受注ゼロ【論外】': ['商談', '見込み', '受注', 'クロージング', '落とし込み'],
  '商談設定後受注ゼロ【論外】': ['商談', '受注', 'クロージング', '落とし込み', '決め'],
  'ピンポン数・エリア【深刻】': ['エリア', '時間帯', 'ピンポン', 'インターホン', '留守', '応答'],
  'インターホントーク【最悪レベル】': ['インターホン', 'ピンポン', 'トーク', '玄関', '対面', 'ロープレ'],
  '対面後アプローチ（紙プレ未実施）': ['紙プレ', '対面', 'アプローチ', '資料', '第一声'],
}

function checkMentioned(report: string, category: string): boolean {
  const keywords = MENTION_KEYWORDS[category]
  if (keywords) {
    return keywords.some((k) => report.includes(k))
  }
  // フォールバック: カテゴリ名の単語をキーワードに
  const fallback = category.replace(/[（）()【】]/g, ' ').split(/\s+/)
  return fallback.some((k) => k.length > 1 && report.includes(k))
}

function generateActionItems(issues: Issue[]): ActionItem[] {
  const items: ActionItem[] = []

  for (const issue of issues) {
    // 問題IDからKPIキーを逆引き
    const toKey = issue.id.replace('conv_', '').split('_').slice(1).join('_') as KpiLabel
    const logic = ISSUE_LOGIC[toKey]

    if (issue.severity === 'critical') {
      items.push({
        id: `today_${issue.id}`,
        period: 'today',
        priority: 'urgent',
        action: logic?.todayAction ?? `【即対応】${issue.category}のロープレを実施する。不明点があればリーダーに確認する。`,
        relatedIssueId: issue.id,
      })
      items.push({
        id: `week_${issue.id}`,
        period: 'week',
        priority: 'high',
        action: logic?.weekAction ?? `${issue.category}の改善状況を毎日数値で確認し、転換率の変化を記録する。`,
        relatedIssueId: issue.id,
      })
      items.push({
        id: `month_${issue.id}`,
        period: 'month',
        priority: 'high',
        action: logic?.monthAction ?? `${issue.category}の転換率を基準値以上に引き上げることを月次目標とする。`,
        relatedIssueId: issue.id,
      })
    }

    if (issue.severity === 'warning') {
      items.push({
        id: `week_warn_${issue.id}`,
        period: 'week',
        priority: 'normal',
        action: logic?.weekAction ?? `${issue.category}に意識を向けてトークを試行錯誤する。`,
        relatedIssueId: issue.id,
      })
      items.push({
        id: `month_warn_${issue.id}`,
        period: 'month',
        priority: 'normal',
        action: logic?.monthAction ?? `${issue.category}の転換率改善を今月の取り組みの一つとする。`,
        relatedIssueId: issue.id,
      })
    }
  }

  // 半期アクション（問題に関わらず固定）
  items.push({
    id: 'half_year_base',
    period: 'half_year',
    priority: 'normal',
    action: 'トッププレイヤー水準（訪問250件で1件受注）を半期目標として設定し、全ファネルの転換率を基準値以上に引き上げる。',
  })

  return items
}

function trackProgress(
  todayIssues: Issue[],
  history: KpiData[]
): ProgressRecord[] {
  // Phase2: 過去履歴データを使って継続課題を検出
  // 現在はプレースホルダー構造
  return todayIssues.map((issue) => ({
    issueId: issue.id,
    dates: [], // Phase2で履歴から取得
    isRepeating: false,
    trend: 'new' as const,
  }))
}

function buildSummary(
  issues: Issue[],
  depth: ReportThinkingDepth,
  winsStatus: AnalysisResult['winsStatus']
): string {
  const parts: string[] = []

  if (winsStatus === 'critical') {
    parts.push('【最重要】フルトーク以降に到達したが受注ゼロ。失注要因を即日分析・改善してください')
  } else if (winsStatus === 'good') {
    parts.push('受注あり。まず件数を確認し、さらに転換率を高めていきましょう')
  }

  const critical = issues.filter((i) => i.severity === 'critical' && i.id !== 'inhome_zero_orders' && i.id !== 'fulltalk_zero_inhomes')
  const warnings = issues.filter((i) => i.severity === 'warning')

  if (critical.length > 0) {
    parts.push(`早急な改善が必要な課題: ${critical.map((i) => i.category).join('、')}`)
  }
  if (warnings.length > 0) {
    parts.push(`注意が必要な課題: ${warnings.map((i) => i.category).join('、')}`)
  }
  if (depth.label === 'shallow') {
    parts.push('日報の振り返りが浅いため、思考の拡張が必要です')
  }

  if (parts.length === 0) {
    return '本日の数値に大きな課題は検出されませんでした。この調子で継続してください。'
  }

  return parts.join('。') + '。'
}

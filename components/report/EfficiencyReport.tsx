import { KpiData, AnalysisResult } from '@/lib/types'

type Props = {
  data: KpiData
  analysis: AnalysisResult
}

// TOP16基準値
const TOP16_VISITS_PER_WIN = 243
const LOW_PERFORMER_VISITS_PER_WIN = 1168
const TOP16_FACING_RATE = 55   // 対面率 %
const TOP16_NEGO_RATE = 62     // 商談率 %
const TOP16_WIN_RATE = 31      // 獲得率 %

type StyleColor = 'green' | 'blue' | 'yellow' | 'gray'

const STYLE_BADGE: Record<StyleColor, string> = {
  green:  'bg-green-100 text-green-800 border border-green-200',
  blue:   'bg-blue-100 text-blue-800 border border-blue-200',
  yellow: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  gray:   'bg-gray-100 text-gray-600 border border-gray-200',
}

const SCORE_COLOR = {
  good:    'text-green-700 bg-green-50',
  warning: 'text-yellow-700 bg-yellow-50',
  bad:     'text-red-700 bg-red-50',
}

function calcSalesStyle(
  winRate: number,
  negoRate: number,
  visits: number,
): { style: string; styleColor: StyleColor; nextGoal: string } {
  if (winRate >= 35 && negoRate >= 55) {
    return {
      style: '精度型',
      styleColor: 'green',
      nextGoal:
        '訪問量を増やせばさらに件数が跳ねます。獲得率を維持しながら月3,000件訪問を目指してください。',
    }
  }
  if (visits >= 3000 && winRate >= 25 && negoRate >= 55) {
    return {
      style: 'バランス型（TOP16水準）',
      styleColor: 'blue',
      nextGoal:
        '訪問量・精度ともに高水準。訪問数を減らしながら獲得数を維持する「精度型」への進化を目指してください。',
    }
  }
  if (visits >= 3000 && winRate < 20) {
    return {
      style: '行動量型（訪問量依存）',
      styleColor: 'yellow',
      nextGoal:
        '訪問量はある。しかし商談率・獲得率が低く非効率。クロージングトークを最優先で改善してください。',
    }
  }
  return {
    style: '成長中（基準以下）',
    styleColor: 'gray',
    nextGoal:
      'まず訪問量を2,000件/月に。同時に対面率55%・商談率62%を目標にしてください。',
  }
}

// セクション1: 営業効率スコアのバー表示
function EfficiencyBar({ visitsPerWin }: { visitsPerWin: number }) {
  // TOP16: 243, 低パフォーマー: 1168 を両端として正規化
  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)
  const range = LOW_PERFORMER_VISITS_PER_WIN - TOP16_VISITS_PER_WIN

  const myWidth   = Math.round((1 - (clamp(visitsPerWin, TOP16_VISITS_PER_WIN, LOW_PERFORMER_VISITS_PER_WIN) - TOP16_VISITS_PER_WIN) / range) * 100)
  const top16Width = 100
  const lowWidth   = 0

  const scoreClass =
    visitsPerWin <= 300
      ? SCORE_COLOR.good
      : visitsPerWin <= 600
      ? SCORE_COLOR.warning
      : SCORE_COLOR.bad

  const barColor =
    visitsPerWin <= 300
      ? 'bg-green-500'
      : visitsPerWin <= 600
      ? 'bg-yellow-400'
      : 'bg-red-400'

  return (
    <div className="space-y-3">
      {/* 自分 */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-600 font-medium">自分</span>
          <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${scoreClass}`}>
            {visitsPerWin}件 / 獲得1件
          </span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${myWidth}%` }}
          />
        </div>
      </div>
      {/* TOP16 */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-500">TOP16基準</span>
          <span className="font-medium text-gray-500">{TOP16_VISITS_PER_WIN}件 / 獲得1件</span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-green-200" style={{ width: `${top16Width}%` }} />
        </div>
      </div>
      {/* 低パフォーマー */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-400">低パフォーマー平均</span>
          <span className="text-gray-400">{LOW_PERFORMER_VISITS_PER_WIN}件 / 獲得1件</span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gray-200" style={{ width: `${lowWidth}%` }} />
        </div>
      </div>
    </div>
  )
}

// セクション3: シミュレーター1行
function SimRow({
  label,
  orders,
  baseOrders,
  detail,
}: {
  label: string
  orders: number
  baseOrders: number
  detail: string
}) {
  const diff = orders - baseOrders
  const pct = baseOrders > 0 ? Math.round((diff / baseOrders) * 100) : 0
  const isImproved = diff > 0

  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <div className="min-w-0 flex-1">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <p className="text-xs text-gray-500 mt-0.5">{detail}</p>
      </div>
      <div className="text-right shrink-0">
        <span className="text-sm font-bold text-gray-800">{orders.toFixed(1)}件</span>
        {isImproved && (
          <span className="ml-1.5 text-xs font-bold text-green-600">+{pct}%</span>
        )}
      </div>
    </div>
  )
}

export function EfficiencyReport({ data, analysis }: Props) {
  // --- セクション1: 営業効率スコア ---
  const visitsPerWin = data.orders > 0 ? Math.round(data.visits / data.orders) : null

  // --- セクション2: 営業スタイル判定 ---
  const winRate  = analysis.conversions.find((c) => c.to === 'orders')?.rate ?? 0
  const negoRate = analysis.conversions.find((c) => c.to === 'negotiations')?.rate ?? 0
  const { style, styleColor, nextGoal } = calcSalesStyle(winRate, negoRate, data.visits)

  // --- セクション3: 効率改善シミュレーター ---
  // 現在の各ステップ値
  const V  = data.visits
  const IP = data.interphones
  const F  = data.facings
  const N  = data.negotiations
  const O  = data.orders

  // 現状獲得数（端数を持つ理論値として表示）
  const currentOrders = O

  // TOP16水準に各率を改善した場合
  // 対面率55%: facings = interphones * 0.55 → negotiations = F_new * (N/F) → orders = N_new * (O/N)
  const facingImprovedF  = IP > 0 ? IP * (TOP16_FACING_RATE / 100) : F
  const facingImprovedN  = F  > 0 ? facingImprovedF * (N / F)  : N
  const facingImprovedO  = N  > 0 ? facingImprovedN * (O / N)  : facingImprovedN * (TOP16_WIN_RATE / 100)

  // 商談率62%: negotiations = facings * 0.62 → orders = N_new * (O/N)
  const negoImprovedN = F > 0 ? F * (TOP16_NEGO_RATE / 100) : N
  const negoImprovedO = N > 0 ? negoImprovedN * (O / N) : negoImprovedN * (TOP16_WIN_RATE / 100)

  // 獲得率31%: orders = negotiations * 0.31
  const winImprovedO = N * (TOP16_WIN_RATE / 100)

  // 現状のファネルを文字列で組み立て
  const funnelParts: string[] = []
  funnelParts.push(`訪問${V}件`)
  funnelParts.push(`インターホン${IP}件`)
  funnelParts.push(`対面${F}件`)
  if (data.negotiations > 0) funnelParts.push(`商談${N}件`)
  funnelParts.push(`受注${O}件`)
  const currentFunnel = funnelParts.join(' → ')

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-gray-800 border-b-2 border-indigo-500 pb-1 mb-4">
        営業効率レポート
      </h2>

      <p className="text-xs text-gray-500 mb-4">
        「訪問量型から精度型への成長」を可視化します。訪問数を増やすより、1回の対面で獲得できる確率を上げることが長期的な成長につながります。
      </p>

      {/* セクション1: 営業効率スコア */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3">
          1. 営業効率スコア
          <span className="ml-2 text-xs font-normal text-gray-400">（訪問何件で1件獲得できるか）</span>
        </h3>

        {visitsPerWin !== null ? (
          <EfficiencyBar visitsPerWin={visitsPerWin} />
        ) : (
          <p className="text-sm text-gray-400">
            受注ゼロのため算出できません。（TOP16基準: {TOP16_VISITS_PER_WIN}件 / 獲得1件）
          </p>
        )}

        {visitsPerWin !== null && (
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400" />
            ≤300件: TOP16水準
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400 ml-2" />
            ≤600件: 要注意
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400 ml-2" />
            &gt;600件: 要改善
          </div>
        )}
      </div>

      {/* セクション2: 営業スタイル判定 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3">
          2. 営業スタイル判定
        </h3>

        <div className="flex items-center gap-3 mb-3">
          <span
            className={`text-sm font-bold px-3 py-1 rounded-full ${STYLE_BADGE[styleColor]}`}
          >
            {style}
          </span>
          <div className="text-xs text-gray-500">
            獲得率: <span className="font-bold text-gray-700">{winRate.toFixed(1)}%</span>
            　商談率: <span className="font-bold text-gray-700">{negoRate.toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-xs text-gray-700 leading-relaxed">{nextGoal}</p>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-400">
          <div>精度型基準: 獲得率≥35% / 商談率≥55%</div>
          <div>バランス型基準: 訪問≥3,000 / 獲得率≥25%</div>
          <div>行動量型: 訪問≥3,000 / 獲得率&lt;20%</div>
        </div>
      </div>

      {/* セクション3: 効率改善シミュレーター */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-1">
          3. 効率改善シミュレーター
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          現在の訪問数（{V}件）を固定して、各転換率をTOP16水準に改善した場合の理論獲得数を試算します。
        </p>

        {/* 現状ファネル */}
        <div className="bg-indigo-50 rounded-md px-3 py-2 mb-3">
          <p className="text-xs text-indigo-700 font-medium">現状: {currentFunnel}</p>
        </div>

        <div className="space-y-0">
          <SimRow
            label="現状（実績）"
            orders={currentOrders}
            baseOrders={currentOrders}
            detail={`訪問${V}件 → 対面${F}件 → 商談${N}件 → 受注${O}件`}
          />
          <SimRow
            label={`対面率を${TOP16_FACING_RATE}%に改善した場合`}
            orders={facingImprovedO}
            baseOrders={currentOrders}
            detail={`対面${facingImprovedF.toFixed(0)}件 → 商談${facingImprovedN.toFixed(0)}件 → 受注↑（現状 対面率: ${IP > 0 ? ((F / IP) * 100).toFixed(1) : '—'}%）`}
          />
          <SimRow
            label={`商談率を${TOP16_NEGO_RATE}%に改善した場合`}
            orders={negoImprovedO}
            baseOrders={currentOrders}
            detail={`商談${negoImprovedN.toFixed(0)}件 → 受注↑（現状 商談率: ${F > 0 ? ((N / F) * 100).toFixed(1) : '—'}%）`}
          />
          <SimRow
            label={`獲得率を${TOP16_WIN_RATE}%に改善した場合`}
            orders={winImprovedO}
            baseOrders={currentOrders}
            detail={`商談${N}件 × ${TOP16_WIN_RATE}% → 受注↑（現状 獲得率: ${N > 0 ? ((O / N) * 100).toFixed(1) : '—'}%）`}
          />
        </div>

        <p className="text-xs text-gray-400 mt-3">
          ※ 試算は各率を単独で改善した場合の理論値です。複合改善時はさらに効果が高まります。
        </p>
      </div>
    </section>
  )
}

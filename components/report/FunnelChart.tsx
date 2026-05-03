import { KpiData, AnalysisResult, ConversionRate, KpiLabel, FUNNEL_STEPS, KPI_LABELS } from '@/lib/types'

type Props = {
  data: KpiData
  analysis: AnalysisResult
}

// ステップ表示名（KPI_LABELS より短い表記に統一）
const STEP_LABELS: Record<KpiLabel, string> = {
  visits:        '訪問',
  interphones:   'インターホン',
  facings:       '対面',
  presentations: '紙プレ',
  fullTalks:     'フルトーク',
  inHomes:       '宅内',
  negotiations:  '商談',
  prospects:     '見込み',
  orders:        '受注',
}

// ステップ間の矢印ラベル
const TRANSITION_LABELS: Partial<Record<KpiLabel, string>> = {
  interphones:   'ネット対面率',
  facings:       '対面率',
  presentations: '紙プレ率',
  fullTalks:     'フルトーク率',
  inHomes:       '宅内率',
  negotiations:  '商談率',
  prospects:     '見込み率',
  orders:        '受注率',
}

// ステータス → Tailwind クラスのマッピング
const STATUS_COLORS: Record<ConversionRate['status'], {
  bar: string
  text: string
  badge: string
  bg: string
  border: string
}> = {
  good:    { bar: 'bg-green-500',  text: 'text-green-700',  badge: 'bg-green-100 text-green-800 border-green-200',  bg: 'bg-green-50',  border: 'border-green-200' },
  warning: { bar: 'bg-yellow-400', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800 border-yellow-200', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  critical:{ bar: 'bg-red-400',    text: 'text-red-700',    badge: 'bg-red-100 text-red-800 border-red-200',    bg: 'bg-red-50',    border: 'border-red-200' },
  pending: { bar: 'bg-gray-200',   text: 'text-gray-400',   badge: 'bg-gray-100 text-gray-500 border-gray-200',   bg: 'bg-gray-50',   border: 'border-gray-200' },
}

const STATUS_LABELS: Record<ConversionRate['status'], string> = {
  good:    'TOP16超え',
  warning: '基準80%以上',
  critical:'要改善',
  pending: '未入力',
}

// 件数 → ファネル幅（最大値を100%として相対化）
function getFunnelWidthPercent(value: number, maxValue: number): number {
  if (maxValue === 0) return 10
  return Math.max(10, Math.round((value / maxValue) * 100))
}

type TransitionRowProps = {
  conv: ConversionRate
  toKey: KpiLabel
}

function TransitionRow({ conv, toKey }: TransitionRowProps) {
  const colors = STATUS_COLORS[conv.status]
  const label = TRANSITION_LABELS[toKey] ?? `→ ${STEP_LABELS[toKey]}率`
  const isPending = conv.status === 'pending'

  // バー幅計算（自分 vs TOP16 の最大を100として相対化）
  const maxRate = Math.max(conv.rate, conv.benchmark, 0.001)
  const myWidth   = isPending ? 0 : Math.min((conv.rate / maxRate) * 100, 100)
  const benchWidth = conv.benchmark > 0 ? Math.min((conv.benchmark / maxRate) * 100, 100) : 0

  return (
    <div className="flex flex-col items-center py-2 px-3">
      {/* 矢印 */}
      <div className="w-px h-3 bg-gray-300" />
      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-300 mb-1" />

      {/* 転換率カード */}
      <div className={`w-full rounded-lg border px-3 py-2 ${colors.bg} ${colors.border}`}>
        {/* ヘッダー行 */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-gray-600">{label}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full border font-bold ${colors.badge}`}>
            {STATUS_LABELS[conv.status]}
          </span>
        </div>

        {isPending ? (
          <p className="text-xs text-gray-400">前後どちらかが未入力のため算出不可</p>
        ) : (
          <>
            {/* 自分のバー */}
            <div className="mb-1">
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="text-gray-500 w-10 shrink-0">自分</span>
                <span className={`font-bold ${colors.text}`}>{conv.rate.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-white rounded-full overflow-hidden border border-gray-200">
                <div
                  className={`h-full rounded-full ${colors.bar}`}
                  style={{ width: `${myWidth}%` }}
                />
              </div>
            </div>

            {/* TOP16バー */}
            {conv.benchmark > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <span className="text-gray-400 w-10 shrink-0">TOP16</span>
                  <span className="text-gray-400 font-medium">{conv.benchmark.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-white rounded-full overflow-hidden border border-gray-200">
                  <div
                    className="h-full rounded-full bg-gray-300"
                    style={{ width: `${benchWidth}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 矢印下 */}
      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-300 mt-1" />
      <div className="w-px h-3 bg-gray-300" />
    </div>
  )
}

type StepCardProps = {
  stepKey: KpiLabel
  value: number
  widthPercent: number
  isFirst: boolean
  isLast: boolean
}

function StepCard({ stepKey, value, widthPercent, isFirst, isLast }: StepCardProps) {
  const isEmpty = value === 0 && !isFirst

  return (
    <div className="flex flex-col items-center">
      {/* ファネル形状の外枠（幅で視覚的に絞る） */}
      <div
        className="transition-all"
        style={{ width: `${widthPercent}%`, minWidth: '60%' }}
      >
        <div
          className={`
            flex items-center justify-between px-4 py-3 rounded-lg border-2
            ${isEmpty
              ? 'bg-gray-50 border-gray-200'
              : isLast
                ? 'bg-blue-50 border-blue-300'
                : isFirst
                  ? 'bg-gray-100 border-gray-300'
                  : 'bg-white border-gray-300'
            }
          `}
        >
          <div className="flex items-center gap-2">
            {/* ステップ番号 */}
            <span className="text-xs font-bold text-gray-400 w-5 text-center">
              {FUNNEL_STEPS.indexOf(stepKey) + 1}
            </span>
            <span className={`text-sm font-bold ${isEmpty ? 'text-gray-400' : isLast ? 'text-blue-700' : 'text-gray-800'}`}>
              {STEP_LABELS[stepKey]}
            </span>
            {isEmpty && (
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                未入力
              </span>
            )}
          </div>
          <div className="text-right">
            <span className={`text-lg font-bold tabular-nums ${isEmpty ? 'text-gray-300' : isLast ? 'text-blue-600' : 'text-gray-900'}`}>
              {value.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400 ml-0.5">件</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function FunnelChart({ data, analysis }: Props) {
  // conversions を from→to のマップに変換
  const convMap = new Map<string, ConversionRate>()
  for (const conv of analysis.conversions) {
    convMap.set(`${conv.from}_${conv.to}`, conv)
  }

  // ファネル全体の最大値（訪問数 = 先頭）
  const maxValue = data[FUNNEL_STEPS[0]] as number

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-gray-800 border-b-2 border-blue-500 pb-1 mb-1">
        営業ファネル分析
      </h2>
      <p className="text-xs text-gray-500 mb-5">
        各ステップの件数と転換率をTOP16ベンチマーク（トッププレイヤー16名平均）と比較します。
        緑=超過、黄=基準80%以上、赤=要改善、灰=データなし。
      </p>

      <div className="flex flex-col items-stretch">
        {FUNNEL_STEPS.map((stepKey, idx) => {
          const value = data[stepKey] as number
          const widthPercent = getFunnelWidthPercent(value, maxValue)

          return (
            <div key={stepKey}>
              {/* ステップカード */}
              <StepCard
                stepKey={stepKey}
                value={value}
                widthPercent={widthPercent}
                isFirst={idx === 0}
                isLast={idx === FUNNEL_STEPS.length - 1}
              />

              {/* ステップ間の転換率表示（最後のステップには不要） */}
              {idx < FUNNEL_STEPS.length - 1 && (() => {
                const nextKey = FUNNEL_STEPS[idx + 1]
                const conv = convMap.get(`${stepKey}_${nextKey}`)
                if (!conv) return null
                return (
                  <TransitionRow
                    key={`transition_${stepKey}_${nextKey}`}
                    conv={conv}
                    toKey={nextKey}
                  />
                )
              })()}
            </div>
          )
        })}
      </div>

      {/* 凡例 */}
      <div className="mt-5 flex flex-wrap gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
          <span>TOP16超え（基準×110%以上）</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-yellow-400" />
          <span>基準80%以上</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-red-400" />
          <span>要改善（基準80%未満）</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-gray-200" />
          <span>未入力</span>
        </div>
      </div>
    </section>
  )
}

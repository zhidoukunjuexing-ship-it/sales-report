// 組織図: メンバー名 → 責任者情報のマッピング
// ※ 実際の組織図・メンバー名・メールアドレスは後で設定
export type Manager = {
  name: string
  email: string
}

export type OrgChartEntry = {
  memberName: string
  manager: Manager
}

// TODO: 実際の組織図・メールアドレスに差し替える
export const ORG_CHART: OrgChartEntry[] = [
  {
    memberName: '山田太郎',
    manager: { name: '責任者A', email: 'manager-a@example.com' },
  },
  {
    memberName: '鈴木花子',
    manager: { name: '責任者B', email: 'manager-b@example.com' },
  },
]

export function getManager(memberName: string): Manager | null {
  const entry = ORG_CHART.find((e) => e.memberName === memberName)
  return entry?.manager ?? null
}

// 責任者ごとに担当メンバーをグループ化
export function groupByManager(memberNames: string[]): Map<Manager, string[]> {
  const map = new Map<string, { manager: Manager; members: string[] }>()

  for (const name of memberNames) {
    const manager = getManager(name)
    if (!manager) continue
    const key = manager.email
    if (!map.has(key)) {
      map.set(key, { manager, members: [] })
    }
    map.get(key)!.members.push(name)
  }

  const result = new Map<Manager, string[]>()
  for (const { manager, members } of map.values()) {
    result.set(manager, members)
  }
  return result
}

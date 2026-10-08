import type { MatchRecord } from '../api/types'
import { LOCAL_PLAYER_ID, rankingFixtures } from './fixtures'

const CONFIRMED_KEY = 'pirate-battle:confirmed-matches'

function loadConfirmed(): MatchRecord[] {
  try {
    const raw = localStorage.getItem(CONFIRMED_KEY)
    return raw ? (JSON.parse(raw) as MatchRecord[]) : []
  } catch {
    return []
  }
}

function saveConfirmed(records: MatchRecord[]): void {
  localStorage.setItem(CONFIRMED_KEY, JSON.stringify(records))
}

export function sameMatchConfig(
  left: MatchRecord['config'],
  right: MatchRecord['config'],
): boolean {
  return (
    left.sessionTimeSeconds === right.sessionTimeSeconds &&
    left.enemySpawnIntervalSeconds === right.enemySpawnIntervalSeconds
  )
}

export function listRankingRecords(config?: MatchRecord['config']): MatchRecord[] {
  const all = [...rankingFixtures, ...loadConfirmed()]
  const filtered = config
    ? all.filter((record) => sameMatchConfig(record.config, config))
    : all
  return filtered.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (a.finishedAt !== b.finishedAt) {
      return a.finishedAt.localeCompare(b.finishedAt)
    }
    return a.matchId.localeCompare(b.matchId)
  })
}

export function listHistoryRecords(): MatchRecord[] {
  return loadConfirmed()
    .filter((record) => record.playerId === LOCAL_PLAYER_ID)
    .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))
}

export function upsertMatch(record: MatchRecord): MatchRecord {
  const existing = loadConfirmed()
  const index = existing.findIndex((item) => item.matchId === record.matchId)
  if (index >= 0) {
    return existing[index]!
  }
  const next = [...existing, record]
  saveConfirmed(next)
  return record
}

export function resetMockStore(): void {
  localStorage.removeItem(CONFIRMED_KEY)
}

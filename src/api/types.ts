import type { GameConfig } from '../game/config'
import type { MatchEndReason } from '../persist/playerOptions'

export type MatchRecord = {
  matchId: string
  playerId: string
  playerName: string
  score: number
  durationSeconds: number
  reason: Exclude<MatchEndReason, 'abandoned'>
  finishedAt: string
  config: Pick<GameConfig, 'sessionTimeSeconds' | 'enemySpawnIntervalSeconds'>
}

export type Paginated<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export type CreateMatchPayload = Omit<MatchRecord, 'playerName'>
